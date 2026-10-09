import { SubscriptionAlreadyCancelledError } from "../domain/errors/subscription-already-cancelled.error.js";
import { NotFoundError } from "./errors/not-found.error.js";
import { normalizeCustomerId } from "./shared/normalize-customer-id.js";
import type { SubscriptionRepository } from "./subscription.repository.js";

type PrepareSubscriptionCancellationInput = {
    customerId: string;
};

export class PrepareSubscriptionCancellation {
    constructor(private readonly subscriptionRepository: SubscriptionRepository) { }

    async execute({ customerId }: PrepareSubscriptionCancellationInput) {
        const normalizedCustomerId = normalizeCustomerId(customerId);
        const subscription = await this.subscriptionRepository.findByCustomerId(normalizedCustomerId);

        if (!subscription) {
            throw new NotFoundError(`Subscription not found for customer: ${normalizedCustomerId}`);
        }

        if (subscription.status === "cancelled") {
            throw new SubscriptionAlreadyCancelledError("Subscription is already cancelled");
        }

        return subscription;

    }
}