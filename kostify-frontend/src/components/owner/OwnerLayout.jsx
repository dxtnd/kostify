import { useEffect, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import "./OwnerLayout.css";

function OwnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // USER
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // KOSTS
  const [kosts, setKosts] = useState([]);
  const [activeKostId, setActiveKostId] = useState(
    localStorage.getItem("active_kost_id") || ""
  );
  const [loadingKosts, setLoadingKosts] = useState(true);

  const isActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("remember_me");
    localStorage.removeItem("active_kost_id");
    localStorage.removeItem("active_kost");
    navigate("/");
  };

  const fetchKosts = async () => {
    try {
      setLoadingKosts(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:8000/api/owner/overview", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengambil data kost.");

      const ownerKosts = result.kosts || [];
      setKosts(ownerKosts);

      const savedKostId = localStorage.getItem("active_kost_id");
      const savedKostExists = ownerKosts.some((k) => String(k.id) === String(savedKostId));

      if (savedKostExists) {
        setActiveKostId(String(savedKostId));
        return;
      }

      if (ownerKosts.length > 0) {
        const firstKost = ownerKosts[0];
        setActiveKostId(String(firstKost.id));
        localStorage.setItem("active_kost_id", String(firstKost.id));
        localStorage.setItem("active_kost", JSON.stringify(firstKost));
      } else {
        setActiveKostId("");
        localStorage.removeItem("active_kost_id");
        localStorage.removeItem("active_kost");
      }
    } catch (error) {
      console.error("Gagal mengambil data kost:", error);
    } finally {
      setLoadingKosts(false);
    }
  };

  useEffect(() => {
    fetchKosts();
  }, []);

  const activeKost = kosts.find((k) => String(k.id) === String(activeKostId));

  return (
    <div className="owner-layout">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className="owner-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Modern Sidebar */}
      <aside className={`owner-sidebar ${sidebarOpen ? "owner-sidebar-open" : ""}`}>
        <div className="owner-sidebar-top">
          {/* Brand Logo */}
          <div className="owner-logo">
            <div className="owner-logo-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div className="owner-logo-text">
              <strong>Kostify</strong>
              <span>Portal Pemilik</span>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="owner-profile-card">
            <div className="owner-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : "P"}
            </div>
            <div className="owner-meta">
              <strong>{user.name || "Pemilik Kos"}</strong>
              <span>{user.email || "owner@kostify.com"}</span>
            </div>
            <span className="owner-status-indicator" title="Akun Aktif"></span>
          </div>

          {/* Kost Properti Selector */}
          <div className="owner-property-box">
            <div className="property-header">
              <span className="property-tag">PROPERTI AKTIF</span>
            </div>
            <div className="property-select-wrapper">
              <span className="property-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                  <path d="M9 22v-4h6v4"/>
                  <path d="M8 6h.01"/><path d="M16 6h.01"/>
                  <path d="M12 6h.01"/><path d="M12 10h.01"/>
                </svg>
              </span>
              <select
                value={activeKostId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveKostId(val);
                  localStorage.setItem("active_kost_id", val);
                  const selected = kosts.find((k) => String(k.id) === String(val));
                  if (selected) localStorage.setItem("active_kost", JSON.stringify(selected));
                  window.dispatchEvent(new Event("active-kost-changed"));
                }}
                disabled={loadingKosts || kosts.length === 0}
              >
                {kosts.length === 0 ? (
                  <option value="">Belum ada kost</option>
                ) : (
                  kosts.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            {activeKost?.city && (
              <span className="property-location">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {activeKost.city}
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="owner-nav-list">
            <div className="nav-group-label">OVERVIEW</div>
            
            <button
              className={`nav-item-btn ${isActive("/owner/dashboard") ? "active" : ""}`}
              onClick={() => handleNavigate("/owner/dashboard")}
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
              className={`nav-item-btn ${isActive("/owner/rooms") ? "active" : ""}`}
              onClick={() => handleNavigate("/owner/rooms")}
            >
              <span className="nav-item-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
                </svg>
              </span>
              <span>Kamar Kos</span>
            </button>

            <button
              className={`nav-item-btn ${isActive("/owner/tenants") ? "active" : ""}`}
              onClick={() => handleNavigate("/owner/tenants")}
            >
              <span className="nav-item-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </span>
              <span>Penghuni</span>
            </button>

            <button
              className={`nav-item-btn ${isActive("/owner/bills") ? "active" : ""}`}
              onClick={() => handleNavigate("/owner/bills")}
            >
              <span className="nav-item-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
                </svg>
              </span>
              <span>Pembayaran</span>
            </button>

            <button
              className={`nav-item-btn ${isActive("/owner/billing") ? "active" : ""}`}
              onClick={() => handleNavigate("/owner/billing")}
            >
              <span className="nav-item-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/>
                  <line x1="16" x2="8" y1="17" y2="17"/>
                </svg>
              </span>
              <span>Penagihan</span>
            </button>

            <button
              className={`nav-item-btn ${isActive("/owner/complaints") ? "active" : ""}`}
              onClick={() => handleNavigate("/owner/complaints")}
            >
              <span className="nav-item-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </span>
              <span>Komplain</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="owner-sidebar-footer">
          <div className="system-pill">
            <span className="system-live-dot"></span>
            <div>
              <strong>Cloud Sync Aktif</strong>
              <small>Layanan normal</small>
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

      {/* Main Content Area */}
      <main className="owner-main-viewport">
        {/* Mobile Header Bar */}
        <header className="mobile-header-bar">
          <button className="mobile-toggle-btn" onClick={() => setSidebarOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="mobile-title">Kostify</div>
          <div className="mobile-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : "P"}
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

export default OwnerLayout;
