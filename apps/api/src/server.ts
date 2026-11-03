import Fastify from "fastify";
import cookie from "@fastify/cookie";
import session from "@fastify/session";
import { createEmptyDoc, parseStageDoc } from "@stageplot/shared";

const PORT = Number(process.env.PORT ?? 3001);
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "dev-only-session-secret-please-change-32ch";

const app = Fastify({ logger: true });

// Sessions are wired now so M3 (accounts) has a foundation to build on.
await app.register(cookie);
await app.register(session, {
  secret: SESSION_SECRET,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true behind HTTPS in production
  },
});

app.get("/api/health", async () => ({
  ok: true,
  service: "stageplot-api",
  time: new Date().toISOString(),
}));

// Proves the shared StageDoc contract round-trips through the API.
app.get("/api/meta/empty-doc", async () => ({ doc: createEmptyDoc() }));

app.post("/api/meta/validate-doc", async (request, reply) => {
  const result = parseStageDocSafe(request.body);
  if (!result.ok) {
    return reply.code(400).send({ ok: false, error: result.error });
  }
  return { ok: true, doc: result.doc };
});

function parseStageDocSafe(body: unknown) {
  try {
    return { ok: true as const, doc: parseStageDoc(body) };
  } catch (err) {
    return { ok: false as const, error: (err as Error).message };
  }
}

try {
  await app.listen({ port: PORT, host: "127.0.0.1" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
