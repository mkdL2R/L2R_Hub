// Lightweight, dev-only auth tracer. Logs every step of the auth flow to the
// browser console so we can trace login → profile → dashboard end to end.
// Safe to leave in production: only logs when import.meta.env.DEV is true.

const enabled =
  typeof import.meta !== "undefined" &&
  (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV !== false;

export function alog(step: string, data?: unknown) {
  if (!enabled) return;
  // eslint-disable-next-line no-console
  console.log(`%c[auth] ${step}`, "color:#2F6FD8;font-weight:600", data ?? "");
}

export function aerr(step: string, err: unknown, extra?: unknown) {
  // Always log errors, even in prod, so users can copy them.
  // eslint-disable-next-line no-console
  console.error(`[auth:error] ${step}`, err, extra ?? "");
}

export function describeError(err: unknown): string {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    const anyErr = err as { message?: string; error_description?: string; msg?: string };
    return anyErr.message || anyErr.error_description || anyErr.msg || JSON.stringify(err);
  } catch {
    return String(err);
  }
}