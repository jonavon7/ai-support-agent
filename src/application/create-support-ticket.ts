import type { SupportTicket } from "../domain/support-ticket.js";
import type { CustomerRepository } from "./customer.repository.js";
import { NotFoundError } from "./errors/not-found.error.js";
import { ValidationError } from "./errors/validation.error.js";
import type { SupportTicketRepository } from "./support-ticket.repository.js";

type CreateSupportTicketInput = {
    customerId: string;
    reason: string;
};

export class CreateSupportTicket {
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly supportTicketRepository: SupportTicketRepository,
    ) { }

    async execute(input: CreateSupportTicketInput): Promise<SupportTicket> {
        const customerId = input.customerId.trim();
        const reason = input.reason.trim();

        if (!customerId || !reason) {
            throw new ValidationError("Customer ID and ticket reason must not be empty");
        }

        const customer = await this.customerRepository.findById(customerId);

        if (!customer) {
            throw new NotFoundError(`Customer not found: ${customerId}`);
        }

        return this.supportTicketRepository.create({ customerId, reason });
    }
}