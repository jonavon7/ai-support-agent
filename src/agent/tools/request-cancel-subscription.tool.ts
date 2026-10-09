import type Anthropic from "@anthropic-ai/sdk";

type RequestCancelSubscriptionToolInput = {
    customerId: string;
};

export type RequestCancelSubscriptionResult = {
    requiresApproval: true;
    action: {
        type: "cancel_subscription";
        customerId: string;
    };
};

export const requestCancelSubscriptionToolDefinition: Anthropic.Tool = {
    name: "request_cancel_subscription",
    description: "Request cancellation of a customer's subscription. This does not execute the cancellation. It creates a pending action that requires explicit user approval. After using this tool, tell the user to reply exactly CONFIRM to execute the cancellation.",
    input_schema: {
        type: "object",
        properties: {
            customerId: {
                type: "string",
                description: "Unique customer identifier",
            },
        },
        required: ["customerId"],
    },
};

function isRequestCancelSubscriptionInput(input: unknown): input is RequestCancelSubscriptionToolInput {
    if (typeof input !== "object" || input === null) {
        return false;
    }

    return (
        "customerId" in input &&
        typeof input.customerId === "string" &&
        input.customerId.trim().length > 0
    );
}

export function executeRequestCancelSubscriptionTool(input: unknown): RequestCancelSubscriptionResult {
    if (!isRequestCancelSubscriptionInput(input)) {
        throw new Error(
            "Invalid input for request_cancel_subscription",
        );
    }

    return {
        requiresApproval: true,
        action: {
            type: "cancel_subscription",
            customerId: input.customerId.trim(),
        },
    };
}

export function isRequestCancelSubscriptionResult(result: unknown): result is RequestCancelSubscriptionResult {
    if (typeof result !== "object" || result === null) {
        return false;
    }

    return (
        "requiresApproval" in result &&
        result.requiresApproval === true &&
        "action" in result &&
        typeof result.action === "object" &&
        result.action !== null &&
        "type" in result.action &&
        result.action.type === "cancel_subscription" &&
        "customerId" in result.action &&
        typeof result.action.customerId === "string"
    );
}