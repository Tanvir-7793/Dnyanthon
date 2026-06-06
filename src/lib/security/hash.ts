import crypto from "node:crypto";

import { getQrEnv } from "@/lib/env";

export function hashQrToken(rawToken: string) {
  return crypto
    .createHmac("sha256", getQrEnv().QR_SIGNING_SECRET)
    .update(rawToken)
    .digest("hex");
}

export function secureCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
