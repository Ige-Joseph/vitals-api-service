import { AppError } from "./app.error";

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(message, 429);
    this.name = "TooManyRequestsError";
  }
}