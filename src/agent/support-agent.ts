import Anthropic from "@anthropic-ai/sdk";
import type {
    MessageParam,
    ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages/messages";
import type { GetCustomer } from "../application/get-customer.js";
import type { GetSubscription } from "../application/get-subscription.js";
import type { CreateSupportTicket } from "../application/create-support-ticket.js";
import { executeTool } from "./dispatcher/execute-tool.js";
import { getCustomerToolDefinition } from "./tools/get-customer.tool.js";
import { getSubscriptionToolDefinition } from "./tools/get-subscription.tool.js";
import { createSupportTicketToolDefinition } from "./tools/create-support-ticket.tool.js";

type SupportAgentDependencies = {
    getCustomer: GetCustomer;
    getSubscription: GetSubscription;
    createSupportTicket: CreateSupportTicket;
};

export class SupportAgent {
    private readonly client: Anthropic;
    private static readonly MAX_ITERATIONS = 8;

    constructor(
        private readonly dependencies: SupportAgentDependencies,
        apiKey: string,
    ) {
        this.client = new Anthropic({ apiKey });
    }

    async run(userMessage: string): Promise<string> {
        const messages: MessageParam[] = [
            {
                role: "user",
                content: userMessage,
            },
        ];

        for (let iteration = 0; iteration < SupportAgent.MAX_ITERATIONS; iteration++) {
            const response = await this.client.messages.create({
                model: "claude-haiku-4-5",
                max_tokens: 1024,
                tools: [
                    getCustomerToolDefinition,
                    getSubscriptionToolDefinition,
                    createSupportTicketToolDefinition
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

                return finalText;
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

                        toolResults.push({
                            type: "tool_result" as const,
                            tool_use_id: toolUse.id,
                            content: JSON.stringify(result),
                        });
                    } catch (error) {
                        const message = error instanceof Error
                            ? error.message
                            : "Unknown tool execution error";

                        toolResults.push({
                            type: "tool_result" as const,
                            tool_use_id: toolUse.id,
                            is_error: true,
                            content: message,
                        });
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