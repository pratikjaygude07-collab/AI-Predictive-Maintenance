export function PageLoading({ label }: { label: string }) {
  return (
    <section className="route-loading" role="status" aria-busy="true">
      <div className="route-loading-announcement">
        <span className="loading-indicator" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className="route-loading-skeleton" aria-hidden="true">
        <span className="route-loading-title" />
        <span className="route-loading-copy" />
        <span className="route-loading-panel" />
      </div>
    </section>
  );
}
