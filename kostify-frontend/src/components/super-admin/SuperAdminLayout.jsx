import { useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import "./SuperAdminLayout.css";

function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isActive = (path) => {
    return location.pathname === path;
  };

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
      <aside
        className={`sa-sidebar ${
          sidebarOpen ? "sa-sidebar-open" : ""
        }`}
      >

        {/* LOGO */}
        <div className="sa-sidebar-top">

          <div className="sa-logo">

            <div className="sa-logo-mark">
              K
            </div>

            <div className="sa-logo-text">
              <strong>Kostify</strong>
              <span>Management System</span>
            </div>

          </div>

          {/* PROFILE */}
          <div className="sa-profile">

            <div className="sa-profile-avatar">
              {user.name
                ? user.name.charAt(0).toUpperCase()
                : "S"}
            </div>

            <div className="sa-profile-info">
              <strong>
                {user.name || "Super Admin"}
              </strong>

              <span>
                Super Administrator
              </span>
            </div>

            <span className="sa-online-dot"></span>

          </div>

          {/* NAVIGATION */}
          <nav className="sa-navigation">

            <p className="sa-nav-label">
              UTAMA
            </p>

            <button
              className={`sa-nav-item ${
                isActive("/super-admin/dashboard")
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate("/super-admin/dashboard")
              }
            >
              <span className="sa-nav-icon">
                ⌂
              </span>

              <span>
                Dashboard
              </span>
            </button>

            <p className="sa-nav-label sa-nav-space">
              MANAJEMEN
            </p>

            <button
              className={`sa-nav-item ${
                isActive("/super-admin/owners")
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate("/super-admin/owners")
              }
            >
              <span className="sa-nav-icon">
                ♙
              </span>

              <span>
                Pemilik Kos
              </span>
            </button>

            <button
              className={`sa-nav-item ${
                isActive("/super-admin/kosts")
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate("/super-admin/kosts")
              }
            >
              <span className="sa-nav-icon">
                ▦
              </span>

              <span>
                Data Kost
              </span>
            </button>

            <p className="sa-nav-label sa-nav-space">
              SISTEM
            </p>

            <button
              className={`sa-nav-item ${
                isActive("/super-admin/monitoring")
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate(
                  "/super-admin/monitoring"
                )
              }
            >
              <span className="sa-nav-icon">
                ◉
              </span>

              <span>
                Monitoring
              </span>
            </button>

          </nav>

        </div>

        {/* SIDEBAR BOTTOM */}
        <div className="sa-sidebar-bottom">

          <div className="sa-system-status">

            <span className="sa-system-dot"></span>

            <div>
              <strong>
                Sistem Aktif
              </strong>

              <small>
                Semua layanan berjalan
              </small>
            </div>

          </div>

          <button
            className="sa-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Keluar
          </button>

        </div>

      </aside>

      {/* MAIN */}
      <main className="sa-main">

        {/* MOBILE TOPBAR */}
        <header className="sa-mobile-header">

          <button
            className="sa-menu-button"
            onClick={() =>
              setSidebarOpen(true)
            }
          >
            ☰
          </button>

          <div className="sa-mobile-brand">
            <div className="sa-mobile-logo">
              K
            </div>

            <strong>
              Kostify
            </strong>
          </div>

          <div className="sa-mobile-avatar">
            {user.name
              ? user.name.charAt(0).toUpperCase()
              : "S"}
          </div>

        </header>

        <Outlet />

      </main>

    </div>
  );
}

export default SuperAdminLayout;