import type { CustomerRepository } from "./customer.repository.js";
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

    async execute({ customerId, reason }: CreateSupportTicketInput) {
        const customer = await this.customerRepository.findById(customerId);
        if (!customer) {
            throw new Error(`Customer not found: ${customerId}`);
        }
        return this.supportTicketRepository.create({ customerId, reason });
    }
}