import { randomUUID } from "crypto";
import type { CreateSupportTicketData, SupportTicketRepository } from "../../application/support-ticket.repository.js";
import type { SupportTicket } from "../../domain/support-ticket.js";

const supportTickets: SupportTicket[] = [];

export class InMemorySupportTicketRepository implements SupportTicketRepository {
    create(data: CreateSupportTicketData): Promise<SupportTicket> {
        const st: SupportTicket = {
            id: randomUUID(),
            customerId: data.customerId,
            reason: data.reason,
            status: "open",
            createdAt: new Date(),
        };
        supportTickets.push(st);
        return Promise.resolve(st);
    }
}
