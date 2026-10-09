import type Anthropic from "@anthropic-ai/sdk";
import type { GetSubscription } from "../../application/get-subscription.js";

type GetSubscriptionToolInput = {
    customerId: string;
};

export const getSubscriptionToolDefinition: Anthropic.Tool = {
    name: "get_subscription",
    description: "Get the current subscription for a customer",
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

function isGetSubscriptionInput(input: unknown): input is GetSubscriptionToolInput {
    if (typeof input !== "object" || input === null) {
        return false;
    }

    return (
        "customerId" in input &&
        typeof input.customerId === "string" &&
        input.customerId.trim().length > 0
    );
}

export async function executeGetSubscriptionTool(
    input: unknown,
    getSubscription: GetSubscription
) {
    if (!isGetSubscriptionInput(input)) {
        throw new Error("Invalid input for get_subscription");
    }

    const subscription = await getSubscription.execute({
        customerId: input.customerId,
    });

    if (!subscription) {
        return null;
    }

    return {
        customerId: subscription.customerId,
        plan: subscription.plan,
        status: subscription.status,
    };
}