export type SupportTicket = {
    id: string;
    customerId: string;
    reason: string;
    status: "open" | "closed";
    createdAt: Date;
}