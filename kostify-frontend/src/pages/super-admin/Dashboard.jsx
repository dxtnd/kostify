import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

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

      const response = await api.get(
        "/super-admin/overview",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setData(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("remember_me");

        navigate("/");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Gagal mengambil data dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* TOPBAR */}
      <header className="dashboard-topbar">

        <div className="dashboard-heading">
          <p className="breadcrumb">
            Kostify / Dasbor
          </p>

          <h1>Dasbor</h1>
        </div>

        <div className="topbar-actions">

          <div className="system-badge">
            <span></span>
            Sistem aktif
          </div>

          <div className="topbar-avatar">
            {user.name
              ? user.name.charAt(0).toUpperCase()
              : "S"}
          </div>

        </div>

      </header>

      {/* CONTENT */}
      <main className="dashboard-content">

        {/* WELCOME */}
        <section className="welcome-section">

          <div className="welcome-text">

            <span className="section-eyebrow">
              SISTEM RINGKASAN
            </span>

            <h2>
              Selamat datang,{" "}
              {user.name || "Admin Super"} 👋
            </h2>

            <p>
              Pantau aktivitas dan data Kostify dari satu tempat.
            </p>

          </div>

          <button
            className="refresh-button"
            onClick={fetchDashboard}
          >
            ↻ &nbsp; Perbarui Data
          </button>

        </section>

        {/* ERROR */}
        {error && (
          <div className="dashboard-error">
            <span>!</span>
            {error}
          </div>
        )}

        {/* STATISTICS */}
        <section className="stats-grid">

          {/* PEMILIK KOS */}
          <div className="stat-card">

            <div className="stat-top">

              <div className="stat-icon owner-icon">
                ♙
              </div>

              <span className="stat-label">
                TERDAFTAR
              </span>

            </div>

            <div className="stat-value">
              {data?.statistics?.total_owners ?? 0}
            </div>

            <div className="stat-name">
              Pemilik Kos
            </div>

            <div className="stat-footer">

              <span className="stat-positive">
                ● Aktif
              </span>

              <span>
                akun terdaftar
              </span>

            </div>

          </div>

          {/* DATA KOST */}
          <div className="stat-card">

            <div className="stat-top">

              <div className="stat-icon kost-icon">
                ▦
              </div>

              <span className="stat-label">
                TERDAFTAR
              </span>

            </div>

            <div className="stat-value">
              {data?.statistics?.total_kosts ?? 0}
            </div>

            <div className="stat-name">
              Data Kost
            </div>

            <div className="stat-footer">

              <span className="stat-positive">
                ● Terdaftar
              </span>

              <span>
                kost di sistem
              </span>

            </div>

          </div>

          {/* TOTAL KAMAR */}
          <div className="stat-card">

            <div className="stat-top">

              <div className="stat-icon room-icon">
                □
              </div>

              <span className="stat-label">
                KESELURUHAN
              </span>

            </div>

            <div className="stat-value">
              {data?.statistics?.total_rooms ?? 0}
            </div>

            <div className="stat-name">
              Total Kamar
            </div>

            <div className="stat-footer">

              <span>
                Data global
              </span>

            </div>

          </div>

        </section>

        {/* BOTTOM GRID */}
        <section className="dashboard-grid">

          {/* PEMILIK KOS TERBARU */}
          <div className="content-card">

            <div className="card-heading">

              <div>
                <span className="card-eyebrow">
                  PEMILIK KOS
                </span>

                <h3>
                  Pemilik Kos Terbaru
                </h3>
              </div>

              <button
                className="view-all"
                onClick={() =>
                  navigate("/super-admin/owners")
                }
              >
                Lihat semua →
              </button>

            </div>

            <div className="owner-list">

              {data?.recent_owners?.length > 0 ? (

                data.recent_owners.map((owner) => (

                  <div
                    className="owner-row"
                    key={owner.id}
                  >

                    <div className="owner-avatar">
                      {owner.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="owner-detail">

                      <strong>
                        {owner.name}
                      </strong>

                      <span>
                        {owner.email}
                      </span>

                    </div>

                    <div className="owner-status">

                      <span></span>

                      {owner.status === "active"
                        ? "Aktif"
                        : "Nonaktif"}

                    </div>

                  </div>

                ))

              ) : (

                <div className="empty-state">
                  Belum ada data Pemilik Kos.
                </div>

              )}

            </div>

          </div>

          {/* SYSTEM STATUS */}
          <div className="content-card system-card">

            <div className="card-heading">

              <div>
                <span className="card-eyebrow">
                  STATUS PLATFORM
                </span>

                <h3>
                  Kondisi Sistem
                </h3>
              </div>

              <div className="healthy-icon">
                ✓
              </div>

            </div>

            <div className="health-box">

              <div className="health-status">

                <span className="health-dot"></span>

                <div>

                  <strong>
                    Semua sistem berjalan
                  </strong>

                  <span>
                    Kostify beroperasi dengan normal
                  </span>

                </div>

              </div>

              <div className="health-line"></div>

              <div className="health-item">
                <span>API Laravel</span>
                <strong>Normal</strong>
              </div>

              <div className="health-item">
                <span>Database</span>
                <strong>Normal</strong>
              </div>

              <div className="health-item">
                <span>Autentikasi</span>
                <strong>Normal</strong>
              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;