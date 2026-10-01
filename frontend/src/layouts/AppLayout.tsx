import { useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { ROLE } from "../constants/roles";

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isAdmin = user?.roleId === ROLE.ADMIN;

  const initials = useMemo(() => {
    if (!user) {
      return "U";
    }

    const firstInitial = user.firstName?.charAt(0) ?? "";
    const lastInitial = user.lastName?.charAt(0) ?? "";

    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [user]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  function closeMobileSidebar() {
    setMobileSidebarOpen(false);
  }

  function navClass({ isActive }: { isActive: boolean }) {
    return `app-nav-link ${isActive ? "active" : ""}`;
  }

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <button
          type="button"
          className="app-sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`app-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}
      >
        <div className="app-sidebar-inner">
          {/* Brand */}
          <div className="app-brand">
            <div className="app-brand-mark">W</div>

            <div className="app-brand-text">
              <div className="app-brand-title">WorkSphere</div>

              <div className="app-brand-subtitle">Employee Management</div>
            </div>

            <button
              type="button"
              className="app-mobile-close"
              onClick={closeMobileSidebar}
              aria-label="Close navigation"
            >
              ×
            </button>
          </div>

          {/* Navigation */}
          <div className="app-nav-section">
            <div className="app-nav-label">MAIN MENU</div>

            <nav className="app-nav">
              <NavLink
                to="/dashboard"
                className={navClass}
                onClick={closeMobileSidebar}
              >
                <span className="app-nav-icon">⌂</span>
                <span>Dashboard</span>
              </NavLink>

              {isAdmin && (
                <>
                  <NavLink
                    to="/users"
                    className={navClass}
                    onClick={closeMobileSidebar}
                  >
                    <span className="app-nav-icon">♙</span>
                    <span>Users</span>
                  </NavLink>

                  <NavLink
                    to="/departments"
                    className={navClass}
                    onClick={closeMobileSidebar}
                  >
                    <span className="app-nav-icon">▦</span>
                    <span>Departments</span>
                  </NavLink>

                  <NavLink
                    to="/employees"
                    className={navClass}
                    onClick={closeMobileSidebar}
                  >
                    <span className="app-nav-icon">♧</span>
                    <span>Employees</span>
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Bottom user */}
          <div className="app-sidebar-bottom">
            {user && (
              <div className="app-user-card">
                <div className="app-avatar">{initials}</div>

                <div className="app-user-info">
                  <div className="app-user-name">
                    {user.firstName} {user.lastName}
                  </div>

                  <div className="app-user-email">{user.email}</div>

                  <span className="app-user-role">
                    {user.role?.name ?? "USER"}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              className="app-logout-button"
              onClick={handleLogout}
            >
              <span>↪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="app-main">
        {/* Topbar */}
        <header className="app-topbar">
          <div className="app-topbar-left">
            <button
              type="button"
              className="app-menu-button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <div className="app-topbar-title">WorkSphere</div>

              <div className="app-topbar-subtitle">
                Employee Management System
              </div>
            </div>
          </div>

          {user && (
            <div className="app-topbar-user">
              <div className="app-topbar-user-text">
                <div className="app-topbar-user-name">
                  {user.firstName} {user.lastName}
                </div>

                <div className="app-topbar-user-role">
                  {user.role?.name ?? "USER"}
                </div>
              </div>

              <div className="app-topbar-avatar">{initials}</div>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="app-content">
          <div className="app-content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
