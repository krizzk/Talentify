export default function ProtectedLoading() {
  return (
    <div className="page-shell max-w-6xl">
      <div className="surface-panel-strong mb-8 h-40 animate-pulse" />
      <div className="grid gap-4">
        <div className="surface-panel h-28 animate-pulse" />
        <div className="surface-panel h-28 animate-pulse" />
        <div className="surface-panel h-28 animate-pulse" />
      </div>
    </div>
  );
}
