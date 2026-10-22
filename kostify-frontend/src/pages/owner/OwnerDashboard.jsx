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

      // Ambil kost aktif terbaru
      const savedKostId =
        localStorage.getItem("active_kost_id");

      setActiveKostId(savedKostId || "");
    } catch (err) {
      console.error("Owner overview error:", err);

      setError(
        err.response?.data?.message ||
          "Gagal mengambil data dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();

    const handleActiveKostChanged = () => {
      const kostId =
        localStorage.getItem("active_kost_id") || "";

      setActiveKostId(kostId);
    };

    window.addEventListener(
      "active-kost-changed",
      handleActiveKostChanged
    );

    return () => {
      window.removeEventListener(
        "active-kost-changed",
        handleActiveKostChanged
      );
    };
  }, []);

  if (loading) {
    return (
      <div className="owner-dashboard">
        <div className="owner-dashboard-loading">
          <div className="owner-loading-spinner"></div>

          <p>Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-dashboard">
        <div className="owner-dashboard-error">
          <div className="owner-error-icon">
            !
          </div>

          <div>
            <strong>
              Gagal memuat dashboard
            </strong>

            <p>{error}</p>

            <button onClick={fetchOverview}>
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const owner = overview?.owner || {};
  const allKosts = overview?.kosts || [];
  const allRooms = overview?.rooms || [];

  // ==============================
  // KOST AKTIF
  // ==============================

  const activeKost = allKosts.find(
    (kost) =>
      String(kost.id) === String(activeKostId)
  );

  // ==============================
  // FILTER KAMAR SESUAI KOST AKTIF
  // ==============================

  const activeRooms = activeKostId
    ? allRooms.filter(
        (room) =>
          String(room.kost_id) ===
          String(activeKostId)
      )
    : [];

  // ==============================
  // STATISTIK KOST AKTIF
  // ==============================

  const totalRooms = activeRooms.length;

  const occupiedRooms = activeRooms.filter(
    (room) => room.status === "occupied"
  ).length;

  const availableRooms = activeRooms.filter(
    (room) => room.status === "available"
  ).length;

  const maintenanceRooms = activeRooms.filter(
    (room) => room.status === "maintenance"
  ).length;

  return (
    <div className="owner-dashboard">

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="owner-dashboard-header">

        <div>

          <span className="owner-dashboard-eyebrow">
            DASHBOARD PEMILIK KOS
          </span>

          <h1>
            Selamat datang,{" "}
            {owner.name || "Pemilik Kos"} 👋
          </h1>

          <p>
            Pantau kondisi kost Anda melalui
            dashboard Kostify.
          </p>

        </div>

        <button
          className="owner-refresh-button"
          onClick={fetchOverview}
        >
          ↻ Perbarui Data
        </button>

      </div>


      {/* =========================================
          KOST AKTIF
      ========================================= */}

      <div className="owner-kost-card">

        <div className="owner-kost-icon">
          ▦
        </div>

        <div className="owner-kost-info">

          <span>
            KOST AKTIF
          </span>

          <strong>
            {activeKost
              ? activeKost.name
              : "Belum ada kost aktif"}

          </strong>

        </div>

        <div className="owner-kost-count">

          <strong>
            {activeKost
              ? activeKost.rooms_count || totalRooms
              : 0}
          </strong>

          <span>
            Kamar
          </span>

        </div>

      </div>


      {/* =========================================
          RINGKASAN KAMAR
      ========================================= */}

      <div className="owner-section-heading">

        <div>

          <h2>
            Ringkasan Kamar
          </h2>

          <p>
            Kondisi kamar dari kost yang sedang
            Anda kelola.
          </p>

        </div>

      </div>


      <div className="owner-stat-grid">

        {/* TOTAL KAMAR */}

        <div className="owner-stat-card">

          <div className="owner-stat-icon rooms">
            ▦
          </div>

          <span className="owner-stat-label">
            TOTAL KAMAR
          </span>

          <strong>
            {totalRooms}
          </strong>

          <small>
            Kamar di kost aktif
          </small>

        </div>


        {/* KAMAR TERISI */}

        <div className="owner-stat-card">

          <div className="owner-stat-icon occupied">
            ●
          </div>

          <span className="owner-stat-label">
            KAMAR TERISI
          </span>

          <strong>
            {occupiedRooms}
          </strong>

          <small>
            Sedang ditempati
          </small>

        </div>


        {/* KAMAR TERSEDIA */}

        <div className="owner-stat-card">

          <div className="owner-stat-icon available">
            ✓
          </div>

          <span className="owner-stat-label">
            KAMAR TERSEDIA
          </span>

          <strong>
            {availableRooms}
          </strong>

          <small>
            Siap ditempati
          </small>

        </div>


        {/* MAINTENANCE */}

        <div className="owner-stat-card">

          <div className="owner-stat-icon maintenance">
            !
          </div>

          <span className="owner-stat-label">
            PERBAIKAN
          </span>

          <strong>
            {maintenanceRooms}
          </strong>

          <small>
            Dalam perbaikan
          </small>

        </div>

      </div>


      {/* =========================================
          DAFTAR SEMUA KOST
      ========================================= */}

      <div className="owner-section-heading owner-kost-heading">

        <div>

          <h2>
            Data Kost
          </h2>

          <p>
            Seluruh kost yang terdaftar pada
            akun Anda.
          </p>

        </div>

        <span className="owner-section-count">
          {allKosts.length} Kost
        </span>

      </div>


      <div className="owner-kost-list">

        {allKosts.length === 0 ? (

          <div className="owner-empty">

            <div className="owner-empty-icon">
              ▦
            </div>

            <strong>
              Belum ada Kost
            </strong>

            <p>
              Data kost yang Anda kelola akan
              muncul di sini.
            </p>

          </div>

        ) : (

          allKosts.map((kost) => (

            <div
              className={`owner-kost-list-card ${
                String(kost.id) ===
                String(activeKostId)
                  ? "active"
                  : ""
              }`}
              key={kost.id}
            >

              <div className="owner-kost-list-icon">
                ▦
              </div>

              <div className="owner-kost-list-info">

                <strong>
                  {kost.name}
                </strong>

                <span>
                  {kost.address ||
                    "Alamat belum tersedia"}
                </span>

                <small>
                  {kost.city || "-"}
                </small>

              </div>

              <div className="owner-kost-room-count">

                <strong>
                  {kost.rooms_count || 0}
                </strong>

                <span>
                  Kamar
                </span>

              </div>

            </div>

          ))

        )}

      </div>


      {/* =========================================
          KONDISI KAMAR KOST AKTIF
      ========================================= */}

      <div className="owner-section-heading owner-room-heading">

        <div>

          <h2>
            Kondisi Kamar
          </h2>

          <p>
            Status kamar pada{" "}
            {activeKost
              ? activeKost.name
              : "kost aktif"}.
          </p>

        </div>

        <span className="owner-section-count">
          {activeRooms.length} Kamar
        </span>

      </div>


      <div className="owner-room-table-card">

        {activeRooms.length === 0 ? (

          <div className="owner-empty">

            <div className="owner-empty-icon">
              ▦
            </div>

            <strong>
              Belum ada kamar
            </strong>

            <p>
              Tambahkan kamar melalui menu
              Kelola Kamar.
            </p>

          </div>

        ) : (

          <div className="owner-room-table-wrapper">

            <table className="owner-room-table">

              <thead>

                <tr>
                  <th>No</th>
                  <th>Kamar</th>
                  <th>Kost</th>
                  <th>Harga</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                {activeRooms.map(
                  (room, index) => (

                    <tr key={room.id}>

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        <strong>
                          {room.room_number}
                        </strong>
                      </td>

                      <td>
                        {room.kost?.name ||
                          activeKost?.name ||
                          "-"}
                      </td>

                      <td>
                        Rp{" "}
                        {Number(
                          room.price || 0
                        ).toLocaleString(
                          "id-ID"
                        )}
                      </td>

                      <td>

                        <span
                          className={`owner-room-status ${room.status}`}
                        >

                          <span></span>

                          {room.status ===
                          "occupied"
                            ? "Terisi"
                            : room.status ===
                              "available"
                            ? "Tersedia"
                            : room.status ===
                              "maintenance"
                            ? "Perbaikan"
                            : room.status}

                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default OwnerDashboard;