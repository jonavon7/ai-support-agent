import type { SupportTicket } from "../domain/support-ticket.js";

export type CreateSupportTicketData = {
    customerId: string;
    reason: string;
};

export interface SupportTicketRepository {
    create(data: CreateSupportTicketData): Promise<SupportTicket>;
}