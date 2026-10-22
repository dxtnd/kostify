import { useEffect, useState } from "react";
import api from "../../services/api";
import "./OwnerDashboard.css";

function OwnerDashboard() {
  const [overview, setOverview] = useState(null);
  const [activeKostId, setActiveKostId] = useState(
    localStorage.getItem("active_kost_id") || ""
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/owner/overview");
      setOverview(response.data);

      const savedKostId = localStorage.getItem("active_kost_id");
      setActiveKostId(savedKostId || "");
    } catch (err) {
      console.error("Owner overview error:", err);
      setError(
        err.response?.data?.message || "Gagal mengambil data dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();

    const handleActiveKostChanged = () => {
      const kostId = localStorage.getItem("active_kost_id") || "";
      setActiveKostId(kostId);
    };

    window.addEventListener("active-kost-changed", handleActiveKostChanged);
    return () => {
      window.removeEventListener("active-kost-changed", handleActiveKostChanged);
    };
  }, []);

  if (loading) {
    return (
      <div className="owner-dashboard-state">
        <div className="dashboard-loading-box">
          <div className="saas-spinner"></div>
          <p>Memuat ringkasan dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-dashboard-state">
        <div className="dashboard-error-box">
          <div className="error-icon-bubble">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <strong>Gagal Memuat Dashboard</strong>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchOverview}>Coba Lagi</button>
          </div>
        </div>
      </div>
    );
  }

  const owner = overview?.owner || {};
  const allKosts = overview?.kosts || [];
  const allRooms = overview?.rooms || [];

  const activeKost = allKosts.find(
    (kost) => String(kost.id) === String(activeKostId)
  );

  const activeRooms = activeKostId
    ? allRooms.filter((room) => String(room.kost_id) === String(activeKostId))
    : [];

  const totalRooms = activeRooms.length;
  const occupiedRooms = activeRooms.filter((room) => room.status === "occupied").length;
  const availableRooms = activeRooms.filter((room) => room.status === "available").length;
  const maintenanceRooms = activeRooms.filter((room) => room.status === "maintenance").length;

  return (
    <div className="owner-dashboard-container">
      {/* Top Welcome Header */}
      <div className="dashboard-header-row">
        <div>
          <div className="dashboard-eyebrow">
            <span className="eyebrow-dot"></span>
            PORTAL MANAJEMEN PEMILIK
          </div>
          <h1>Selamat Datang, {owner.name || "Pemilik Kos"}</h1>
          <p>Kelola properti kost, pantau ketersediaan kamar, dan monitor penghuni secara real-time.</p>
        </div>

        <button className="btn-refresh" onClick={fetchOverview} title="Perbarui Data">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          <span>Sinkronisasi Data</span>
        </button>
      </div>

      {/* Active Kost Highlight Banner */}
      <div className="active-kost-banner">
        <div className="banner-left">
          <div className="banner-icon-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="banner-details">
            <span className="banner-label">PROPERTI AKTIF SAAT INI</span>
            <h2>{activeKost ? activeKost.name : "Belum Ada Kost yang Dipilih"}</h2>
            <p className="banner-address">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {activeKost?.address ? `${activeKost.address}, ${activeKost.city}` : "Pilih properti pada sidebar"}
            </p>
          </div>
        </div>

        <div className="banner-stat-pill">
          <strong>{activeKost ? activeKost.rooms_count || totalRooms : 0}</strong>
          <span>Kamar Total</span>
        </div>
      </div>

      {/* Stat Metric Cards Grid */}
      <div className="metric-cards-grid">
        {/* TOTAL KAMAR */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-title">TOTAL KAMAR</span>
            <div className="metric-icon-wrap icon-slate">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                <path d="M9 22v-4h6v4"/>
              </svg>
            </div>
          </div>
          <div className="metric-value">{totalRooms}</div>
          <div className="metric-foot">Semua unit di {activeKost?.name || "properti"}</div>
        </div>

        {/* KAMAR TERISI */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-title">KAMAR TERISI</span>
            <div className="metric-icon-wrap icon-blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
          </div>
          <div className="metric-value">{occupiedRooms}</div>
          <div className="metric-foot">Unit sedang dihuni</div>
        </div>

        {/* KAMAR TERSEDIA */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-title">KAMAR TERSEDIA</span>
            <div className="metric-icon-wrap icon-emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
          <div className="metric-value text-emerald">{availableRooms}</div>
          <div className="metric-foot">Siap untuk disewakan</div>
        </div>

        {/* DALAM PERBAIKAN */}
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-title">MAINTENANCE</span>
            <div className="metric-icon-wrap icon-amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
          </div>
          <div className="metric-value text-amber">{maintenanceRooms}</div>
          <div className="metric-foot">Unit dalam perbaikan</div>
        </div>
      </div>

      {/* Daftar Semua Properti Kost Section */}
      <div className="dashboard-section-block">
        <div className="section-title-bar">
          <div>
            <h3>Daftar Properti Kost</h3>
            <p>Seluruh properti yang terdaftar di bawah pengelolaan akun Anda.</p>
          </div>
          <span className="badge-count">{allKosts.length} Properti</span>
        </div>

        {allKosts.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                <path d="M9 22v-4h6v4"/>
              </svg>
            </div>
            <h4>Belum Ada Properti Kost</h4>
            <p>Properti kost yang Anda kelola akan ditampilkan di sini.</p>
          </div>
        ) : (
          <div className="kost-cards-grid">
            {allKosts.map((kost) => (
              <div
                key={kost.id}
                className={`kost-item-card ${String(kost.id) === String(activeKostId) ? "selected" : ""}`}
                onClick={() => {
                  setActiveKostId(String(kost.id));
                  localStorage.setItem("active_kost_id", String(kost.id));
                  localStorage.setItem("active_kost", JSON.stringify(kost));
                  window.dispatchEvent(new Event("active-kost-changed"));
                }}
              >
                <div className="kost-card-head">
                  <div className="kost-badge-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    </svg>
                  </div>
                  {String(kost.id) === String(activeKostId) && (
                    <span className="active-tag">Sedang Dipilih</span>
                  )}
                </div>
                <h4>{kost.name}</h4>
                <p className="kost-card-address">{kost.address || "Alamat belum diatur"}</p>
                <div className="kost-card-foot">
                  <span className="city-pill">{kost.city || "-"}</span>
                  <span className="room-count-pill">{kost.rooms_count || 0} Kamar</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kondisi Kamar Properti Aktif (Table Section) */}
      <div className="dashboard-section-block">
        <div className="section-title-bar">
          <div>
            <h3>Status Kamar pada {activeKost?.name || "Kost Aktif"}</h3>
            <p>Daftar kamar, harga sewa per bulan, dan status ketersediaan.</p>
          </div>
          <span className="badge-count">{activeRooms.length} Kamar</span>
        </div>

        <div className="saas-table-card">
          {activeRooms.length === 0 ? (
            <div className="empty-state-box">
              <div className="empty-icon-wrap">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/>
                </svg>
              </div>
              <h4>Belum Ada Kamar di Properti Ini</h4>
              <p>Tambahkan unit kamar baru melalui menu Kamar Kos di sidebar.</p>
            </div>
          ) : (
            <div className="table-responsive-wrapper">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th style={{ width: "60px" }}>No</th>
                    <th>Nomor Kamar</th>
                    <th>Nama Kost</th>
                    <th>Harga Sewa</th>
                    <th>Status Kamar</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRooms.map((room, index) => (
                    <tr key={room.id}>
                      <td className="text-muted">{index + 1}</td>
                      <td>
                        <strong className="room-number-pill">{room.room_number}</strong>
                      </td>
                      <td className="text-secondary">{room.kost?.name || activeKost?.name || "-"}</td>
                      <td className="price-col">
                        Rp {Number(room.price || 0).toLocaleString("id-ID")}
                        <span className="per-month">/bln</span>
                      </td>
                      <td>
                        <span className={`status-badge badge-${room.status}`}>
                          <span className="status-dot"></span>
                          {room.status === "occupied"
                            ? "Terisi"
                            : room.status === "available"
                            ? "Tersedia"
                            : room.status === "maintenance"
                            ? "Perbaikan"
                            : room.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;
