import { ApplicationError } from "./application-error.js";

export class ValidationError extends ApplicationError {
    readonly code = "VALIDATION_ERROR";
}