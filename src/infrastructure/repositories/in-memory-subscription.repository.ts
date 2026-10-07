import type { SubscriptionRepository } from "../../application/subscription.repository.js";
import type { Subscription } from "../../domain/subscription.js";

const subscriptions: Subscription[] = [
    {
        customerId: "cus_001",
        plan: "pro",
        status: "active",
    },
    {
        customerId: "cus_002",
        plan: "free",
        status: "cancelled",
    },
];

export class InMemorySubscriptionRepository implements SubscriptionRepository {
    async findByCustomerId(customerId: string): Promise<Subscription | null> {
        return Promise.resolve(subscriptions.find((subscription) => subscription.customerId === customerId) ?? null);
    }
}