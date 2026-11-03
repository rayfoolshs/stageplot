import Fastify from "fastify";
import cookie from "@fastify/cookie";
import session from "@fastify/session";
import { createEmptyDoc, parseStageDoc } from "@stageplot/shared";
import { closePdfRenderer, renderPdf } from "./pdf";

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

// M2: render the rider to PDF using the shared `/print` view in headless Chrome.
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
