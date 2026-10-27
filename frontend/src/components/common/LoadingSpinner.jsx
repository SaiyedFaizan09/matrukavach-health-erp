export default function LoadingSpinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold">
      <div className="mk-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function LoadingOverlay({ show }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40">
      <div className="border border-zinc-900 bg-white px-6 py-4">
        <LoadingSpinner label="Working… please wait" />
      </div>
    </div>
  );
}
