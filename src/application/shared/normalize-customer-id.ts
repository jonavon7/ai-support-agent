import { ValidationError } from "../errors/validation.error.js";

export function normalizeCustomerId(
    value: string,
): string {
    const customerId = value.trim();

    if (!customerId) {
        throw new ValidationError(
            "Customer ID must not be empty",
        );
    }

    return customerId;
}