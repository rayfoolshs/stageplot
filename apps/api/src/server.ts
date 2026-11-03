import Fastify from "fastify";
import cookie from "@fastify/cookie";
import session from "@fastify/session";
import rateLimit from "@fastify/rate-limit";
import { createEmptyDoc, parseStageDoc } from "@stageplot/shared";
import { closePdfRenderer, renderPdf } from "./pdf";
import { authRoutes } from "./auth/routes";
import { riderRoutes } from "./riders/routes";
import { shareRoutes } from "./share/routes";
import { favoriteRoutes } from "./favorites/routes";

const PORT = Number(process.env.PORT ?? 3001);
const IS_PROD = process.env.NODE_ENV === "production";
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "dev-only-session-secret-please-change-32ch";

if (IS_PROD && SESSION_SECRET.startsWith("dev-only")) {
  throw new Error("Set a real SESSION_SECRET before running in production.");
}

// A rider document plus an SVG thumbnail comfortably fits; cap it so a bad
// client can't hand us an unbounded JSON body.
const app = Fastify({ logger: true, bodyLimit: 3 * 1024 * 1024 });

// In-memory session store is fine for dev; M4 swaps in a persistent store.
await app.register(cookie);
await app.register(session, {
  secret: SESSION_SECRET,
  cookieName: "stageplot.sid",
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD, // requires HTTPS in production
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
});

// Per-route limits (see auth routes); off by default elsewhere.
await app.register(rateLimit, { global: false });

await app.register(authRoutes);
await app.register(riderRoutes);
await app.register(shareRoutes);
await app.register(favoriteRoutes);

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

// M2: render the rider to PDF using the shared `/print` view in headless Chrome.
// Unauthenticated for now (the dev server binds to loopback only); the render
// route gets the same session guard as everything else in M3.
app.post("/api/render/pdf", async (request, reply) => {
  const body = request.body as { doc?: unknown } | undefined;
  const result = parseStageDocSafe(body?.doc);
  if (!result.ok) {
    return reply.code(400).send({ error: `Invalid StageDoc: ${result.error}` });
  }

  try {
    const pdf = await renderPdf(result.doc);
    const filename =
      (result.doc.meta.name || "stageplot").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") ||
      "stageplot";
    return reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `attachment; filename="${filename}.pdf"`)
      .send(pdf);
  } catch (err) {
    request.log.error({ err }, "PDF render failed");
    return reply.code(502).send({
      error: "PDF render failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
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

// Tear down the warm browser before exiting so no Chrome process is orphaned.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void closePdfRenderer().finally(() => {
      void app.close().finally(() => process.exit(0));
    });
  });
}
