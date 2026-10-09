import type { MessageParam } from "@anthropic-ai/sdk/resources";

export type PendingAction =
    | {
        type: "cancel_subscription";
        customerId: string;
    }

export type AgentState = {
    messages: MessageParam[];
    pendingAction?: PendingAction;
}

export type AgentInput = {
    message: string;
    state?: AgentState
}

export type AgentToolCall = {
    name: string;
    input: unknown;
    success: boolean;
    result?: unknown;
    error?: {
        code: string;
        message: string;
    }
};

export type AgentResult = {
    output: string;
    toolCalls: AgentToolCall[];
    iterations: number;
    state: AgentState;
};