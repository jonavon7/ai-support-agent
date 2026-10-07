import type Anthropic from "@anthropic-ai/sdk";
import type { CreateSupportTicket } from "../../application/create-support-ticket.js";

type CreateSupportTicketToolInput = {
    customerId: string;
    reason: string;
};

export const createSupportTicketToolDefinition: Anthropic.Tool = {
    name: "create_support_ticket",
    description: "Create a support ticket when a customer needs an issue escalated or requires support that cannot be resolved directly.",
    input_schema: {
        type: "object",
        properties: {
            customerId: {
                type: "string",
                description: "Unique customer identifier",
            },
            reason: {
                type: "string",
                description: "Reason for the support ticket",
            }
        },
        required: ["customerId", "reason"],
    },
}

function isCreateSupportTicketInput(input: unknown): input is CreateSupportTicketToolInput {
    if (typeof input !== "object" || input === null) {
        return false;
    }

    return (
        "customerId" in input &&
        typeof input.customerId === "string" &&
        input.customerId.trim().length > 0 &&
        "reason" in input &&
        typeof input.reason === "string" &&
        input.reason.trim().length > 0
    );
}

export async function executeCreateSupportTicketTool(input: unknown, createSupportTicket: CreateSupportTicket) {
    if (!isCreateSupportTicketInput(input)) {
        throw new Error("Invalid input for create_support_ticket");
    }

    return createSupportTicket.execute({
        customerId: input.customerId,
        reason: input.reason,
    });
}
