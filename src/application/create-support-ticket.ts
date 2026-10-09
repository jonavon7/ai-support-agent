import type { SupportTicket } from "../domain/support-ticket.js";
import type { CustomerRepository } from "./customer.repository.js";
import { NotFoundError } from "./errors/not-found.error.js";
import { ValidationError } from "./errors/validation.error.js";
import { normalizeCustomerId } from "./shared/normalize-customer-id.js";
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
        const normalizedCustomerId = normalizeCustomerId(input.customerId);
        const reason = input.reason.trim();

        if (!reason) {
            throw new ValidationError("Ticket reason must not be empty");
        }

        const customer = await this.customerRepository.findById(normalizedCustomerId);

        if (!customer) {
            throw new NotFoundError(`Customer not found: ${normalizedCustomerId}`);
        }

        return this.supportTicketRepository.create({ customerId: normalizedCustomerId, reason });
    }
}