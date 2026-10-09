import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";
import { SupportAgent } from "../../src/agent/support-agent.js";
import type { AgentState } from "../../src/agent/support-agent.types.js";
import { CancelSubscription } from "../../src/application/cancel-subscription.js";
import { CreateSupportTicket } from "../../src/application/create-support-ticket.js";
import { GetCustomer } from "../../src/application/get-customer.js";
import { GetSubscription } from "../../src/application/get-subscription.js";
import type { CustomerRepository } from "../../src/application/customer.repository.js";
import type { SubscriptionRepository } from "../../src/application/subscription.repository.js";
import type { SupportTicketRepository } from "../../src/application/support-ticket.repository.js";
import { Subscription } from "../../src/domain/subscription.js";
import { SubscriptionAlreadyCancelledError } from "../../src/domain/errors/subscription-already-cancelled.error.js";
import { PrepareSubscriptionCancellation } from "../../src/application/prepare-subscription-cancellation.js";

const { createMessage } = vi.hoisted(() => ({
    createMessage: vi.fn<() => Promise<Pick<Message, "stop_reason" | "content">>>(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
    default: class {
        messages = { create: createMessage };
    },
}));

function createTestSetup() {
    const subscription = new Subscription("cus_001", "pro", "active");
    const customerRepository = {
        findById: vi.fn<CustomerRepository["findById"]>(),
    };
    const subscriptionRepository = {
        findByCustomerId: vi.fn<SubscriptionRepository["findByCustomerId"]>()
            .mockResolvedValue(subscription),
        save: vi.fn<SubscriptionRepository["save"]>()
            .mockImplementation((value) => Promise.resolve(value)),
    };
    const supportTicketRepository = {
        create: vi.fn<SupportTicketRepository["create"]>(),
    };
    const cancelSubscription = new CancelSubscription(subscriptionRepository);
    const executeCancellation = vi.spyOn(cancelSubscription, "execute");
    const agent = new SupportAgent({
        getCustomer: new GetCustomer(customerRepository),
        getSubscription: new GetSubscription(subscriptionRepository),
        createSupportTicket: new CreateSupportTicket(customerRepository, supportTicketRepository),
        cancelSubscription,
        prepareSubscriptionCancellation: new PrepareSubscriptionCancellation(subscriptionRepository),
    }, "fake-api-key");

    return { agent, subscription, subscriptionRepository, executeCancellation };
}

function createPendingState(): AgentState {
    return {
        messages: [
            { role: "user", content: "Cancel my subscription for cus_001" },
            { role: "assistant", content: "Reply CONFIRM to proceed or CANCEL to discard it." },
        ],
        pendingAction: { type: "cancel_subscription", customerId: "cus_001" },
    };
}

describe("SupportAgent human-in-the-loop", () => {
    beforeEach(() => {
        createMessage.mockReset();
    });

    it("creates a pending action without cancelling the subscription", async () => {
        const { agent, subscription, subscriptionRepository, executeCancellation } = createTestSetup();
        createMessage.mockResolvedValueOnce({
            stop_reason: "tool_use",
            content: [{
                type: "tool_use",
                id: "tool_001",
                name: "request_cancel_subscription",
                input: { customerId: "cus_001" },
                caller: { type: "direct" },
            }],
        }).mockResolvedValueOnce({
            stop_reason: "end_turn",
            content: [{ type: "text", text: "Reply CONFIRM to proceed or CANCEL to discard it.", citations: null }],
        });

        const result = await agent.run({ message: "Cancel my subscription for cus_001" });

        expect(result.state.pendingAction).toEqual({
            type: "cancel_subscription",
            customerId: "cus_001",
        });
        expect(result.toolCalls).toEqual([expect.objectContaining({
            name: "request_cancel_subscription",
            success: true,
        })]);
        expect(executeCancellation).not.toHaveBeenCalled();
        expect(subscriptionRepository.save).not.toHaveBeenCalled();
        expect(subscription.status).toBe("active");
        expect(createMessage).toHaveBeenCalledTimes(2);
    });

    it("executes and clears the pending action on CONFIRM", async () => {
        const { agent, subscription, subscriptionRepository, executeCancellation } = createTestSetup();

        const result = await agent.run({ message: "CONFIRM", state: createPendingState() });

        expect(executeCancellation).toHaveBeenCalledExactlyOnceWith({ customerId: "cus_001" });
        expect(subscriptionRepository.save).toHaveBeenCalledExactlyOnceWith(subscription);
        expect(subscription.status).toBe("cancelled");
        expect(result.state).not.toHaveProperty("pendingAction");
        expect(result.iterations).toBe(0);
        expect(createMessage).not.toHaveBeenCalled();
        expect(result.output).toBe("Subscription for cus_001 was cancelled successfully.");
        expect(result.toolCalls).toEqual([]);
    });

    it("handles SubscriptionAlreadyCancelledError and clears the pending action on CONFIRM", async () => {
        const { agent, subscriptionRepository, executeCancellation } = createTestSetup();
        const subscription = new Subscription("cus_001", "pro", "cancelled");
        subscriptionRepository.findByCustomerId.mockResolvedValue(subscription);

        const result = await agent.run({ message: "CONFIRM", state: createPendingState() });

        expect(executeCancellation).toHaveBeenCalledExactlyOnceWith({ customerId: "cus_001" });
        expect(subscriptionRepository.save).not.toHaveBeenCalled();
        expect(subscription.status).toBe("cancelled");
        expect(result.state).not.toHaveProperty("pendingAction");
        expect(result.output).toBe("Subscription is already cancelled");
        expect(result.state.messages.at(-1)).toEqual({
            role: "assistant",
            content: result.output,
        });
        expect(result.iterations).toBe(0);
        expect(result.toolCalls).toEqual([]);
        expect(createMessage).not.toHaveBeenCalled();
    });

    it("clears the pending action without executing it on CANCEL", async () => {
        const { agent, subscription, subscriptionRepository, executeCancellation } = createTestSetup();

        const result = await agent.run({ message: "CANCEL", state: createPendingState() });

        expect(result.state).not.toHaveProperty("pendingAction");
        expect(executeCancellation).not.toHaveBeenCalled();
        expect(subscriptionRepository.findByCustomerId).not.toHaveBeenCalled();
        expect(subscriptionRepository.save).not.toHaveBeenCalled();
        expect(subscription.status).toBe("active");
        expect(result.iterations).toBe(0);
        expect(createMessage).not.toHaveBeenCalled();
        expect(result.output).toBe("Subscription cancellation request has been cancelled.");
        expect(result.toolCalls).toEqual([]);
    });

    it("keeps the pending action when the user does not CONFIRM or CANCEL", async () => {
        const { agent, subscriptionRepository, executeCancellation } = createTestSetup();

        const result = await agent.run({
            message: "maybe later",
            state: createPendingState(),
        });

        expect(result.state.pendingAction).toEqual({
            type: "cancel_subscription",
            customerId: "cus_001",
        });

        expect(executeCancellation).not.toHaveBeenCalled();
        expect(subscriptionRepository.save).not.toHaveBeenCalled();
        expect(result.iterations).toBe(0);
        expect(createMessage).not.toHaveBeenCalled();
        expect(result.output).toBe(
            "A subscription cancellation is pending. Reply CONFIRM to proceed or CANCEL to discard it.",
        );
    });
});
