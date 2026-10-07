import type { CustomerRepository } from "./customer.repository.js";

export type GetCustomerInput = {
    customerId: string;
};

export class GetCustomer {
    constructor(private readonly customerRepository: CustomerRepository) { }

    async execute({ customerId }: GetCustomerInput) {
        return this.customerRepository.findById(customerId);
    }
}