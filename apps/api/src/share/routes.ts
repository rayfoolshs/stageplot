import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { parseStageDoc } from "@stageplot/shared";
import { prisma } from "../db";

// 24 random bytes → 32 url-safe characters. Unguessable; revocation throws it
// away rather than reusing it.
const newToken = () => randomBytes(24).toString("base64url");

export async function shareRoutes(app: FastifyInstance) {
  app.post("/api/riders/:id/share", async (request, reply) => {
    const userId = request.session.userId;
    if (!userId) return reply.code(401).send({ error: "Sign in to share riders." });

    const { id } = request.params as { id: string };
    const rider = await prisma.rider.findFirst({ where: { id, userId } });
    if (!rider) return reply.code(404).send({ error: "Rider not found." });

    // Re-sharing an active link returns the same token; a revoked one gets a
    // fresh token so old links can never come back to life.
    const shareToken = rider.isPublic && rider.shareToken ? rider.shareToken : newToken();
    const updated = await prisma.rider.update({
      where: { id: rider.id },
      data: { shareToken, isPublic: true },
    });

    return { shareToken: updated.shareToken, isPublic: updated.isPublic };
  });

  app.delete("/api/riders/:id/share", async (request, reply) => {
    const userId = request.session.userId;
    if (!userId) return reply.code(401).send({ error: "Sign in to manage sharing." });

    const { id } = request.params as { id: string };
    const rider = await prisma.rider.findFirst({ where: { id, userId } });
    if (!rider) return reply.code(404).send({ error: "Rider not found." });

    await prisma.rider.update({
      where: { id: rider.id },
      data: { shareToken: null, isPublic: false },
    });
    return { ok: true };
  });

  // Public, unauthenticated read-only view. Only the document is exposed —
  // never the owner, their email, or any other rider.
  app.get(
    "/api/share/:token",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const { token } = request.params as { token: string };
      if (!token || token.length < 10 || token.length > 100) {
        return reply.code(404).send({ error: "This link is no longer available." });
      }

      const rider = await prisma.rider.findUnique({ where: { shareToken: token } });
      if (!rider || !rider.isPublic) {
        return reply.code(404).send({ error: "This link is no longer available." });
      }

      let doc;
      try {
        doc = parseStageDoc(JSON.parse(rider.doc));
      } catch {
        return reply.code(500).send({ error: "This rider can’t be displayed." });
      }

      // Revocation must take effect immediately.
      reply.header("Cache-Control", "no-store");
      return {
        rider: {
          name: rider.name,
          thumbnail: rider.thumbnail,
          updatedAt: rider.updatedAt.toISOString(),
          doc,
        },
      };
    },
  );
}
