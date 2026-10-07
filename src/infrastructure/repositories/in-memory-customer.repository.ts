import type { Customer } from "../../domain/customer.js";
import type { CustomerRepository } from "../../application/customer.repository.js";

const customers: Customer[] = [
    {
        id: "cus_001",
        name: "Alice Martin",
        email: "alice@example.com",
    },
    {
        id: "cus_002",
        name: "David Smith",
        email: "david@example.com",
    },
];

export class InMemoryCustomerRepository implements CustomerRepository {
    async findById(customerId: string): Promise<Customer | null> {
        return Promise.resolve(customers.find((customer) => customer.id === customerId) ?? null);
    }
}