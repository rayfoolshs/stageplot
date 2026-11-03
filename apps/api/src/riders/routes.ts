import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { parseStageDoc, type StageDoc } from "@stageplot/shared";
import { prisma } from "../db";

const NAME_MAX = 120;
const THUMBNAIL_MAX = 200_000;

const NameSchema = z.string().trim().min(1).max(NAME_MAX);
const ThumbnailSchema = z
  .string()
  .max(THUMBNAIL_MAX)
  .refine((value) => value.startsWith("data:image/"), "Expected an image data URL");

type RiderRow = {
  id: string;
  name: string;
  thumbnail: string | null;
  shareToken: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function summary(rider: RiderRow) {
  return {
    id: rider.id,
    name: rider.name,
    thumbnail: rider.thumbnail,
    shareToken: rider.shareToken,
    isPublic: rider.isPublic,
    createdAt: rider.createdAt.toISOString(),
    updatedAt: rider.updatedAt.toISOString(),
  };
}

function docName(doc: StageDoc): string {
  return doc.meta.name.trim().slice(0, NAME_MAX) || "Untitled rider";
}

function parseDoc(input: unknown): StageDoc | null {
  try {
    return parseStageDoc(input);
  } catch {
    return null;
  }
}

/** Riders are scoped to their owner; anyone else's id behaves as missing. */
async function ownRider(userId: string, id: string) {
  return prisma.rider.findFirst({ where: { id, userId } });
}

function userIdOf(request: FastifyRequest): string | null {
  return request.session.userId ?? null;
}

export async function riderRoutes(app: FastifyInstance) {
  app.get("/api/riders", async (request, reply) => {
    const userId = userIdOf(request);
    if (!userId) return reply.code(401).send({ error: "Sign in to see your riders." });

    const riders = await prisma.rider.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        thumbnail: true,
        shareToken: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { riders: riders.map(summary) };
  });

  app.post("/api/riders", async (request, reply) => {
    const userId = userIdOf(request);
    if (!userId) return reply.code(401).send({ error: "Sign in to save riders." });

    const body = request.body as { doc?: unknown; thumbnail?: unknown } | undefined;
    const doc = parseDoc(body?.doc);
    if (!doc) return reply.code(400).send({ error: "Invalid rider document." });

    let thumbnail: string | null = null;
    if (body?.thumbnail !== undefined) {
      const parsed = ThumbnailSchema.safeParse(body.thumbnail);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid thumbnail." });
      thumbnail = parsed.data;
    }

    const rider = await prisma.rider.create({
      data: { userId, name: docName(doc), doc: JSON.stringify(doc), thumbnail },
    });
    return reply.code(201).send({ rider: summary(rider) });
  });

  app.get("/api/riders/:id", async (request, reply) => {
    const userId = userIdOf(request);
    if (!userId) return reply.code(401).send({ error: "Sign in to open riders." });

    const { id } = request.params as { id: string };
    const rider = await ownRider(userId, id);
    if (!rider) return reply.code(404).send({ error: "Rider not found." });

    const doc = parseDoc(JSON.parse(rider.doc));
    if (!doc) return reply.code(500).send({ error: "Stored rider is unreadable." });

    return { rider: { ...summary(rider), doc } };
  });

  app.put("/api/riders/:id", async (request, reply) => {
    const userId = userIdOf(request);
    if (!userId) return reply.code(401).send({ error: "Sign in to save riders." });

    const { id } = request.params as { id: string };
    const rider = await ownRider(userId, id);
    if (!rider) return reply.code(404).send({ error: "Rider not found." });

    const body = request.body as
      | { doc?: unknown; name?: unknown; thumbnail?: unknown }
      | undefined;

    let name = rider.name;
    let doc = rider.doc;
    let thumbnail = rider.thumbnail;

    if (body?.doc !== undefined) {
      const parsed = parseDoc(body.doc);
      if (!parsed) return reply.code(400).send({ error: "Invalid rider document." });
      doc = JSON.stringify(parsed);
      name = docName(parsed);
    } else if (body?.name !== undefined) {
      // Rename from the list: keep the document's title in step.
      const parsed = NameSchema.safeParse(body.name);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid rider name." });
      const stored = parseDoc(JSON.parse(rider.doc));
      if (!stored) return reply.code(500).send({ error: "Stored rider is unreadable." });
      stored.meta.name = parsed.data;
      name = parsed.data;
      doc = JSON.stringify(stored);
    }

    if (body?.thumbnail !== undefined) {
      const parsed = ThumbnailSchema.safeParse(body.thumbnail);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid thumbnail." });
      thumbnail = parsed.data;
    }

    const updated = await prisma.rider.update({
      where: { id: rider.id },
      data: { name, doc, thumbnail },
    });
    return { rider: summary(updated) };
  });

  app.delete("/api/riders/:id", async (request, reply) => {
    const userId = userIdOf(request);
    if (!userId) return reply.code(401).send({ error: "Sign in to delete riders." });

    const { id } = request.params as { id: string };
    const { count } = await prisma.rider.deleteMany({ where: { id, userId } });
    if (count === 0) return reply.code(404).send({ error: "Rider not found." });
    return { ok: true };
  });
}
