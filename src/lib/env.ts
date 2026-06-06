import { z } from "zod";

function isValidSenderAddress(value: string) {
  const trimmed = value.trim();
  const basicEmailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

  if (basicEmailPattern.test(trimmed)) {
    return true;
  }

  const namedAddressMatch = trimmed.match(/<([^<>]+)>$/);
  return namedAddressMatch ? basicEmailPattern.test(namedAddressMatch[1].trim()) : false;
}

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const supabaseAdminEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const qrEnvSchema = z.object({
  QR_SIGNING_SECRET: z.string().min(32),
});

const resendEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  FROM_EMAIL: z
    .string()
    .trim()
    .min(1)
    .refine(
      isValidSenderAddress,
      "FROM_EMAIL must be a valid sender email like noreply@example.com or Dnyanothon <noreply@example.com>.",
    ),
});

const appEnvSchema = z.object({
  APP_URL: z.string().url(),
});

const jwtEnvSchema = z.object({
  SUPABASE_JWT_SECRET: z.string().min(1),
});

const adminAuthEnvSchema = z.object({
  ADMIN_LOGIN_EMAIL: z.string().email(),
  ADMIN_LOGIN_PASSWORD: z.string().min(8),
});

export function getPublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function getSupabaseAdminEnv() {
  return supabaseAdminEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

export function getQrEnv() {
  return qrEnvSchema.parse({
    QR_SIGNING_SECRET: process.env.QR_SIGNING_SECRET,
  });
}

export function getResendEnv() {
  return resendEnvSchema.parse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
  });
}

export function getAppEnv() {
  return appEnvSchema.parse({
    APP_URL: process.env.APP_URL,
  });
}

export function getJwtEnv() {
  return jwtEnvSchema.parse({
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  });
}

export function getAdminAuthEnv() {
  return adminAuthEnvSchema.parse({
    ADMIN_LOGIN_EMAIL: process.env.ADMIN_LOGIN_EMAIL ?? "admin7793@gmail.com",
    ADMIN_LOGIN_PASSWORD: process.env.ADMIN_LOGIN_PASSWORD ?? "Admin@12345",
  });
}
