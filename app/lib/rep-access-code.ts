import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const deriveKey = promisify(scrypt);

export async function hashRepAccessCode(accessCode: string) {
  const salt = randomBytes(16);
  const key = await deriveKey(accessCode, salt, 64) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyRepAccessCode(accessCode: string, encoded: string) {
  const [algorithm, saltValue, keyValue] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltValue || !keyValue) return false;

  try {
    const salt = Buffer.from(saltValue, "base64url");
    const expected = Buffer.from(keyValue, "base64url");
    const actual = await deriveKey(accessCode, salt, expected.length) as Buffer;
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}