import type { SubscriptionRepository } from "../../application/subscription.repository.js";
import { Subscription } from "../../domain/subscription.js";

const subscriptions: Subscription[] = [
    new Subscription(
        "cus_001",
        "pro",
        "active",
    ),
    new Subscription(
        "cus_002",
        "free",
        "cancelled",
    ),
];

export class InMemorySubscriptionRepository implements SubscriptionRepository {
    findByCustomerId(customerId: string): Promise<Subscription | null> {
        return Promise.resolve(subscriptions.find((subscription) => subscription.customerId === customerId) ?? null);
    }
    save(subscription: Subscription): Promise<Subscription> {
        const index = subscriptions.findIndex(
            (item) => item.customerId === subscription.customerId,
        );

        if (index === -1) {
            return Promise.reject(
                new Error(
                    `Subscription unexpectedly missing for customer: ${subscription.customerId}`,
                ),
            );
        }

        subscriptions[index] = subscription;

        return Promise.resolve(subscription);
    }
}