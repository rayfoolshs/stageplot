import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { hashPassword, verifyPassword } from "./password";

const Credentials = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(200),
});

type SafeUser = { id: string; email: string; createdAt: Date };

function publicUser(user: SafeUser) {
  return { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() };
}

/**
 * Cross-origin requests are refused on state-changing auth routes. Combined
 * with the cookie's SameSite=Lax this blocks CSRF without a token round-trip;
 * requests with no Origin (curl, server-to-server) are allowed so the API stays
 * usable from scripts.
 */
function allowedOrigins(): string[] {
  const raw =
    process.env.WEB_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isSameOrigin(request: FastifyRequest): boolean {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    return allowedOrigins().includes(new URL(origin).origin);
  } catch {
    return false;
  }
}

// Burning a comparable hash on unknown emails keeps response timing from
// revealing which addresses exist.
let dummyHash: string | null = null;
async function burnPasswordTime(password: string): Promise<void> {
  dummyHash ??= await hashPassword("stageplot-dummy-password");
  await verifyPassword(dummyHash, password);
}

const BUSY = { max: 10, timeWindow: "1 minute" } as const;
const SIGNUP = { max: 5, timeWindow: "10 minutes" } as const;

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/api/auth/register",
    { config: { rateLimit: SIGNUP } },
    async (request, reply) => {
      if (!isSameOrigin(request)) {
        return reply.code(403).send({ error: "Cross-origin request blocked." });
      }

      const parsed = Credentials.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "Enter a valid email and a password of at least 8 characters.",
        });
      }

      const email = parsed.data.email.toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (existing) {
        return reply.code(409).send({ error: "That email is already registered." });
      }

      const passwordHash = await hashPassword(parsed.data.password);
      const user = await prisma.user.create({ data: { email, passwordHash } });

      await request.session.regenerate();
      request.session.userId = user.id;
      return reply.code(201).send({ user: publicUser(user) });
    },
  );

  app.post(
    "/api/auth/login",
    { config: { rateLimit: BUSY } },
    async (request, reply) => {
      if (!isSameOrigin(request)) {
        return reply.code(403).send({ error: "Cross-origin request blocked." });
      }

      const parsed = Credentials.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Enter your email and password." });
      }

      const email = parsed.data.email.toLowerCase();
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        await burnPasswordTime(parsed.data.password);
        return reply.code(401).send({ error: "Invalid email or password." });
      }

      const ok = await verifyPassword(user.passwordHash, parsed.data.password);
      if (!ok) {
        return reply.code(401).send({ error: "Invalid email or password." });
      }

      // New session id on login, so a pre-login cookie can't be fixated.
      await request.session.regenerate();
      request.session.userId = user.id;
      return { user: publicUser(user) };
    },
  );

  app.post("/api/auth/logout", async (request, reply) => {
    if (!isSameOrigin(request)) {
      return reply.code(403).send({ error: "Cross-origin request blocked." });
    }
    await request.session.destroy();
    reply.clearCookie("stageplot.sid", { path: "/" });
    return { ok: true };
  });

  app.get("/api/auth/me", async (request, reply) => {
    const userId = request.session.userId;
    if (!userId) return reply.code(401).send({ user: null });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      await request.session.destroy();
      return reply.code(401).send({ user: null });
    }
    return { user: publicUser(user) };
  });
}
