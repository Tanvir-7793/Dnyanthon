import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  status: number;

  expose: boolean;

  constructor(status: number, message: string, expose = true) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.expose = expose;
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

function getCorsOrigin(request: Request) {
  return request.headers.get("origin") ?? "*";
}

function getCorsAllowedHeaders(request: Request) {
  const requestedHeaders = request.headers.get("access-control-request-headers")?.trim();

  if (requestedHeaders) {
    return requestedHeaders;
  }

  return "Authorization, Content-Type, apikey, x-client-info, x-supabase-api-version";
}

export function getCorsHeaders(request: Request) {
  const requestedMethod = request.headers.get("access-control-request-method")?.trim();

  return {
    "Access-Control-Allow-Origin": getCorsOrigin(request),
    "Access-Control-Allow-Methods": requestedMethod ? `${requestedMethod}, OPTIONS` : "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": getCorsAllowedHeaders(request),
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin, Access-Control-Request-Headers, Access-Control-Request-Method",
  };
}

export function withCors(response: NextResponse, request: Request) {
  const headers = getCorsHeaders(request);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export function jsonCorsOk<T>(data: T, request: Request, init?: ResponseInit) {
  return withCors(jsonOk(data, init), request);
}

export function corsPreflight(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export function jsonError(error: unknown, fallbackMessage = "Something went wrong") {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    return NextResponse.json(
      {
        error: firstIssue?.message || "Invalid request data.",
        issues: error.issues,
      },
      { status: 400 },
    );
  }

  console.error(error);

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export function jsonCorsError(request: Request, error: unknown, fallbackMessage = "Something went wrong") {
  return withCors(jsonError(error, fallbackMessage), request);
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function normalizeOptionalString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function escapeCsvValue(value: string | number | null | undefined) {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
