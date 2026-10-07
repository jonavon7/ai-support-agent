import { describe, expect, it, vi } from "vitest";
import { CreateSupportTicket } from "../../src/application/create-support-ticket.js";
import { NotFoundError } from "../../src/application/errors/not-found.error.js";
import { ValidationError } from "../../src/application/errors/validation.error.js";
import type { CustomerRepository } from "../../src/application/customer.repository.js";
import type { SupportTicketRepository } from "../../src/application/support-ticket.repository.js";
import type { Customer } from "../../src/domain/customer.js";
import type { SupportTicket } from "../../src/domain/support-ticket.js";

function createTestSetup() {
    const customerRepository = {
        findById: vi.fn<CustomerRepository["findById"]>(),
    };
    const supportTicketRepository = {
        create: vi.fn<SupportTicketRepository["create"]>(),
    };
    const createSupportTicket = new CreateSupportTicket(customerRepository, supportTicketRepository);

    return { createSupportTicket, customerRepository, supportTicketRepository };
}

describe("CreateSupportTicket", () => {
    it("creates a support ticket for an existing customer", async () => {
        const { createSupportTicket, customerRepository, supportTicketRepository } = createTestSetup();
        const customer: Customer = {
            id: "cus_001",
            name: "Alice Test",
            email: "alice@example.com",
        };
        const expectedTicket: SupportTicket = {
            id: "ticket_001",
            customerId: "cus_001",
            reason: "I was charged twice",
            status: "open",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
        };

        customerRepository.findById.mockResolvedValue(customer);
        supportTicketRepository.create.mockResolvedValue(expectedTicket);

        const ticket = await createSupportTicket.execute({
            customerId: "cus_001",
            reason: "I was charged twice",
        });

        expect(customerRepository.findById).toHaveBeenCalledWith("cus_001");
        expect(supportTicketRepository.create).toHaveBeenCalledExactlyOnceWith({
            customerId: "cus_001",
            reason: "I was charged twice",
        });
        expect(ticket).toEqual(expectedTicket);
    });

    it("throws NotFoundError when customer does not exist", async () => {
        const { createSupportTicket, customerRepository, supportTicketRepository } = createTestSetup();
        customerRepository.findById.mockResolvedValue(null);

        await expect(createSupportTicket.execute({
            customerId: "cus_999",
            reason: "I was charged twice",
        })).rejects.toBeInstanceOf(NotFoundError);

        expect(customerRepository.findById).toHaveBeenCalledWith("cus_999");
        expect(supportTicketRepository.create).not.toHaveBeenCalled();
    });

    it("throws ValidationError when customerId is empty", async () => {
        const { createSupportTicket, customerRepository, supportTicketRepository } = createTestSetup();

        await expect(createSupportTicket.execute({
            customerId: "",
            reason: "I was charged twice",
        })).rejects.toBeInstanceOf(ValidationError);

        expect(customerRepository.findById).not.toHaveBeenCalled();
        expect(supportTicketRepository.create).not.toHaveBeenCalled();
    });

    it("throws ValidationError when reason is empty", async () => {
        const { createSupportTicket, customerRepository, supportTicketRepository } = createTestSetup();

        await expect(createSupportTicket.execute({
            customerId: "cus_001",
            reason: "",
        })).rejects.toBeInstanceOf(ValidationError);

        expect(customerRepository.findById).not.toHaveBeenCalled();
        expect(supportTicketRepository.create).not.toHaveBeenCalled();
    });

    it("throws ValidationError when customerId and reason contain only whitespace", async () => {
        const { createSupportTicket, customerRepository, supportTicketRepository } = createTestSetup();

        await expect(createSupportTicket.execute({
            customerId: "   ",
            reason: "   ",
        })).rejects.toBeInstanceOf(ValidationError);

        expect(customerRepository.findById).not.toHaveBeenCalled();
        expect(supportTicketRepository.create).not.toHaveBeenCalled();
    });
});
