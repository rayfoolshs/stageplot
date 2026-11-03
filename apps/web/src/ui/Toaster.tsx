import { useToastStore, type ToastKind } from "./toast";

const STYLES: Record<ToastKind, string> = {
  info: "border-neutral-700 bg-neutral-900 text-neutral-200",
  success: "border-emerald-800 bg-emerald-950/90 text-emerald-200",
  error: "border-red-900 bg-red-950/90 text-red-200",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-2 rounded-md border px-3 py-2 text-sm shadow-xl ${STYLES[item.kind]}`}
        >
          <span className="flex-1">{item.message}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismiss(item.id)}
            className="-mr-1 shrink-0 rounded px-1 text-base leading-none opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
