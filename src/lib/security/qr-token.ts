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
  // Normalize: remove zero-width chars, whitespace, and handle scanner artifacts
  let trimmed = value.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  // Some scanners insert line breaks/spaces inside base64 - strip all internal whitespace for base64 payloads
  const maybeUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://");

  if (maybeUrl) {
    try {
      const url = new URL(trimmed);
      const embedded = url.searchParams.get("payload") ?? url.searchParams.get("data") ?? url.searchParams.get("qr") ?? url.searchParams.get("t");
      if (embedded) {
        return parseSerializedPayload(embedded);
      }
      // If URL without expected param, try to extract last path segment
      const lastSegment = url.pathname.split("/").filter(Boolean).pop();
      if (lastSegment && lastSegment.length > 20) {
        return parseSerializedPayload(lastSegment);
      }
    } catch {
      // fall through
    }
    throw new AppError(400, "QR code payload is missing.");
  }

  // Remove wrapping quotes if scanner adds them
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  if (trimmed.startsWith("{")) {
    // Strip whitespace/newlines inside JSON payloads from screenshots
    const compact = trimmed.replace(/\s+/g, " ").trim();
    return JSON.parse(compact);
  }

  // For base64url payloads, strip internal whitespace/newlines (common from email copy/paste or line-wrapped prints)
  const cleaned = trimmed.replace(/\s+/g, "");
  // Handle both base64url and standard base64 (scanners may normalize)
  const normalized = cleaned.replace(/-/g, "+").replace(/_/g, "/");
  try {
    // Try base64url first (original format)
    const decoded = Buffer.from(cleaned, "base64url").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    try {
      const decodedStd = Buffer.from(normalized, "base64").toString("utf8");
      return JSON.parse(decodedStd);
    } catch {
      throw new AppError(400, "QR code payload is invalid.");
    }
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
  // Optimized for reliable scanning across email clients, printed paper, and phone screens:
  // - margin: 4 = standard quiet zone (4 modules) required by ISO — previous margin:1 was too tight and caused missed scans
  // - errorCorrectionLevel: "Q" (25%) balances density vs damage tolerance; "H" was denser and slower to scan at 300+ chars
  // - width: 600 gives ~2x retina for 280-300px display, keeps modules ~7-8px for stable detection
  // - explicit high-contrast colors prevent email/theme inversions
  return QRCode.toDataURL(rawPayload, {
    errorCorrectionLevel: "Q",
    margin: 4,
    width: 600,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

// High-res variant for printable/PDF use (even larger quiet zone)
export async function generateQrCodeDataUrlHighRes(rawPayload: string) {
  return QRCode.toDataURL(rawPayload, {
    errorCorrectionLevel: "Q",
    margin: 4,
    width: 900,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
