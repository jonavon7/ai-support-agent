import { describe, expect, it, vi } from "vitest";
import { CancelSubscription } from "../../src/application/cancel-subscription.js";
import { NotFoundError } from "../../src/application/errors/not-found.error.js";
import { ValidationError } from "../../src/application/errors/validation.error.js";
import type { SubscriptionRepository } from "../../src/application/subscription.repository.js";
import { Subscription } from "../../src/domain/subscription.js";
import { SubscriptionAlreadyCancelledError } from "../../src/domain/errors/subscription-already-cancelled.error.js";

function createTestSetup() {
    const subscriptionRepository = {
        findByCustomerId: vi.fn<SubscriptionRepository["findByCustomerId"]>(),
        save: vi.fn<SubscriptionRepository["save"]>(),
    };
    const cancelSubscription = new CancelSubscription(subscriptionRepository);

    return { cancelSubscription, subscriptionRepository };
}

describe("CancelSubscription", () => {
    it("cancels an active subscription", async () => {
        const { cancelSubscription, subscriptionRepository } = createTestSetup();
        const subscription = new Subscription("cus_001", "pro", "active");
        subscriptionRepository.findByCustomerId.mockResolvedValue(subscription);
        subscriptionRepository.save.mockImplementation((savedSubscription) => {
            expect(savedSubscription).toBe(subscription);
            expect(savedSubscription.status).toBe("cancelled");
            return Promise.resolve(savedSubscription);
        });

        const result = await cancelSubscription.execute({ customerId: "cus_001" });

        expect(subscriptionRepository.findByCustomerId).toHaveBeenCalledExactlyOnceWith("cus_001");
        expect(subscriptionRepository.save).toHaveBeenCalledExactlyOnceWith(subscription);
        expect(result).toBe(subscription);
        expect(result.customerId).toBe("cus_001");
        expect(result.plan).toBe("pro");
        expect(result.status).toBe("cancelled");
    });

    it("throws NotFoundError when subscription does not exist", async () => {
        const { cancelSubscription, subscriptionRepository } = createTestSetup();
        subscriptionRepository.findByCustomerId.mockResolvedValue(null);

        await expect(cancelSubscription.execute({ customerId: "cus_999" }))
            .rejects.toBeInstanceOf(NotFoundError);

        expect(subscriptionRepository.findByCustomerId).toHaveBeenCalledWith("cus_999");
        expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });

    it("throws SubscriptionAlreadyCancelledError when subscription is already cancelled", async () => {
        const { cancelSubscription, subscriptionRepository } = createTestSetup();
        const subscription = new Subscription("cus_001", "pro", "cancelled");
        subscriptionRepository.findByCustomerId.mockResolvedValue(subscription);

        await expect(cancelSubscription.execute({ customerId: "cus_001" }))
            .rejects.toBeInstanceOf(SubscriptionAlreadyCancelledError);

        expect(subscriptionRepository.findByCustomerId).toHaveBeenCalledWith("cus_001");
        expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });

    it("throws ValidationError when customerId is empty", async () => {
        const { cancelSubscription, subscriptionRepository } = createTestSetup();

        await expect(cancelSubscription.execute({ customerId: "" }))
            .rejects.toBeInstanceOf(ValidationError);

        expect(subscriptionRepository.findByCustomerId).not.toHaveBeenCalled();
        expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });

    it("throws ValidationError when customerId contains only whitespace", async () => {
        const { cancelSubscription, subscriptionRepository } = createTestSetup();

        await expect(cancelSubscription.execute({ customerId: "   " }))
            .rejects.toBeInstanceOf(ValidationError);

        expect(subscriptionRepository.findByCustomerId).not.toHaveBeenCalled();
        expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });
});
