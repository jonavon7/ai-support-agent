import { describe, expect, it } from "vitest";
import { Subscription } from "../../src/domain/subscription.js";
import { SubscriptionAlreadyCancelledError } from "../../src/domain/errors/subscription-already-cancelled.error.js";

describe("Subscription.cancel", () => {
    it("changes an active subscription to cancelled", () => {
        const subscription = new Subscription("cus_001", "pro", "active");

        subscription.cancel();

        expect(subscription.status).toBe("cancelled");
        expect(subscription.customerId).toBe("cus_001");
        expect(subscription.plan).toBe("pro");
    });

    it("throws SubscriptionAlreadyCancelledError when already cancelled", () => {
        const subscription = new Subscription("cus_001", "pro", "cancelled");

        expect(() => subscription.cancel()).toThrow(SubscriptionAlreadyCancelledError);

        expect(subscription.status).toBe("cancelled");
    });
});
