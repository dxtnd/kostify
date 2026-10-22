import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  Outlet,
} from "react-router-dom";
import "./OwnerLayout.css";

function OwnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =========================
  // USER
  // =========================

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  // =========================
  // KOST
  // =========================

  const [kosts, setKosts] = useState([]);
  const [activeKostId, setActiveKostId] = useState(
    localStorage.getItem("active_kost_id") || ""
  );

  const [loadingKosts, setLoadingKosts] = useState(true);

  // =========================
  // ACTIVE MENU
  // =========================

  const isActive = (path) => {
    return location.pathname === path;
  };

  // =========================
  // NAVIGATION
  // =========================

  const handleNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("remember_me");

    // Hapus kost aktif saat logout
    localStorage.removeItem("active_kost_id");
    localStorage.removeItem("active_kost");

    navigate("/");
  };

  // =========================
  // GET DATA KOST
  // =========================

  const fetchKosts = async () => {
    try {
      setLoadingKosts(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://127.0.0.1:8000/api/owner/overview",
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil data kost."
        );
      }

      const ownerKosts = result.kosts || [];

      setKosts(ownerKosts);

      // =========================
      // TENTUKAN KOST AKTIF
      // =========================

      const savedKostId =
        localStorage.getItem("active_kost_id");

      const savedKostExists = ownerKosts.some(
        (kost) =>
          String(kost.id) === String(savedKostId)
      );

      if (savedKostExists) {
        // Kost yang sebelumnya dipilih masih ada
        setActiveKostId(String(savedKostId));
        return;
      }

      // Kalau kost aktif sebelumnya tidak ada,
      // gunakan kost pertama
      if (ownerKosts.length > 0) {
        const firstKost = ownerKosts[0];

        setActiveKostId(String(firstKost.id));

        localStorage.setItem(
          "active_kost_id",
          String(firstKost.id)
        );

        localStorage.setItem(
          "active_kost",
          JSON.stringify(firstKost)
        );
      } else {
        setActiveKostId("");

        localStorage.removeItem(
          "active_kost_id"
        );

        localStorage.removeItem(
          "active_kost"
        );
      }
    } catch (error) {
      console.error(
        "Gagal mengambil data kost:",
        error
      );
    } finally {
      setLoadingKosts(false);
    }
  };

  // =========================
  // LOAD KOST SAAT LAYOUT
  // =========================

  useEffect(() => {
    fetchKosts();
  }, []);

  // =========================
  // GANTI KOST AKTIF
  // =========================

  const handleKostChange = (e) => {
    const kostId = e.target.value;

    setActiveKostId(kostId);

    const selectedKost = kosts.find(
      (kost) =>
        String(kost.id) === String(kostId)
    );

    if (selectedKost) {
      localStorage.setItem(
        "active_kost_id",
        String(selectedKost.id)
      );

      localStorage.setItem(
        "active_kost",
        JSON.stringify(selectedKost)
      );
    }

    // Beritahu halaman lain bahwa kost aktif berubah
    window.dispatchEvent(
      new Event("active-kost-changed")
    );
  };

  // =========================
  // DATA KOST AKTIF
  // =========================

  const activeKost = kosts.find(
    (kost) =>
      String(kost.id) === String(activeKostId)
  );

  return (
    <div className="owner-layout">

      {/* =========================
          OVERLAY MOBILE
      ========================= */}

      {sidebarOpen && (
        <div
          className="owner-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside
        className={`owner-sidebar ${
          sidebarOpen
            ? "owner-sidebar-open"
            : ""
        }`}
      >

        <div className="owner-sidebar-top">

          {/* LOGO */}

          <div className="owner-logo">

            <div className="owner-logo-mark">
              K
            </div>

            <div className="owner-logo-text">
              <strong>Kostify</strong>

              <span>
                Management System
              </span>
            </div>

          </div>

          {/* PROFILE */}

          <div className="owner-profile">

            <div className="owner-profile-avatar">
              {user.name
                ? user.name
                    .charAt(0)
                    .toUpperCase()
                : "P"}
            </div>

            <div className="owner-profile-info">

              <strong>
                {user.name || "Pemilik Kos"}
              </strong>

              <span>
                Pemilik Kost
              </span>

            </div>

            <span className="owner-online-dot"></span>

          </div>

          {/* =========================
              KOST AKTIF
          ========================= */}

        <div className="owner-kost-selector">
          <label>KOST AKTIF</label>

          <div className="owner-kost-select-wrapper">
            <div className="owner-kost-icon">▦</div>

            <select
              value={activeKostId || ""}
              onChange={(e) => {
                const value = e.target.value;

                setActiveKostId(value);
                localStorage.setItem("active_kost_id", value);

                const selected = kosts.find(
                  (kost) => String(kost.id) === String(value)
                );

                if (selected) {
                  localStorage.setItem(
                    "active_kost",
                    JSON.stringify(selected)
                  );
                }

                window.dispatchEvent(
                  new Event("active-kost-changed")
                );
              }}
              disabled={loadingKosts || kosts.length === 0}
            >
              {kosts.length === 0 ? (
                <option value="">Belum ada kost</option>
              ) : (
                kosts.map((kost) => (
                  <option key={kost.id} value={kost.id}>
                    {kost.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {activeKost?.city && (
            <span className="owner-kost-address">
              {activeKost.city}
            </span>
          )}
        </div>

          {/* =========================
              NAVIGATION
          ========================= */}

          <nav className="owner-navigation">

            <p className="owner-nav-label">
              UTAMA
            </p>

            <button
              className={`owner-nav-item ${
                isActive(
                  "/owner/dashboard"
                )
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate(
                  "/owner/dashboard"
                )
              }
            >
              <span className="owner-nav-icon">
                ⌂
              </span>

              <span>
                Dashboard
              </span>
            </button>

            <p className="owner-nav-label owner-nav-space">
              MANAJEMEN
            </p>

            {/* KAMAR */}

            <button
              className={`owner-nav-item ${
                isActive(
                  "/owner/rooms"
                )
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate(
                  "/owner/rooms"
                )
              }
            >
              <span className="owner-nav-icon">
                ▦
              </span>

              <span>
                Kamar
              </span>
            </button>

            {/* PENGHUNI */}

            <button
              className={`owner-nav-item ${
                isActive(
                  "/owner/tenants"
                )
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate(
                  "/owner/tenants"
                )
              }
            >
              <span className="owner-nav-icon">
                ♙
              </span>

              <span>
                Penghuni
              </span>
            </button>

            {/* PEMBAYARAN */}

            <button
              className={`owner-nav-item ${
                isActive(
                  "/owner/bills"
                )
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate(
                  "/owner/bills"
                )
              }
            >
              <span className="owner-nav-icon">
                Rp
              </span>

              <span>
                Pembayaran
              </span>
            </button>

            {/* PENAGIHAN */}

            <button
              className={`owner-nav-item ${
                isActive(
                  "/owner/billing"
                )
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate(
                  "/owner/billing"
                )
              }
            >
              <span className="owner-nav-icon">
                ▤
              </span>

              <span>
                Penagihan
              </span>
            </button>

            {/* KOMPLAIN */}

            <button
              className={`owner-nav-item ${
                isActive(
                  "/owner/complaints"
                )
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleNavigate(
                  "/owner/complaints"
                )
              }
            >
              <span className="owner-nav-icon">
                !
              </span>

              <span>
                Komplain
              </span>
            </button>

          </nav>

        </div>

        {/* =========================
            SIDEBAR BOTTOM
        ========================= */}

        <div className="owner-sidebar-bottom">

          <div className="owner-system-status">

            <span className="owner-system-dot"></span>

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
            className="owner-logout"
            onClick={handleLogout}
          >
            <span>
              ↪
            </span>

            Keluar
          </button>

        </div>

      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="owner-main">

        {/* MOBILE HEADER */}

        <header className="owner-mobile-header">

          <button
            className="owner-menu-button"
            onClick={() =>
              setSidebarOpen(true)
            }
          >
            ☰
          </button>

          <div className="owner-mobile-brand">

            <div className="owner-mobile-logo">
              K
            </div>

            <strong>
              Kostify
            </strong>

          </div>

          <div className="owner-mobile-avatar">

            {user.name
              ? user.name
                  .charAt(0)
                  .toUpperCase()
              : "P"}

          </div>

        </header>

        {/* PAGE CONTENT */}

        <Outlet />

      </main>

    </div>
  );
}

export default OwnerLayout;