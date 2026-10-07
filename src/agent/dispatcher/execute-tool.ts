import type { CreateSupportTicket } from "../../application/create-support-ticket.js";
import type { GetCustomer } from "../../application/get-customer.js";
import type { GetSubscription } from "../../application/get-subscription.js";
import { executeCreateSupportTicketTool } from "../tools/create-support-ticket.tool.js";
import { executeGetCustomerTool } from "../tools/get-customer.tool.js";
import { executeGetSubscriptionTool } from "../tools/get-subscription.tool.js";

type Dependencies = {
    getCustomer: GetCustomer;
    getSubscription: GetSubscription;
    createSupportTicket: CreateSupportTicket;
};

export async function executeTool(
    name: string,
    input: unknown,
    dependencies: Dependencies
) {
    switch (name) {
        case "get_customer":
            return executeGetCustomerTool(
                input,
                dependencies.getCustomer,
            );

        case "get_subscription":
            return executeGetSubscriptionTool(
                input,
                dependencies.getSubscription
            );

        case "create_support_ticket":
            return executeCreateSupportTicketTool(
                input,
                dependencies.createSupportTicket
            );

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
};