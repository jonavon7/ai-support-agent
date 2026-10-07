import type { SubscriptionRepository } from "./subscription.repository.js";

export type GetSubscriptionInput = {
    customerId: string;
};

export class GetSubscription {
    constructor(private subscriptionRepository: SubscriptionRepository) { }

    async execute({ customerId }: GetSubscriptionInput) {
        return this.subscriptionRepository.findByCustomerId(customerId);
    }
}