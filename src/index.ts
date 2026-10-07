import "dotenv/config";
import { GetSubscription } from "./application/get-subscription.js";
import { InMemorySubscriptionRepository } from "./infrastructure/repositories/in-memory-subscription.repository.js";
import { SupportAgent } from "./agent/support-agent.js";
import { GetCustomer } from "./application/get-customer.js";
import { InMemoryCustomerRepository } from "./infrastructure/repositories/in-memory-customer.repository.js";
import { CreateSupportTicket } from "./application/create-support-ticket.js";
import { InMemorySupportTicketRepository } from "./infrastructure/repositories/in-memory-support-ticket.repository.js";

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

const agent = new SupportAgent(
    {
        getCustomer,
        getSubscription,
        createSupportTicket,
    },
    apiKey,
);

const response = await agent.run(
    "Who is cus_001 and what subscription do they have?",
);

console.log(response);