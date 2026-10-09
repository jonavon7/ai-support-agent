import { SubscriptionAlreadyCancelledError } from "./errors/subscription-already-cancelled.error.js";

export type SubscriptionStatus = "active" | "cancelled";
export type SubscriptionPlan = "free" | "pro";

export class Subscription {
    constructor(
        public readonly customerId: string,
        public readonly plan: SubscriptionPlan,
        public _status: SubscriptionStatus,
    ) { }

    get status(): SubscriptionStatus {
        return this._status;
    }

    cancel(): void {
        if (this._status === "cancelled") {
            throw new SubscriptionAlreadyCancelledError("Subscription is already cancelled");
        }
        this._status = "cancelled";
    }
};