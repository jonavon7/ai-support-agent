import Anthropic from "@anthropic-ai/sdk";
import type {
    ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages/messages";
import type { GetCustomer } from "../application/get-customer.js";
import type { GetSubscription } from "../application/get-subscription.js";
import type { CreateSupportTicket } from "../application/create-support-ticket.js";
import { executeTool } from "./dispatcher/execute-tool.js";
import { getCustomerToolDefinition } from "./tools/get-customer.tool.js";
import { getSubscriptionToolDefinition } from "./tools/get-subscription.tool.js";
import { createSupportTicketToolDefinition } from "./tools/create-support-ticket.tool.js";
import { ApplicationError } from "../application/errors/application-error.js";
import type { AgentInput, AgentResult, AgentState, AgentToolCall, PendingAction } from "./support-agent.types.js";
import { isRequestCancelSubscriptionResult, requestCancelSubscriptionToolDefinition } from "./tools/request-cancel-subscription.tool.js";
import type { CancelSubscription } from "../application/cancel-subscription.js";
import { DomainError } from "../domain/errors/domain-error.js";
import type { Subscription } from "../domain/subscription.js";
import type { PrepareSubscriptionCancellation } from "../application/prepare-subscription-cancellation.js";

type SupportAgentDependencies = {
    getCustomer: GetCustomer;
    getSubscription: GetSubscription;
    createSupportTicket: CreateSupportTicket;
    cancelSubscription: CancelSubscription;
    prepareSubscriptionCancellation: PrepareSubscriptionCancellation;
};

function isExpectedError(error: unknown): error is ApplicationError | DomainError {
    return (
        error instanceof ApplicationError ||
        error instanceof DomainError
    );
}

export class SupportAgent {
    private readonly client: Anthropic;
    private static readonly MAX_ITERATIONS = 8;

    constructor(
        private readonly dependencies: SupportAgentDependencies,
        apiKey: string,
    ) {
        this.client = new Anthropic({ apiKey });
    }

    private async executePendingAction(action: PendingAction): Promise<Subscription> {
        switch (action.type) {
            case "cancel_subscription":
                return this.dependencies.cancelSubscription.execute({
                    customerId: action.customerId,
                });
        }
    }

    private createDeterministicResult(output: string, state: AgentState, toolCalls: AgentToolCall[]): AgentResult {
        state.messages.push({
            role: "assistant",
            content: output,
        });

        return {
            output,
            toolCalls,
            iterations: 0,
            state,
        };
    }

    async run(input: AgentInput): Promise<AgentResult> {
        const toolCalls: AgentToolCall[] = [];
        const agentState: AgentState = input.state
            ? {
                ...input.state,
                messages: [
                    ...input.state.messages,
                    {
                        role: "user",
                        content: input.message,
                    },
                ],
            }
            : {
                messages: [
                    {
                        role: "user",
                        content: input.message,
                    },
                ],
            };

        const messages = agentState.messages;

        if (agentState.pendingAction) {
            const command = input.message.trim().toUpperCase();
            switch (command) {
                case "CONFIRM": {
                    try {
                        const action = agentState.pendingAction;
                        const result = await this.executePendingAction(action);
                        delete agentState.pendingAction;
                        return this.createDeterministicResult(
                            `Subscription for ${result.customerId} was cancelled successfully.`,
                            agentState,
                            toolCalls,
                        );
                    } catch (error) {
                        if (isExpectedError(error)) {
                            delete agentState.pendingAction;
                            return this.createDeterministicResult(
                                error.message,
                                agentState,
                                toolCalls,
                            );

                        }
                        console.error(error);
                        throw new Error(
                            "Unexpected pending action execution failure",
                            { cause: error }
                        );
                    }
                }
                case "CANCEL": {
                    delete agentState.pendingAction;
                    return this.createDeterministicResult(
                        "Subscription cancellation request has been cancelled.",
                        agentState,
                        toolCalls,
                    );

                }
                default: {
                    return this.createDeterministicResult(
                        "A subscription cancellation is pending. Reply CONFIRM to proceed or CANCEL to discard it.",
                        agentState,
                        toolCalls,
                    );

                }
            }
        }

        for (let iteration = 0; iteration < SupportAgent.MAX_ITERATIONS; iteration++) {
            const response = await this.client.messages.create({
                model: "claude-haiku-4-5",
                max_tokens: 1024,
                tools: [
                    getCustomerToolDefinition,
                    getSubscriptionToolDefinition,
                    createSupportTicketToolDefinition,
                    requestCancelSubscriptionToolDefinition,
                ],
                messages,
            });

            console.dir(
                { stopReason: response.stop_reason, content: response.content },
                { depth: null }
            );

            messages.push({
                role: "assistant",
                content: response.content,
            });

            if (response.stop_reason === "end_turn") {
                const finalText = response.content
                    .filter((block) => block.type === "text")
                    .map((block) => block.text)
                    .join("\n");

                if (!finalText) {
                    throw new Error("Agent finished without a final text response");
                }

                return {
                    output: finalText,
                    toolCalls,
                    iterations: iteration + 1,
                    state: agentState,
                };
            }

            if (response.stop_reason === "max_tokens") {
                throw new Error("Model response was truncated");
            }

            if (response.stop_reason === "tool_use") {
                const toolUses = response.content.filter(
                    (block) => block.type === "tool_use",
                );

                const toolResults: ToolResultBlockParam[] = [];

                for (const toolUse of toolUses) {
                    try {
                        console.dir(
                            { toolName: toolUse.name, toolInput: toolUse.input },
                            { depth: null }
                        );

                        const result = await executeTool(
                            toolUse.name,
                            toolUse.input,
                            this.dependencies,
                        );

                        if (isRequestCancelSubscriptionResult(result)) {
                            agentState.pendingAction = result.action;
                        }

                        toolResults.push({
                            type: "tool_result",
                            tool_use_id: toolUse.id,
                            content: JSON.stringify(result),
                        });

                        toolCalls.push({
                            name: toolUse.name,
                            input: toolUse.input,
                            success: true,
                            result,
                        });
                    } catch (error) {
                        if (isExpectedError(error)) {
                            toolResults.push({
                                type: "tool_result",
                                tool_use_id: toolUse.id,
                                is_error: true,
                                content: JSON.stringify({
                                    code: error.code,
                                    message: error.message
                                }),
                            });

                            toolCalls.push({
                                name: toolUse.name,
                                input: toolUse.input,
                                success: false,
                                error: {
                                    code: error.code,
                                    message: error.message
                                }
                            });

                            continue;
                        }
                        console.error(error);
                        throw new Error("Unexpected tool execution failure", { cause: error });
                    }
                }

                messages.push({
                    role: "user",
                    content: toolResults,
                });

                continue;
            }

            throw new Error(`Unexpected stop reason: ${response.stop_reason}`);
        }

        throw new Error(`Agent exceeded maximum iterations (${SupportAgent.MAX_ITERATIONS})`);
    }
}