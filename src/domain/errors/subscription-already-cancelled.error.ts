import { DomainError } from "./domain-error.js";

export class SubscriptionAlreadyCancelledError extends DomainError {
    readonly code = "SUBSCRIPTION_ALREADY_CANCELLED";
}