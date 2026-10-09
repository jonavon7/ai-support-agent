import "dotenv/config";
import { GetSubscription } from "./application/get-subscription.js";
import { InMemorySubscriptionRepository } from "./infrastructure/repositories/in-memory-subscription.repository.js";
import { SupportAgent } from "./agent/support-agent.js";
import { GetCustomer } from "./application/get-customer.js";
import { InMemoryCustomerRepository } from "./infrastructure/repositories/in-memory-customer.repository.js";
import { CreateSupportTicket } from "./application/create-support-ticket.js";
import { InMemorySupportTicketRepository } from "./infrastructure/repositories/in-memory-support-ticket.repository.js";
import { CancelSubscription } from "./application/cancel-subscription.js";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required");
}

const customerRepository = new InMemoryCustomerRepository();
const subscriptionRepository = new InMemorySubscriptionRepository();
const supportTicketRepository = new InMemorySupportTicketRepository();

const getCustomer = new GetCustomer(
    customerRepository,
);
const getSubscription = new GetSubscription(
    subscriptionRepository,
);
const createSupportTicket = new CreateSupportTicket(
    customerRepository,
    supportTicketRepository,
)
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

const first = await agent.run({
    message: "Cancel the subscription for cus_001",
});

console.dir(first, { depth: null });

const second = await agent.run({
    message: "CONFIRM",
    state: first.state,
});

console.dir(second, { depth: null });