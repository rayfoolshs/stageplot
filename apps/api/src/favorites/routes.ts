import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db";

const ItemKey = z.object({ itemKey: z.string().trim().min(1).max(80) });

async function listFor(userId: string): Promise<string[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    select: { itemKey: true },
    orderBy: { itemKey: "asc" },
  });
  return rows.map((row) => row.itemKey);
}

export async function favoriteRoutes(app: FastifyInstance) {
  app.get("/api/favorites", async (request, reply) => {
    const userId = request.session.userId;
    if (!userId) return reply.code(401).send({ error: "Sign in to keep favorites." });
    return { itemKeys: await listFor(userId) };
  });

  // Toggle: PUT with an itemKey adds it if absent, removes it if present.
  app.put("/api/favorites", async (request, reply) => {
    const userId = request.session.userId;
    if (!userId) return reply.code(401).send({ error: "Sign in to keep favorites." });

    const parsed = ItemKey.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid item." });

    const { itemKey } = parsed.data;
    const existing = await prisma.favorite.findUnique({
      where: { userId_itemKey: { userId, itemKey } },
      select: { id: true },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
    } else {
      await prisma.favorite.create({ data: { userId, itemKey } });
    }

    return { itemKeys: await listFor(userId) };
  });
}
