export default function SeedLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 space-y-3">
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="h-10 w-96 max-w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="mb-6 flex items-center gap-3">
        <div className="size-10 animate-pulse rounded-full bg-muted" />
        <div className="space-y-1.5">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="h-px bg-border mb-6" />
      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
