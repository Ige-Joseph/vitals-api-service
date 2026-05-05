import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app.error";
import { errorResponse } from "../utils/api-response";
import { logger } from "../../config/logger";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    return res.status(400).json(
      errorResponse("Validation failed", error.flatten().fieldErrors)
    );
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json(
      errorResponse(error.message, error.details)
    );
  }

  logger.error("Unhandled application error", error);

  return res.status(500).json(
    errorResponse("Internal server error")
  );
}