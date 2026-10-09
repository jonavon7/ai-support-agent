import { describe, expect, it, vi } from "vitest";
import { PrepareSubscriptionCancellation } from "../../src/application/prepare-subscription-cancellation.js";
import { NotFoundError } from "../../src/application/errors/not-found.error.js";
import type { SubscriptionRepository } from "../../src/application/subscription.repository.js";
import { Subscription } from "../../src/domain/subscription.js";
import { SubscriptionAlreadyCancelledError } from "../../src/domain/errors/subscription-already-cancelled.error.js";
import { ValidationError } from "../../src/application/errors/validation.error.js";

function createTestSetup() {
    const subscriptionRepository = {
        findByCustomerId: vi.fn<SubscriptionRepository["findByCustomerId"]>(),
        save: vi.fn<SubscriptionRepository["save"]>(),
    };
    const prepareSubscriptionCancellation = new PrepareSubscriptionCancellation(subscriptionRepository);

    return { prepareSubscriptionCancellation, subscriptionRepository };
}

describe("PrepareSubscriptionCancellation", () => {
    it("returns an active subscription without cancelling or saving it", async () => {
        const { prepareSubscriptionCancellation, subscriptionRepository } = createTestSetup();
        const subscription = new Subscription("cus_001", "pro", "active");
        subscriptionRepository.findByCustomerId.mockResolvedValue(subscription);

        const result = await prepareSubscriptionCancellation.execute({ customerId: "cus_001" });

        expect(subscriptionRepository.findByCustomerId).toHaveBeenCalledExactlyOnceWith("cus_001");
        expect(result).toBe(subscription);
        expect(result.status).toBe("active");
        expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when subscription does not exist", async () => {
        const { prepareSubscriptionCancellation, subscriptionRepository } = createTestSetup();
        subscriptionRepository.findByCustomerId.mockResolvedValue(null);

        await expect(prepareSubscriptionCancellation.execute({ customerId: "cus_999" }))
            .rejects.toBeInstanceOf(NotFoundError);

        expect(subscriptionRepository.findByCustomerId).toHaveBeenCalledExactlyOnceWith("cus_999");
        expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });

    it("throws SubscriptionAlreadyCancelledError when subscription is already cancelled", async () => {
        const { prepareSubscriptionCancellation, subscriptionRepository } = createTestSetup();
        const subscription = new Subscription("cus_001", "pro", "cancelled");
        subscriptionRepository.findByCustomerId.mockResolvedValue(subscription);

        await expect(prepareSubscriptionCancellation.execute({ customerId: "cus_001" }))
            .rejects.toBeInstanceOf(SubscriptionAlreadyCancelledError);

        expect(subscriptionRepository.findByCustomerId).toHaveBeenCalledExactlyOnceWith("cus_001");
        expect(subscription.status).toBe("cancelled");
        expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });

    it("throws ValidationError when customerId is empty", async () => {
        const { prepareSubscriptionCancellation, subscriptionRepository } = createTestSetup();

        await expect(
            prepareSubscriptionCancellation.execute({ customerId: "" }),
        ).rejects.toBeInstanceOf(ValidationError);

        expect(subscriptionRepository.findByCustomerId).not.toHaveBeenCalled();
        expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });

    it("throws ValidationError when customerId contains only whitespace", async () => {
        const { prepareSubscriptionCancellation, subscriptionRepository } =
            createTestSetup();

        await expect(
            prepareSubscriptionCancellation.execute({ customerId: "   " }),
        ).rejects.toBeInstanceOf(ValidationError);

        expect(subscriptionRepository.findByCustomerId).not.toHaveBeenCalled();
        expect(subscriptionRepository.save).not.toHaveBeenCalled();
    });
});
