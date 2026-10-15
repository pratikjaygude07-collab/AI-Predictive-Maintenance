"use client";

import {
  Activity,
  Box,
  Boxes,
  Command,
  Gauge,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "Fleet", href: "/fleet", icon: Boxes },
  { label: "Digital twin", href: "/machine", icon: Box },
  { label: "Diagnostics", href: "/diagnostics", icon: Activity },
];

const implementedRoutes = new Set([
  "/dashboard",
  "/fleet",
  "/machine",
  "/diagnostics",
]);

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const currentPage = navigation.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );

  useEffect(() => {
    if (!menuOpen) return;

    function handleMenuKeys(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;
      const focusableItems =
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
      if (!focusableItems?.length) return;

      const firstItem = focusableItems[0];
      const lastItem = focusableItems[focusableItems.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    sidebarRef.current
      ?.querySelector<HTMLElement>('a[href], button:not([disabled])')
      ?.focus();
    document.addEventListener("keydown", handleMenuKeys);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleMenuKeys);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function closeMenu(restoreFocus = false) {
    setMenuOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  }

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      {menuOpen && (
        <button
          className="mobile-scrim is-visible"
          type="button"
          aria-label="Close navigation menu"
          onClick={() => closeMenu(true)}
        />
      )}

      <aside
        id="primary-navigation"
        ref={sidebarRef}
        className={`sidebar${menuOpen ? " is-open" : ""}`}
        role={menuOpen ? "dialog" : undefined}
        aria-modal={menuOpen ? true : undefined}
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          <Link className="brand" href="/" onClick={() => closeMenu()}>
            <span className="brand-mark" aria-hidden="true">
              <Command size={19} strokeWidth={2.3} />
            </span>
            <span className="brand-name">
              Main<span>AI</span>
            </span>
            <span className="brand-edition">OPS</span>
          </Link>
          <button
            className="icon-button sidebar-close-button"
            type="button"
            aria-label="Close navigation menu"
            onClick={() => closeMenu(true)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="primary-navigation" aria-label="Workspace">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            const implemented = implementedRoutes.has(href);
            const content = (
              <>
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
                {active && (
                  <span className="active-indicator" aria-hidden="true" />
                )}
                {!implemented && (
                  <span className="navigation-status">SOON</span>
                )}
              </>
            );

            return (
              <div key={href}>
                {implemented ? (
                  <Link
                    className={`navigation-link${active ? " is-active" : ""}`}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => closeMenu()}
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    aria-disabled="true"
                    className="navigation-link navigation-disabled"
                    title="This section will be available in a later build stage."
                  >
                    {content}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="environment-card">
            <span className="environment-icon" aria-hidden="true">
              <Activity size={16} />
            </span>
            <div>
              <div className="environment-title">Demo environment</div>
              <div className="environment-caption">Local simulation only</div>
            </div>
            <span className="environment-dot" aria-label="Demo mode active" />
          </div>
          <div className="sidebar-footnote">MAINTENANCE INTELLIGENCE</div>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <div className="topbar-leading">
            <button
              ref={menuButtonRef}
              className="icon-button mobile-menu-button"
              type="button"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="primary-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
            <div className="breadcrumb">
              <span>MainAI</span>
              <span className="breadcrumb-divider">/</span>
              <span className="breadcrumb-current">
                {currentPage?.label ?? "Workspace"}
              </span>
            </div>
          </div>
          <div className="topbar-trailing">
            <span className="topbar-context">
              <span className="topbar-context-dot" aria-hidden="true" />
              Demonstration workspace
            </span>
            <span className="demo-pill">
              <span aria-hidden="true" />
              DEMO MODE
            </span>
            <div className="workspace-switcher">
              <span className="workspace-avatar">DP</span>
              <span className="workspace-name">Demo plant</span>
            </div>
          </div>
        </header>

        <main className="main-content" id="main-content">
          {children}
          <footer className="app-footer">
            <span>MainAI <span aria-hidden="true">·</span> Industrial monitoring, reimagined.</span>
            <span>All readings are <strong>SIMULATED DATA</strong></span>
          </footer>
        </main>
      </div>
    </div>
  );
}
