import crypto from "node:crypto";

import QRCode from "qrcode";
import { z } from "zod";

import { getQrEnv } from "@/lib/env";
import { AppError } from "@/lib/http";
import { hashQrToken, secureCompare } from "@/lib/security/hash";

const qrPayloadSchema = z.object({
  eventId: z.string().uuid(),
  participantId: z.string().uuid(),
  token: z.string().min(20),
  issuedAt: z.string().datetime(),
  signature: z.string().min(32),
});

type UnsignedQrPayload = Omit<z.infer<typeof qrPayloadSchema>, "signature">;
export type SignedQrPayload = z.infer<typeof qrPayloadSchema>;

function canonicalizePayload(payload: UnsignedQrPayload) {
  return `${payload.eventId}.${payload.participantId}.${payload.token}.${payload.issuedAt}`;
}

function signPayload(payload: UnsignedQrPayload) {
  return crypto
    .createHmac("sha256", getQrEnv().QR_SIGNING_SECRET)
    .update(canonicalizePayload(payload))
    .digest("hex");
}

export function serializeQrPayload(payload: SignedQrPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function parseSerializedPayload(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const url = new URL(trimmed);
    const embedded = url.searchParams.get("payload") ?? url.searchParams.get("data") ?? url.searchParams.get("qr");
    if (!embedded) {
      throw new AppError(400, "QR code payload is missing.");
    }

    return parseSerializedPayload(embedded);
  }

  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  try {
    const decoded = Buffer.from(trimmed, "base64url").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    throw new AppError(400, "QR code payload is invalid.");
  }
}

export function createSignedQrPayload(params: { eventId: string; participantId: string }) {
  const token = crypto.randomBytes(32).toString("base64url");
  const issuedAt = new Date().toISOString();

  const unsignedPayload: UnsignedQrPayload = {
    eventId: params.eventId,
    participantId: params.participantId,
    token,
    issuedAt,
  };

  const payload: SignedQrPayload = {
    ...unsignedPayload,
    signature: signPayload(unsignedPayload),
  };

  return {
    rawToken: token,
    tokenHash: hashQrToken(token),
    payload,
    encodedPayload: serializeQrPayload(payload),
  };
}

export function verifySignedQrPayload(rawPayload: string) {
  const payload = qrPayloadSchema.parse(parseSerializedPayload(rawPayload));
  const expectedSignature = signPayload({
    eventId: payload.eventId,
    participantId: payload.participantId,
    token: payload.token,
    issuedAt: payload.issuedAt,
  });

  if (!secureCompare(expectedSignature, payload.signature)) {
    throw new AppError(400, "QR signature verification failed.");
  }

  return payload;
}

export async function generateQrCodeDataUrl(rawPayload: string) {
  return QRCode.toDataURL(rawPayload, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 480,
  });
}
