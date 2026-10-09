import type Anthropic from "@anthropic-ai/sdk";
import type { PrepareSubscriptionCancellation } from "../../application/prepare-subscription-cancellation.js";

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
    description:
        `Prepare a subscription cancellation that requires explicit user approval.

        This tool does NOT cancel the subscription and does NOT start the cancellation.
        After this tool succeeds, clearly tell the user that the subscription has NOT been cancelled yet.

        Tell the user that a cancellation is pending their explicit approval and ask them to reply exactly CONFIRM to execute it.

        Do not say that the cancellation "has been requested", "has started", "is being processed", or has already been completed.`,
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

export async function executeRequestCancelSubscriptionTool(
    input: unknown,
    prepareSubscriptionCancellation: PrepareSubscriptionCancellation,
): Promise<RequestCancelSubscriptionResult> {
    if (!isRequestCancelSubscriptionInput(input)) {
        throw new Error(
            "Invalid input for request_cancel_subscription",
        );
    }

    const subscription =
        await prepareSubscriptionCancellation.execute({
            customerId: input.customerId,
        });

    return {
        requiresApproval: true,
        action: {
            type: "cancel_subscription",
            customerId: subscription.customerId,
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