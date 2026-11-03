import { useEffect, useState, type FormEvent } from "react";
import { useAuthStore } from "./store";

const field =
  "w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-sky-500 focus:outline-none";

/**
 * Sign in / create account. The editor itself stays usable without an account
 * (riders live in localStorage), so these screens are about claiming an
 * identity for cloud save in M4 — not a gate on the editor.
 */
export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Only same-origin paths are honoured after sign-in.
  const requested = new URLSearchParams(window.location.search).get("next");
  const next = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/";

  useEffect(() => {
    if (useAuthStore.getState().status === "loading") void useAuthStore.getState().refresh();
  }, []);

  // Guest-only guard: already signed in? Go where they were headed.
  useEffect(() => {
    if (status === "ready" && user) window.location.replace(next);
  }, [status, user, next]);

  const isRegister = mode === "register";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isRegister) await register(email, password);
      else await login(email, password);
      window.location.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-neutral-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <a href="/" className="text-xl font-semibold tracking-wide text-neutral-100">
            StagePlot
          </a>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-neutral-500">
            Stage plots &amp; tech riders
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900 p-5 shadow-xl"
        >
          <div>
            <h1 className="text-base font-semibold text-neutral-100">
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              {isRegister
                ? "Save riders to the cloud and open them anywhere (coming in M4)."
                : "Sign in to keep your riders in sync."}
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-[11px] uppercase tracking-wide text-neutral-500">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
              placeholder="you@band.example"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-[11px] uppercase tracking-wide text-neutral-500"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
              placeholder={isRegister ? "At least 8 characters" : "Your password"}
            />
          </div>

          {error && (
            <p role="alert" className="rounded border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "One moment…" : isRegister ? "Create account" : "Sign in"}
          </button>

          <p className="text-center text-xs text-neutral-500">
            {isRegister ? "Already have an account? " : "New to StagePlot? "}
            <a
              href={isRegister ? "/login" : "/register"}
              className="font-medium text-sky-400 hover:text-sky-300"
            >
              {isRegister ? "Sign in" : "Create one"}
            </a>
          </p>
        </form>

        <p className="mt-4 text-center text-xs text-neutral-600">
          <a href="/" className="hover:text-neutral-400">
            ← Keep working without an account
          </a>
        </p>
      </div>
    </div>
  );
}
