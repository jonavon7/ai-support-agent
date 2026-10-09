import { NotFoundError } from "./errors/not-found.error.js";
import { normalizeCustomerId } from "./shared/normalize-customer-id.js";
import type { SubscriptionRepository } from "./subscription.repository.js";

type CancelSubscriptionInput = {
    customerId: string;
};

export class CancelSubscription {
    constructor(private readonly subscriptionRepository: SubscriptionRepository) { }

    async execute({ customerId }: CancelSubscriptionInput) {
        const normalizedCustomerId = normalizeCustomerId(customerId);

        const subscription = await this.subscriptionRepository.findByCustomerId(
            normalizedCustomerId,
        );

        if (!subscription) {
            throw new NotFoundError(
                `Subscription not found for customer: ${normalizedCustomerId}`,
            );
        }

        subscription.cancel();

        return this.subscriptionRepository.save(subscription);
    }
}