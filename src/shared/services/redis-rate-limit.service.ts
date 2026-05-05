import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "../../infrastructure/redis/redis";

export const waitlistRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, "1 h"),
  analytics: true,
});

export const contactRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(3, "10 m"),
  analytics: true,
});