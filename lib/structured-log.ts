import { NextRequest } from "next/server";

type LogLevel = "info" | "warn" | "error";

type LogData = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

export function maskEmail(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const [localPart, domain] = value.split("@");
  if (!localPart || !domain) {
    return value;
  }

  const visibleLocal = localPart.length <= 2
    ? `${localPart[0] ?? "*"}*`
    : `${localPart.slice(0, 2)}***`;

  return `${visibleLocal}@${domain}`;
}

export function getRequestLogContext(request: NextRequest): LogData {
  return {
    method: request.method,
    path: request.nextUrl.pathname,
    ip:
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  };
}

export function logEvent(
  level: LogLevel,
  event: string,
  data: LogData = {},
) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...data,
  };

  const line = JSON.stringify(payload, (_, value) =>
    value instanceof Error ? serializeError(value) : value,
  );

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logInfo(event: string, data: LogData = {}) {
  logEvent("info", event, data);
}

export function logWarn(event: string, data: LogData = {}) {
  logEvent("warn", event, data);
}

export function logError(event: string, data: LogData = {}) {
  logEvent("error", event, data);
}
