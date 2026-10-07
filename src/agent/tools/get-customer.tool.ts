import type Anthropic from "@anthropic-ai/sdk";
import type { GetCustomer } from "../../application/get-customer.js";

type GetCustomerToolInput = {
    customerId: string;
};

export const getCustomerToolDefinition: Anthropic.Tool = {
    name: "get_customer",
    description: "Get customer details by customer ID",
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

function isGetCustomerInput(input: unknown): input is GetCustomerToolInput {
    if (typeof input !== "object" || input === null) {
        return false;
    }

    return (
        "customerId" in input &&
        typeof input.customerId === "string" &&
        input.customerId.trim().length > 0
    );
}

export async function executeGetCustomerTool(
    input: unknown,
    getCustomer: GetCustomer,
) {
    if (!isGetCustomerInput(input)) {
        throw new Error( "Invalid input for get_customer");
    }

    return getCustomer.execute({
        customerId: input.customerId,
    });
}