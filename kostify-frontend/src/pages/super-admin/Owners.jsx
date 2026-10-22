import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Owners.css";

function Owners() {
  const navigate = useNavigate();

  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Tambah Owner
  const [addOwnerOpen, setAddOwnerOpen] = useState(false);
  const [savingOwner, setSavingOwner] = useState(false);

  const [ownerForm, setOwnerForm] = useState({
    name: "",
    email: "",
    password: "",
    status: "active",
  });

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    fetchOwners();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const fetchOwners = async () => {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        navigate("/");
        return;
      }

      const response = await api.get("/super-admin/owners", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOwners(response.data.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
        return;
      }

      showToast(
        error.response?.data?.message ||
          "Gagal mengambil data Pemilik Kos.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // TAMBAH OWNER
  // =========================

  const handleOwnerFormChange = (e) => {
    const { name, value } = e.target;

    setOwnerForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetOwnerForm = () => {
    setOwnerForm({
      name: "",
      email: "",
      password: "",
      status: "active",
    });
  };

  const closeAddOwnerModal = () => {
    if (savingOwner) return;

    setAddOwnerOpen(false);
    resetOwnerForm();
  };

  const handleAddOwner = async (e) => {
    e.preventDefault();

    try {
      setSavingOwner(true);

      const token = getToken();

      if (!token) {
        navigate("/");
        return;
      }

      const response = await api.post(
        "/super-admin/owners",
        {
          name: ownerForm.name.trim(),
          email: ownerForm.email.trim(),
          password: ownerForm.password,
          status: ownerForm.status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newOwner = response.data.data;

      setOwners((current) => [newOwner, ...current]);

      resetOwnerForm();
      setAddOwnerOpen(false);

      showToast(
        response.data.message ||
          "Pemilik Kos berhasil ditambahkan."
      );
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
        return;
      }

      const validationErrors =
        error.response?.data?.errors;

      if (validationErrors) {
        const firstError =
          Object.values(validationErrors)?.[0]?.[0];

        showToast(
          firstError ||
            "Data Pemilik Kos belum valid.",
          "error"
        );
      } else {
        showToast(
          error.response?.data?.message ||
            "Gagal menambahkan Pemilik Kos.",
          "error"
        );
      }
    } finally {
      setSavingOwner(false);
    }
  };

  // =========================
  // STATUS OWNER
  // =========================

  const handleStatus = async (owner) => {
    try {
      setProcessingId(owner.id);

      const newStatus =
        owner.status === "active"
          ? "inactive"
          : "active";

      const token = getToken();

      await api.put(
        `/super-admin/owners/${owner.id}/status`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOwners((current) =>
        current.map((item) =>
          item.id === owner.id
            ? {
                ...item,
                status: newStatus,
              }
            : item
        )
      );

      showToast(
        newStatus === "active"
          ? "Akun Pemilik Kos berhasil diaktifkan."
          : "Akun Pemilik Kos berhasil dinonaktifkan."
      );
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          "Gagal mengubah status akun.",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =========================
  // HAPUS OWNER
  // =========================

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setProcessingId(deleteTarget.id);

      const token = getToken();

      await api.delete(
        `/super-admin/owners/${deleteTarget.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOwners((current) =>
        current.filter(
          (owner) => owner.id !== deleteTarget.id
        )
      );

      setDeleteTarget(null);

      showToast(
        "Akun Pemilik Kos berhasil dihapus."
      );
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          "Gagal menghapus akun Pemilik Kos.",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =========================
  // SEARCH
  // =========================

  const filteredOwners = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return owners;

    return owners.filter((owner) => {
      return (
        owner.name
          ?.toLowerCase()
          .includes(keyword) ||
        owner.email
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [owners, search]);

  // =========================
  // STATISTICS
  // =========================

  const totalOwners = owners.length;

  const activeOwners = owners.filter(
    (owner) => owner.status === "active"
  ).length;

  const inactiveOwners = owners.filter(
    (owner) => owner.status !== "active"
  ).length;

  const getKostCount = (owner) => {
    if (Array.isArray(owner.kosts)) {
      return owner.kosts.length;
    }

    return owner.kost_count ?? 0;
  };

  if (loading) {
    return (
      <div className="owners-loading">
        <div className="owners-spinner"></div>
        <p>Memuat data Pemilik Kos...</p>
      </div>
    );
  }

  return (
    <div className="owners-page">

      {/* =========================
          TOAST
      ========================= */}
      {toast && (
        <div
          className={`owners-toast ${
            toast.type === "error"
              ? "toast-error"
              : "toast-success"
          }`}
        >
          <div className="toast-icon">
            {toast.type === "error" ? "!" : "✓"}
          </div>

          <span>{toast.message}</span>
        </div>
      )}

      {/* =========================
          ADD OWNER MODAL
      ========================= */}
      {addOwnerOpen && (
        <div className="modal-overlay">
          <div className="add-owner-modal">

            <div className="add-owner-header">
              <div>
                <span className="card-eyebrow">
                  MANAJEMEN AKUN
                </span>

                <h3>
                  Tambah Pemilik Kos
                </h3>

                <p>
                  Buat akun baru untuk Pemilik Kos.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeAddOwnerModal}
                disabled={savingOwner}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddOwner}>

              <div className="form-group">
                <label htmlFor="owner-name">
                  Nama Pemilik Kos
                </label>

                <input
                  id="owner-name"
                  type="text"
                  name="name"
                  placeholder="Contoh: Budi Santoso"
                  value={ownerForm.name}
                  onChange={handleOwnerFormChange}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="owner-email">
                  Email
                </label>

                <input
                  id="owner-email"
                  type="email"
                  name="email"
                  placeholder="Contoh: budi@kostify.com"
                  value={ownerForm.email}
                  onChange={handleOwnerFormChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="owner-password">
                  Password
                </label>

                <input
                  id="owner-password"
                  type="password"
                  name="password"
                  placeholder="Minimal 8 karakter"
                  value={ownerForm.password}
                  onChange={handleOwnerFormChange}
                  minLength={8}
                  required
                  autoComplete="new-password"
                />

                <small className="form-hint">
                  Password digunakan Pemilik Kos
                  untuk login ke web Kostify.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="owner-status">
                  Status Akun
                </label>

                <select
                  id="owner-status"
                  name="status"
                  value={ownerForm.status}
                  onChange={handleOwnerFormChange}
                  disabled={savingOwner}
                >
                  <option value="active">
                    Aktif
                  </option>

                  <option value="inactive">
                    Nonaktif
                  </option>
                </select>
              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="modal-cancel"
                  onClick={closeAddOwnerModal}
                  disabled={savingOwner}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="modal-save"
                  disabled={savingOwner}
                >
                  {savingOwner
                    ? "Menyimpan..."
                    : "Tambah Pemilik Kos"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* =========================
          DELETE MODAL
      ========================= */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="delete-modal">

            <div className="delete-icon">
              🗑
            </div>

            <h3>
              Hapus akun Pemilik Kos?
            </h3>

            <p>
              Akun{" "}
              <strong>
                {deleteTarget.name}
              </strong>{" "}
              akan dihapus dari sistem. Tindakan
              ini tidak dapat dibatalkan.
            </p>

            <div className="modal-actions">

              <button
                className="modal-cancel"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={
                  processingId === deleteTarget.id
                }
              >
                Batal
              </button>

              <button
                className="modal-delete"
                onClick={handleDelete}
                disabled={
                  processingId === deleteTarget.id
                }
              >
                {processingId === deleteTarget.id
                  ? "Menghapus..."
                  : "Ya, Hapus"}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =========================
          HEADER
      ========================= */}
      <header className="owners-header">

        <div className="header-left">

          <button
            className="back-button"
            onClick={() =>
              navigate("/super-admin/dashboard")
            }
          >
            ←
          </button>

          <div>
            <div className="owners-breadcrumb">
              Kostify
              <span>/</span>
              Manajemen
              <span>/</span>
              Pemilik Kos
            </div>

            <h1>
              Pemilik Kos
            </h1>

            <p>
              Kelola akun Pemilik Kos yang
              terdaftar di platform Kostify.
            </p>
          </div>

        </div>

        <div className="header-actions">

          <button
            className="refresh-button"
            onClick={fetchOwners}
          >
            ↻ &nbsp; Perbarui Data
          </button>

          <button
            className="add-owner-button"
            onClick={() => setAddOwnerOpen(true)}
          >
            + &nbsp; Tambah Pemilik Kos
          </button>

        </div>

      </header>

      {/* =========================
          STATISTICS
      ========================= */}
      <section className="owner-stats">

        <div className="owner-stat-card">

          <div className="owner-stat-icon green">
            ♙
          </div>

          <div>
            <span>Total Pemilik</span>
            <strong>{totalOwners}</strong>
          </div>

        </div>

        <div className="owner-stat-card">

          <div className="owner-stat-icon active">
            ✓
          </div>

          <div>
            <span>Akun Aktif</span>
            <strong>{activeOwners}</strong>
          </div>

        </div>

        <div className="owner-stat-card">

          <div className="owner-stat-icon inactive">
            −
          </div>

          <div>
            <span>Akun Nonaktif</span>
            <strong>{inactiveOwners}</strong>
          </div>

        </div>

      </section>

      {/* =========================
          TABLE CARD
      ========================= */}
      <section className="owners-card">

        <div className="owners-card-header">

          <div>
            <span className="card-eyebrow">
              DATA TERDAFTAR
            </span>

            <h2>
              Daftar Pemilik Kos
            </h2>

            <p>
              Kelola status dan akun pemilik
              yang terdaftar.
            </p>
          </div>

          <div className="search-box">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}

          </div>

        </div>

        {/* =========================
            TABLE
        ========================= */}
        <div className="table-container">

          <table>

            <thead>
              <tr>
                <th>Pemilik Kos</th>
                <th>Email</th>
                <th>Status</th>
                <th>Data Kost</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>

              {filteredOwners.length > 0 ? (

                filteredOwners.map((owner) => (

                  <tr key={owner.id}>

                    <td>

                      <div className="owner-info">

                        <div className="owner-avatar">
                          {owner.name
                            ?.charAt(0)
                            .toUpperCase() || "P"}
                        </div>

                        <div>
                          <strong>
                            {owner.name}
                          </strong>

                          <span>
                            ID #{owner.id}
                          </span>
                        </div>

                      </div>

                    </td>

                    <td>
                      <span className="owner-email">
                        {owner.email || "-"}
                      </span>
                    </td>

                    <td>

                      <span
                        className={`owner-status ${
                          owner.status === "active"
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        <span></span>

                        {owner.status === "active"
                          ? "Aktif"
                          : "Nonaktif"}
                      </span>

                    </td>

                    <td>

                      <div className="kost-info">

                        <strong>
                          {getKostCount(owner)}
                        </strong>

                        <span>
                          Kost terdaftar
                        </span>

                      </div>

                    </td>

                    <td>

                      <div className="owner-actions">

                        <button
                          className={
                            owner.status === "active"
                              ? "status-action disable"
                              : "status-action enable"
                          }
                          onClick={() =>
                            handleStatus(owner)
                          }
                          disabled={
                            processingId === owner.id
                          }
                        >
                          {processingId === owner.id
                            ? "..."
                            : owner.status === "active"
                            ? "Nonaktifkan"
                            : "Aktifkan"}
                        </button>

                        <button
                          className="delete-action"
                          onClick={() =>
                            setDeleteTarget(owner)
                          }
                          disabled={
                            processingId === owner.id
                          }
                        >
                          Hapus
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    className="empty-owner"
                  >
                    <div className="empty-icon">
                      ♙
                    </div>

                    <strong>
                      Tidak ada data
                    </strong>

                    <span>
                      {search
                        ? "Tidak ditemukan Pemilik Kos yang sesuai."
                        : "Belum ada Pemilik Kos terdaftar."}
                    </span>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* =========================
            TABLE FOOTER
        ========================= */}
        <div className="table-footer">

          <span>
            Menampilkan{" "}
            <strong>
              {filteredOwners.length}
            </strong>{" "}
            dari{" "}
            <strong>
              {owners.length}
            </strong>{" "}
            Pemilik Kos
          </span>

          <span className="secure-text">
            ● Data tersinkronisasi
          </span>

        </div>

      </section>

    </div>
  );
}

export default Owners;