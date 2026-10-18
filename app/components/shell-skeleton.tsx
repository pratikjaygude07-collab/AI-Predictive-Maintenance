export function ShellSkeleton() {
  return (
    <div className="app-frame">
      <aside
        id="primary-navigation"
        className="sidebar"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          <span className="skeleton-line" style={{ width: "42%" }} />
          <span
            className="skeleton-line"
            style={{ width: 28, height: 28, borderRadius: "8px" }}
          />
        </div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="primary-navigation" aria-label="Workspace">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="navigation-link skeleton-nav">
              <span
                className="skeleton-line"
                style={{ width: 20, height: 20, borderRadius: "50%" }}
              />
              <span className="skeleton-line" style={{ width: "62%" }} />
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="environment-card">
            <span className="skeleton-line" style={{ width: "44%" }} />
            <span className="skeleton-line" style={{ width: "68%" }} />
          </div>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <div className="topbar-leading">
            <span
              className="skeleton-line"
              style={{ width: 32, height: 32, borderRadius: "50%" }}
            />
            <div className="breadcrumb">
              <span className="skeleton-line" style={{ width: "28%" }} />
              <span
                className="skeleton-line"
                style={{ width: 8, height: 8, borderRadius: "50%" }}
              />
              <span className="skeleton-line" style={{ width: "18%" }} />
            </div>
          </div>
        </header>

        <main className="main-content" id="main-content">
          <span className="skeleton-panel" />
        </main>
      </div>
    </div>
  );
}
