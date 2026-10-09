import type { ApiProvider, ProviderResponse } from "promptfoo";
import { SupportAgent } from "../src/agent/support-agent.js";
import { GetCustomer } from "../src/application/get-customer.js";
import { GetSubscription } from "../src/application/get-subscription.js";
import { CreateSupportTicket } from "../src/application/create-support-ticket.js";
import { InMemoryCustomerRepository } from "../src/infrastructure/repositories/in-memory-customer.repository.js";
import { InMemorySubscriptionRepository } from "../src/infrastructure/repositories/in-memory-subscription.repository.js";
import { InMemorySupportTicketRepository } from "../src/infrastructure/repositories/in-memory-support-ticket.repository.js";
import { CancelSubscription } from "../src/application/cancel-subscription.js";

export default class SupportAgentProvider implements ApiProvider {
    id(): string {
        return "support-agent";
    }

    async callApi(prompt: string): Promise<ProviderResponse> {
        const apiKey = process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
            return {
                error: "ANTHROPIC_API_KEY is not configured",
            };
        }

        const customerRepository = new InMemoryCustomerRepository();
        const subscriptionRepository = new InMemorySubscriptionRepository();
        const supportTicketRepository =
            new InMemorySupportTicketRepository();

        const getCustomer = new GetCustomer(customerRepository);
        const getSubscription = new GetSubscription(
            subscriptionRepository,
        );

        const createSupportTicket = new CreateSupportTicket(
            customerRepository,
            supportTicketRepository,
        );
        const cancelSubscription = new CancelSubscription(
            subscriptionRepository
        );

        const agent = new SupportAgent(
            {
                getCustomer,
                getSubscription,
                createSupportTicket,
                cancelSubscription,
            },
            apiKey,
        );

        const result = await agent.run({ message: prompt });

        return {
            output: result.output,
            metadata: {
                toolCalls: result.toolCalls,
                iterations: result.iterations,
            }
        };
    }
}