import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Kosts.css";

function Kosts() {
  const navigate = useNavigate();

  const [kosts, setKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingKost, setEditingKost] = useState(null);

  const [form, setForm] = useState({
    owner_id: "",
    name: "",
    address: "",
    city: "",
    status: "active",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchKosts();
  }, []);

  const handleAuthError = (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("remember_me");

      navigate("/");
      return true;
    }

    return false;
  };

  const fetchKosts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/super-admin/kosts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data?.data;

      setKosts(Array.isArray(data) ? data : []);
    } catch (err) {
      if (handleAuthError(err)) return;

      console.error(err);

      setError(
        err.response?.data?.message ||
          "Gagal mengambil data kost."
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingKost(null);

    setForm({
      owner_id: "",
      name: "",
      address: "",
      city: "",
      status: "active",
    });

    setModalOpen(true);
    setError("");
  };

  const openEditModal = (kost) => {
    setEditingKost(kost);

    setForm({
      owner_id: kost.owner_id || "",
      name: kost.name || "",
      address: kost.address || "",
      city: kost.city || "",
      status: kost.status || "active",
    });

    setModalOpen(true);
    setError("");
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingKost(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.owner_id) {
      setError("ID Pemilik Kos wajib diisi.");
      return;
    }

    if (!form.name.trim()) {
      setError("Nama kost wajib diisi.");
      return;
    }

    if (!form.address.trim()) {
      setError("Alamat kost wajib diisi.");
      return;
    }

    if (!form.city.trim()) {
      setError("Kota wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        owner_id: Number(form.owner_id),
        name: form.name,
        address: form.address,
        city: form.city,
        status: form.status,
      };

      if (editingKost) {
        await api.put(
          `/super-admin/kosts/${editingKost.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await api.post(
          "/super-admin/kosts",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      setModalOpen(false);
      setEditingKost(null);

      await fetchKosts();
    } catch (err) {
      if (handleAuthError(err)) return;

      console.error(err);

      setError(
        err.response?.data?.message ||
          "Gagal menyimpan data kost."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (kost) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus kost "${kost.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/super-admin/kosts/${kost.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchKosts();
    } catch (err) {
      if (handleAuthError(err)) return;

      console.error(err);

      setError(
        err.response?.data?.message ||
          "Gagal menghapus data kost."
      );
    }
  };

  const activeCount = kosts.filter(
    (kost) => kost.status === "active"
  ).length;

  const inactiveCount = kosts.filter(
    (kost) => kost.status === "inactive"
  ).length;

  return (
    <section className="kost-page">

      {/* HEADER */}
      <div className="kost-header">

        <div>
          <div className="kost-breadcrumb">
            Kostify <span>/</span> Data Kost
          </div>

          <h1>Kelola Data Kost</h1>

          <p>
            Kelola data kost yang terdaftar di platform
            Kostify.
          </p>
        </div>

        <button
          className="kost-add-button"
          onClick={openAddModal}
        >
          <span>＋</span>
          Tambah Kost
        </button>

      </div>

      {/* ERROR */}
      {error && !modalOpen && (
        <div className="kost-error">
          <span>!</span>
          <p>{error}</p>

          <button onClick={fetchKosts}>
            Coba lagi
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="kost-stat-grid">

        <div className="kost-stat-card">
          <div className="kost-stat-icon">
            ▦
          </div>

          <div>
            <span>Total Kost</span>
            <strong>{kosts.length}</strong>
          </div>
        </div>

        <div className="kost-stat-card">
          <div className="kost-stat-icon active">
            ✓
          </div>

          <div>
            <span>Kost Aktif</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="kost-stat-card">
          <div className="kost-stat-icon inactive">
            —
          </div>

          <div>
            <span>Kost Nonaktif</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>

      </div>

      {/* CONTENT CARD */}
      <div className="kost-card">

        <div className="kost-card-header">

          <div>
            <h2>Daftar Kost</h2>
            <p>
              Seluruh data kost yang dikelola oleh
              Super Admin.
            </p>
          </div>

          <button
            className="kost-refresh"
            onClick={fetchKosts}
            disabled={loading}
          >
            ↻
            <span>Refresh</span>
          </button>

        </div>

        {/* LOADING */}
        {loading ? (
          <div className="kost-loading">
            <div className="kost-spinner"></div>
            <p>Memuat data kost...</p>
          </div>
        ) : kosts.length === 0 ? (
          /* EMPTY */
          <div className="kost-empty">

            <div className="kost-empty-icon">
              ▦
            </div>

            <h3>Belum ada data kost</h3>

            <p>
              Tambahkan data kost pertama untuk
              mulai mengelola data.
            </p>

            <button onClick={openAddModal}>
              ＋ Tambah Kost
            </button>

          </div>
        ) : (
          /* TABLE */
          <div className="kost-table-wrapper">

            <table className="kost-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Data Kost</th>
                  <th>Pemilik</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>

                {kosts.map((kost, index) => (

                  <tr key={kost.id}>

                    <td>
                      <span className="kost-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </td>

                    <td>
                      <div className="kost-name-cell">

                        <div className="kost-avatar">
                          {kost.name
                            ?.charAt(0)
                            ?.toUpperCase() || "K"}
                        </div>

                        <div>
                          <strong>
                            {kost.name || "-"}
                          </strong>

                          <small>
                            ID Kost #{kost.id}
                          </small>
                        </div>

                      </div>
                    </td>

                    <td>
                      <div className="kost-owner-cell">

                        <span className="kost-owner-avatar">
                          {kost.owner?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "P"}
                        </span>

                        <div>
                          <strong>
                            {kost.owner?.name ||
                              `Pemilik #${kost.owner_id}`}
                          </strong>

                          {kost.owner?.email && (
                            <small>
                              {kost.owner.email}
                            </small>
                          )}
                        </div>

                      </div>
                    </td>

                    <td>
                      <div className="kost-location">
                        <strong>
                          {kost.city || "-"}
                        </strong>

                        <small>
                          {kost.address || "-"}
                        </small>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`kost-status ${
                          kost.status === "active"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        <span></span>

                        {kost.status === "active"
                          ? "Aktif"
                          : "Nonaktif"}
                      </span>
                    </td>

                    <td>

                      <div className="kost-actions">

                        <button
                          className="kost-action edit"
                          onClick={() =>
                            openEditModal(kost)
                          }
                          title="Edit"
                        >
                          ✎
                        </button>

                        <button
                          className="kost-action delete"
                          onClick={() =>
                            handleDelete(kost)
                          }
                          title="Hapus"
                        >
                          🗑
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* MODAL */}
      {modalOpen && (
        <div
          className="kost-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !saving
            ) {
              closeModal();
            }
          }}
        >

          <div className="kost-modal">

            <div className="kost-modal-header">

              <div>
                <span className="kost-modal-label">
                  DATA KOST
                </span>

                <h2>
                  {editingKost
                    ? "Edit Data Kost"
                    : "Tambah Data Kost"}
                </h2>

                <p>
                  {editingKost
                    ? "Perbarui informasi kost."
                    : "Masukkan informasi kost baru."}
                </p>
              </div>

              <button
                className="kost-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            {error && (
              <div className="kost-modal-error">
                <span>!</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="kost-form-grid">

                <div className="kost-form-group">

                  <label>
                    ID Pemilik Kos
                    <span>*</span>
                  </label>

                  <input
                    type="number"
                    name="owner_id"
                    value={form.owner_id}
                    onChange={handleChange}
                    placeholder="Contoh: 2"
                    disabled={saving}
                  />

                  <small>
                    Masukkan ID akun Pemilik Kos.
                  </small>

                </div>

                <div className="kost-form-group">

                  <label>
                    Nama Kost
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Contoh: Kost Sejahtera"
                    disabled={saving}
                  />

                </div>

              </div>

              <div className="kost-form-group">

                <label>
                  Alamat
                  <span>*</span>
                </label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Masukkan alamat lengkap kost"
                  rows="3"
                  disabled={saving}
                />

              </div>

              <div className="kost-form-grid">

                <div className="kost-form-group">

                  <label>
                    Kota
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Contoh: Sumedang"
                    disabled={saving}
                  />

                </div>

                <div className="kost-form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="active">
                      Aktif
                    </option>

                    <option value="inactive">
                      Nonaktif
                    </option>
                  </select>

                </div>

              </div>

              <div className="kost-modal-footer">

                <button
                  type="button"
                  className="kost-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="kost-save-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="button-spinner"></span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      {editingKost
                        ? "Simpan Perubahan"
                        : "Tambah Kost"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </section>
  );
}

export default Kosts;