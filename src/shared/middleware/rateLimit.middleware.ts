import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/api-response";
import { getClientIp } from "../utils/get-client-ip";
import { contactRatelimit, waitlistRatelimit } from "../services/redis-rate-limit.service";

type RateLimitKind = "waitlist" | "contact";

export function rateLimitMiddleware(kind: RateLimitKind) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const ip = getClientIp(req);
    const identifier = `${kind}:${ip}`;

    const ratelimit = kind === "waitlist" ? waitlistRatelimit : contactRatelimit;
    const result = await ratelimit.limit(identifier);

    res.setHeader("X-RateLimit-Limit", result.limit.toString());
    res.setHeader("X-RateLimit-Remaining", result.remaining.toString());
    if (result.reset) {
      res.setHeader("X-RateLimit-Reset", result.reset.toString());
    }

    if (!result.success) {
      return res
        .status(429)
        .json(errorResponse("Too many requests. Please try again later."));
    }

    next();
  };
}