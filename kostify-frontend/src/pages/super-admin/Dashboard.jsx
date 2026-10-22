import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/");
        return;
      }

      const response = await api.get("/super-admin/overview", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setData(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("remember_me");
        navigate("/");
        return;
      }

      setError(
        err.response?.data?.message || "Gagal mengambil data dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="sa-dashboard-state">
        <div className="sa-loading-box">
          <div className="sa-spinner"></div>
          <p>Memuat ringkasan platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sa-dashboard-container">
      {/* HEADER ROW */}
      <div className="sa-header-row">
        <div>
          <div className="sa-eyebrow">
            <span className="eyebrow-dot"></span>
            PORTAL SUPER ADMINISTRATOR
          </div>
          <h1>Ringkasan Platform Kostify</h1>
          <p>Pantau seluruh aktivitas ekosistem kost, pemilik terdaftar, dan status infrastruktur.</p>
        </div>

        <button className="btn-sa-refresh" onClick={fetchDashboard} title="Perbarui Data">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          <span>Perbarui Data</span>
        </button>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="sa-error-alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* STATS METRIC GRID */}
      <section className="sa-stats-grid">
        {/* PEMILIK KOS */}
        <div className="sa-stat-card">
          <div className="sa-stat-top">
            <span className="sa-stat-title">PEMILIK KOS</span>
            <div className="sa-stat-icon-wrap icon-emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <div className="sa-stat-value">{data?.statistics?.total_owners ?? 0}</div>
          <div className="sa-stat-foot">
            <span className="foot-badge-emerald">● Terdaftar</span> Akun pemilik kos aktif
          </div>
        </div>

        {/* DATA KOST */}
        <div className="sa-stat-card">
          <div className="sa-stat-top">
            <span className="sa-stat-title">TOTAL PROPERTI KOST</span>
            <div className="sa-stat-icon-wrap icon-emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                <path d="M9 22v-4h6v4"/>
                <path d="M8 6h.01"/><path d="M16 6h.01"/>
                <path d="M12 6h.01"/><path d="M12 10h.01"/>
              </svg>
            </div>
          </div>
          <div className="sa-stat-value">{data?.statistics?.total_kosts ?? 0}</div>
          <div className="sa-stat-foot">
            <span className="foot-badge-emerald">● Aktif</span> Gedung kost di sistem
          </div>
        </div>

        {/* TOTAL KAMAR */}
        <div className="sa-stat-card">
          <div className="sa-stat-top">
            <span className="sa-stat-title">TOTAL SELURUH KAMAR</span>
            <div className="sa-stat-icon-wrap icon-emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
              </svg>
            </div>
          </div>
          <div className="sa-stat-value">{data?.statistics?.total_rooms ?? 0}</div>
          <div className="sa-stat-foot">
            <span className="foot-badge-emerald">● Unit</span> Akumulasi semua kost
          </div>
        </div>
      </section>

      {/* BOTTOM SECTION DUAL COLUMN */}
      <section className="sa-bottom-grid">
        {/* RECENT OWNERS CARD */}
        <div className="sa-content-card">
          <div className="sa-card-heading">
            <div>
              <span className="sa-card-eyebrow">PENDAFTARAN TERBARU</span>
              <h3>Pemilik Kos Baru</h3>
            </div>
            <button
              className="sa-link-all"
              onClick={() => navigate("/super-admin/owners")}
            >
              <span>Lihat semua</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>

          <div className="sa-owner-list">
            {data?.recent_owners?.length > 0 ? (
              data.recent_owners.map((owner) => (
                <div className="sa-owner-row" key={owner.id}>
                  <div className="sa-owner-avatar">
                    {owner.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="sa-owner-detail">
                    <strong>{owner.name}</strong>
                    <span>{owner.email}</span>
                  </div>
                  <div className={`sa-status-pill ${owner.status === "active" ? "active" : "inactive"}`}>
                    <span className="status-dot"></span>
                    {owner.status === "active" ? "Aktif" : "Nonaktif"}
                  </div>
                </div>
              ))
            ) : (
              <div className="sa-empty-state">
                <p>Belum ada data pemilik kos yang terdaftar.</p>
              </div>
            )}
          </div>
        </div>

        {/* SYSTEM STATUS CARD */}
        <div className="sa-content-card">
          <div className="sa-card-heading">
            <div>
              <span className="sa-card-eyebrow">INFRASTRUKTUR</span>
              <h3>Kondisi Sistem</h3>
            </div>
            <div className="sa-healthy-bubble">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>

          <div className="sa-health-box">
            <div className="sa-health-status-banner">
              <span className="pulse-green-dot"></span>
              <div>
                <strong>Semua Layanan Berjalan Normal</strong>
                <p>Sistem Kostify beroperasi tanpa kendala</p>
              </div>
            </div>

            <div className="sa-health-items-list">
              <div className="sa-health-item">
                <span className="item-label">
                  <span className="sub-dot"></span> Backend API (Laravel 12)
                </span>
                <span className="item-badge-ok">Online</span>
              </div>

              <div className="sa-health-item">
                <span className="item-label">
                  <span className="sub-dot"></span> Database MySQL
                </span>
                <span className="item-badge-ok">Terhubung</span>
              </div>

              <div className="sa-health-item">
                <span className="item-label">
                  <span className="sub-dot"></span> Sanctum Auth Token
                </span>
                <span className="item-badge-ok">Aktif</span>
              </div>

              <div className="sa-health-item">
                <span className="item-label">
                  <span className="sub-dot"></span> Push Notification (FCM)
                </span>
                <span className="item-badge-ok">Siap Kirim</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
