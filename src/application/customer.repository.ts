import type { Customer } from "../domain/customer.js";

export interface CustomerRepository {
    findById(customerId: string): Promise<Customer | null>;
}