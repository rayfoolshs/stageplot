import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id with OWASP's baseline parameters (19 MiB, t=2, p=1). Hashing is
 * CPU-bound, so callers await these inside the request (Fastify handlers are
 * async and the native binding releases the event loop).
 */
const OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

/** Constant-ish: a malformed/unreadable digest simply fails to verify. */
export async function verifyPassword(digest: string, password: string): Promise<boolean> {
  try {
    return await verify(digest, password, OPTIONS);
  } catch {
    return false;
  }
}
