import { useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import "./SuperAdminLayout.css";

function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("remember_me");
    navigate("/");
  };

  return (
    <div className="sa-layout">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="sa-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sa-sidebar ${sidebarOpen ? "sa-sidebar-open" : ""}`}>
        <div className="sa-sidebar-top">
          {/* LOGO */}
          <div className="sa-logo">
            <div className="sa-logo-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="sa-logo-text">
              <strong>Kostify</strong>
              <span>Super Admin</span>
            </div>
          </div>

          {/* PROFILE CARD */}
          <div className="sa-profile-card">
            <div className="sa-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : "S"}
            </div>
            <div className="sa-meta">
              <strong>{user.name || "Super Admin"}</strong>
              <span>{user.email || "superadmin@kostify.com"}</span>
            </div>
            <span className="sa-status-indicator" title="Akun Aktif"></span>
          </div>

          {/* NAVIGATION */}
          <nav className="sa-nav-list">
            <div className="nav-group-label">OVERVIEW</div>

            <button
              className={`nav-item-btn ${isActive("/super-admin/dashboard") ? "active" : ""}`}
              onClick={() => handleNavigate("/super-admin/dashboard")}
            >
              <span className="nav-item-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/>
                  <rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
                </svg>
              </span>
              <span>Dashboard</span>
            </button>

            <div className="nav-group-label nav-space">MANAJEMEN</div>

            <button
              className={`nav-item-btn ${isActive("/super-admin/owners") ? "active" : ""}`}
              onClick={() => handleNavigate("/super-admin/owners")}
            >
              <span className="nav-item-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </span>
              <span>Pemilik Kos</span>
            </button>

            <button
              className={`nav-item-btn ${isActive("/super-admin/kosts") ? "active" : ""}`}
              onClick={() => handleNavigate("/super-admin/kosts")}
            >
              <span className="nav-item-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                  <path d="M9 22v-4h6v4"/>
                  <path d="M8 6h.01"/><path d="M16 6h.01"/>
                  <path d="M12 6h.01"/><path d="M12 10h.01"/>
                  <path d="M12 14h.01"/><path d="M16 10h.01"/>
                  <path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
                </svg>
              </span>
              <span>Data Kost</span>
            </button>

            <div className="nav-group-label nav-space">SISTEM</div>

            <button
              className={`nav-item-btn ${isActive("/super-admin/monitoring") ? "active" : ""}`}
              onClick={() => handleNavigate("/super-admin/monitoring")}
            >
              <span className="nav-item-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </span>
              <span>Monitoring</span>
            </button>
          </nav>
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="sa-sidebar-footer">
          <div className="system-pill">
            <span className="system-live-dot"></span>
            <div>
              <strong>Super Admin Active</strong>
              <small>Hak akses penuh</small>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
              </svg>
            </span>
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="sa-main-viewport">
        {/* MOBILE HEADER */}
        <header className="sa-mobile-header">
          <button className="sa-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Buka Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="sa-mobile-brand">
            <div className="sa-mobile-logo-mark">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <strong>Kostify</strong>
            <span className="brand-tag">Admin</span>
          </div>

          <div className="sa-mobile-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : "S"}
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

export default SuperAdminLayout;
