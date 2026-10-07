import { ApplicationError } from "./application-error.js";

export class NotFoundError extends ApplicationError {
    readonly code = "NOT_FOUND";
}