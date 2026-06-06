import { z } from "zod";

export const verifyQrAndClaimServiceSchema = z.object({
  qrPayload: z.string().trim().min(1),
  serviceTypeId: z.string().uuid(),
  deviceId: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const offlineClaimSchema = z.object({
  localId: z.string().trim().max(120).optional(),
  qrPayload: z.string().trim().min(1),
  serviceTypeId: z.string().uuid(),
  deviceId: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const syncOfflineClaimsSchema = z.object({
  claims: z.array(offlineClaimSchema).min(1).max(100),
});

export type VerifyQrAndClaimServiceInput = z.infer<typeof verifyQrAndClaimServiceSchema>;
export type OfflineClaimInput = z.infer<typeof offlineClaimSchema>;
