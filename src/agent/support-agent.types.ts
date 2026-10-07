export type AgentToolCall = {
    name: string;
    input: unknown;
    success: boolean;
    error?: {
        code: string;
        message: string;
    }
};

export type AgentResult = {
    output: string;
    toolCalls: AgentToolCall[];
    iterations: number;
};