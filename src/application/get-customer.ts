import type { CustomerRepository } from "./customer.repository.js";
import { normalizeCustomerId } from "./shared/normalize-customer-id.js";

export type GetCustomerInput = {
    customerId: string;
};

export class GetCustomer {
    constructor(private readonly customerRepository: CustomerRepository) { }

    async execute({ customerId }: GetCustomerInput) {
        const normalizedCustomerId = normalizeCustomerId(customerId);

        return this.customerRepository.findById(normalizedCustomerId);
    }
}