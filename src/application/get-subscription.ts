import { normalizeCustomerId } from "./shared/normalize-customer-id.js";
import type { SubscriptionRepository } from "./subscription.repository.js";

export type GetSubscriptionInput = {
    customerId: string;
};

export class GetSubscription {
    constructor(private readonly subscriptionRepository: SubscriptionRepository) { }

    async execute({ customerId }: GetSubscriptionInput) {
        const normalizedCustomerId = normalizeCustomerId(customerId);

        return this.subscriptionRepository.findByCustomerId(normalizedCustomerId);
    }
}