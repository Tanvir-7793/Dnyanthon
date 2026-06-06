import { AppError } from "@/lib/http";

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

declare global {
  var __dnyanothsavRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const rateLimitStore = globalThis.__dnyanothsavRateLimitStore ?? new Map<string, RateLimitEntry>();

if (!globalThis.__dnyanothsavRateLimitStore) {
  globalThis.__dnyanothsavRateLimitStore = rateLimitStore;
}

export async function enforceRateLimit(options: {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const compositeKey = `${options.bucket}:${options.key}`;
  const existing = rateLimitStore.get(compositeKey);

  if (!existing || existing.expiresAt <= now) {
    rateLimitStore.set(compositeKey, {
      count: 1,
      expiresAt: now + options.windowMs,
    });
    return;
  }

  if (existing.count >= options.limit) {
    throw new AppError(429, "Too many requests. Please try again shortly.");
  }

  existing.count += 1;
  rateLimitStore.set(compositeKey, existing);
}
