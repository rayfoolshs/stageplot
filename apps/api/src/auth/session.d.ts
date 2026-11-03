import "fastify";

// What we keep in the signed session cookie: just the account id. Everything
// else is read from the database so a stale cookie can't resurrect old data.
declare module "fastify" {
  interface Session {
    userId?: string;
  }
}
