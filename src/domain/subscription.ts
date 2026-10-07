export type SubscriptionStatus = "active" | "cancelled";
export type SubscriptionPlan = "free" | "pro";

export type Subscription = {
    customerId: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
};