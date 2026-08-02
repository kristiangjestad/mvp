import { Redis } from "@upstash/redis";

let redis: Redis | undefined;

export function getRedis() {
  if (redis) return redis;

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error("Redis-miljøvariablene mangler.");
  }

  redis = new Redis({ url, token });
  return redis;
}
