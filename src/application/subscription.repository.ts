import type { Subscription } from "../domain/subscription.js";

export interface SubscriptionRepository {
    findByCustomerId(customerId: string): Promise<Subscription | null>;
    save(subscription: Subscription): Promise<Subscription>;
}