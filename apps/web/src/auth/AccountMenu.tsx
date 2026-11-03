import { useState } from "react";
import { useAuthStore } from "./store";

/** Compact account control for the toolbar: sign in, or the email + sign out. */
export function AccountMenu() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const logout = useAuthStore((s) => s.logout);
  const [busy, setBusy] = useState(false);

  if (status === "loading") {
    return <span className="w-16 animate-pulse rounded bg-neutral-800 px-2 py-1.5" />;
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="rounded-md bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700"
      >
        Sign in
      </a>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span
        title={user.email}
        className="max-w-[11rem] truncate rounded-md bg-neutral-800/60 px-2 py-1 text-xs text-neutral-400"
      >
        {user.email}
      </span>
      <button
        type="button"
        title="Sign out"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await logout();
          } finally {
            setBusy(false);
          }
        }}
        className="rounded-md bg-neutral-800 px-2.5 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700 disabled:opacity-50"
      >
        Sign out
      </button>
    </div>
  );
}
