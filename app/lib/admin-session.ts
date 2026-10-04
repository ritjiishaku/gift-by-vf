const encoder = new TextEncoder();

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || (process.env.NODE_ENV === "production" ? "" : "giftbyvf-local-admin-session-secret");
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signingKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createAdminSession() {
  const secret = sessionSecret();
  if (!secret) return null;
  const payload = toBase64Url(encoder.encode(JSON.stringify({ role: "admin", expiresAt: Date.now() + 12 * 60 * 60 * 1000 })));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(secret), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAdminSession(value?: string) {
  const secret = sessionSecret();
  if (!secret || !value) return false;

  try {
    const [payload, signature] = value.split(".");
    if (!payload || !signature) return false;
    const valid = await crypto.subtle.verify("HMAC", await signingKey(secret), fromBase64Url(signature), encoder.encode(payload));
    if (!valid) return false;
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { role: string; expiresAt: number };
    return session.role === "admin" && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}