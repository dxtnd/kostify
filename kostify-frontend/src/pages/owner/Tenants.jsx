import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./Tenants.css";

function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [kosts, setKosts] = useState([]);

  const [activeKostId, setActiveKostId] = useState(
    localStorage.getItem("active_kost_id") || ""
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

  const [form, setForm] = useState({
    name: "",
    nik: "",
    password: "",
    room_id: "",
    phone: "",
    address: "",
    status: "active",
  });

  // =====================================================
  // FETCH TENANTS
  // =====================================================

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/owner/tenants");

      setTenants(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      );
    } catch (err) {
      console.error(
        "Gagal mengambil penghuni:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Gagal memuat data penghuni."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH ROOMS
  // =====================================================

  const fetchRooms = async () => {
    try {
      const response = await api.get("/owner/rooms");

      setRooms(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      );
    } catch (err) {
      console.error(
        "Gagal mengambil data kamar:",
        err
      );
    }
  };

  // =====================================================
  // FETCH KOSTS
  // =====================================================

  const fetchKosts = async () => {
    try {
      const response = await api.get(
        "/owner/overview"
      );

      const ownerKosts = Array.isArray(
        response.data?.kosts
      )
        ? response.data.kosts
        : [];

      setKosts(ownerKosts);

      const savedKostId =
        localStorage.getItem(
          "active_kost_id"
        );

      const savedKostExists =
        ownerKosts.some(
          (kost) =>
            String(kost.id) ===
            String(savedKostId)
        );

      if (savedKostExists) {
        setActiveKostId(
          String(savedKostId)
        );
      } else if (ownerKosts.length > 0) {
        const firstKost =
          ownerKosts[0];

        setActiveKostId(
          String(firstKost.id)
        );

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
    } catch (err) {
      console.error(
        "Gagal mengambil data kost:",
        err
      );
    }
  };

  // =====================================================
  // INITIAL FETCH
  // =====================================================

  useEffect(() => {
    fetchTenants();
    fetchRooms();
    fetchKosts();

    const handleActiveKostChanged = () => {
      const kostId =
        localStorage.getItem(
          "active_kost_id"
        ) || "";

      setActiveKostId(kostId);

      // Bersihkan pencarian ketika pindah kost
      setSearch("");
      setStatusFilter("all");
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

  // =====================================================
  // TOAST
  // =====================================================

  const showToast = (message) => {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  // =====================================================
  // ACTIVE KOST
  // =====================================================

  const activeKost = useMemo(() => {
    return kosts.find(
      (kost) =>
        String(kost.id) ===
        String(activeKostId)
    );
  }, [kosts, activeKostId]);

  // =====================================================
  // FILTER TENANTS BERDASARKAN KOST AKTIF
  // =====================================================

  const activeTenants = useMemo(() => {
    if (!activeKostId) {
      return [];
    }

    return tenants.filter((tenant) => {
      const tenantKostId =
        tenant.kost_id ||
        tenant.kost?.id;

      return (
        String(tenantKostId) ===
        String(activeKostId)
      );
    });
  }, [
    tenants,
    activeKostId,
  ]);

  // =====================================================
  // FILTER TENANTS SEARCH + STATUS
  // =====================================================

  const filteredTenants = useMemo(() => {
    return activeTenants.filter(
      (tenant) => {
        const keyword =
          search.toLowerCase().trim();

        const name =
          tenant.user?.name ||
          tenant.name ||
          "";

        const nik =
          tenant.user?.nik ||
          tenant.nik ||
          "";

        const room =
          tenant.room?.room_number ||
          "";

        const kost =
          tenant.kost?.name ||
          activeKost?.name ||
          "";

        const matchesSearch =
          !keyword ||
          name
            .toLowerCase()
            .includes(keyword) ||
          nik
            .toLowerCase()
            .includes(keyword) ||
          room
            .toLowerCase()
            .includes(keyword) ||
          kost
            .toLowerCase()
            .includes(keyword);

        const matchesStatus =
          statusFilter === "all" ||
          tenant.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    activeTenants,
    search,
    statusFilter,
    activeKost,
  ]);

  // =====================================================
  // ACTIVE KOST ROOMS
  // =====================================================

  const activeRooms = useMemo(() => {
    if (!activeKostId) {
      return [];
    }

    return rooms.filter(
      (room) =>
        String(room.kost_id) ===
        String(activeKostId)
    );
  }, [
    rooms,
    activeKostId,
  ]);

  // =====================================================
  // AVAILABLE ROOMS
  // =====================================================

  const availableRooms = useMemo(() => {
    /*
     * Hanya kamar dari Kost Aktif.
     */
    const kostRooms =
      activeRooms;

    const available =
      kostRooms.filter(
        (room) =>
          room.status ===
          "available"
      );

    /*
     * Saat EDIT, kamar penghuni
     * yang sedang ditempati tetap
     * ditampilkan.
     */
    if (
      editingTenant &&
      editingTenant.room_id
    ) {
      const currentRoom =
        kostRooms.find(
          (room) =>
            Number(room.id) ===
            Number(
              editingTenant.room_id
            )
        );

      if (
        currentRoom &&
        !available.some(
          (room) =>
            Number(room.id) ===
            Number(
              currentRoom.id
            )
        )
      ) {
        return [
          currentRoom,
          ...available,
        ];
      }
    }

    return available;
  }, [
    activeRooms,
    editingTenant,
  ]);

  // =====================================================
  // FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      name: "",
      nik: "",
      password: "",
      room_id: "",
      phone: "",
      address: "",
      status: "active",
    });

    setEditingTenant(null);
  };

  // =====================================================
  // TAMBAH PENGHUNI
  // =====================================================

  const openAddModal = () => {
    if (!activeKostId) {
      showToast(
        "Pilih Kost Aktif terlebih dahulu."
      );
      return;
    }

    resetForm();

    setModalOpen(true);
  };

  // =====================================================
  // EDIT PENGHUNI
  // =====================================================

  const openEditModal = (
    tenant
  ) => {
    setEditingTenant(tenant);

    setForm({
      name:
        tenant.user?.name ||
        tenant.name ||
        "",

      nik:
        tenant.user?.nik ||
        tenant.nik ||
        "",

      password: "",

      room_id:
        tenant.room_id ||
        tenant.room?.id ||
        "",

      phone:
        tenant.phone || "",

      address:
        tenant.address || "",

      status:
        tenant.status ||
        "active",
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    resetForm();
  };

  const handleChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE
  // =====================================================

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    if (!activeKostId) {
      showToast(
        "Belum ada Kost Aktif."
      );
      return;
    }

    if (!form.name.trim()) {
      showToast(
        "Nama penghuni wajib diisi."
      );
      return;
    }

    if (!form.nik.trim()) {
      showToast(
        "NIK wajib diisi."
      );
      return;
    }

    if (
      !editingTenant &&
      !form.password.trim()
    ) {
      showToast(
        "Password akun wajib diisi."
      );
      return;
    }

    if (!form.room_id) {
      showToast(
        "Pilih kamar terlebih dahulu."
      );
      return;
    }

    /*
     * Pastikan kamar yang dipilih
     * memang berasal dari Kost Aktif.
     */
    const selectedRoom =
      activeRooms.find(
        (room) =>
          Number(room.id) ===
          Number(form.room_id)
      );

    if (!selectedRoom) {
      showToast(
        "Kamar tidak sesuai dengan Kost Aktif."
      );
      return;
    }

    if (!form.phone.trim()) {
      showToast(
        "Nomor HP wajib diisi."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        nik: form.nik.trim(),
        room_id:
          Number(form.room_id),
        phone:
          form.phone.trim(),
        address:
          form.address.trim(),
        status:
          form.status,
      };

      /*
       * Password hanya dikirim ketika:
       * - tambah penghuni
       * - atau password baru diisi saat edit
       */
      if (
        form.password.trim()
      ) {
        payload.password =
          form.password.trim();
      }

      if (editingTenant) {
        await api.put(
          `/owner/tenants/${editingTenant.id}`,
          payload
        );

        showToast(
          "Data penghuni berhasil diperbarui."
        );
      } else {
        await api.post(
          "/owner/tenants",
          payload
        );

        showToast(
          "Penghuni berhasil ditambahkan."
        );
      }

      setModalOpen(false);
      resetForm();

      await Promise.all([
        fetchTenants(),
        fetchRooms(),
      ]);
    } catch (err) {
      console.error(
        "Gagal menyimpan penghuni:",
        err
      );

      const validationErrors =
        err.response?.data
          ?.errors;

      if (
        validationErrors
      ) {
        const firstError =
          Object.values(
            validationErrors
          )[0];

        showToast(
          Array.isArray(
            firstError
          )
            ? firstError[0]
            : "Data penghuni tidak valid."
        );
      } else {
        showToast(
          err.response?.data
            ?.message ||
            "Gagal menyimpan data penghuni."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (
    tenant
  ) => {
    const tenantName =
      tenant.user?.name ||
      tenant.name ||
      "penghuni";

    const confirmed =
      window.confirm(
        `Hapus data ${tenantName}?`
      );

    if (!confirmed) return;

    try {
      await api.delete(
        `/owner/tenants/${tenant.id}`
      );

      showToast(
        "Data penghuni berhasil dihapus."
      );

      await Promise.all([
        fetchTenants(),
        fetchRooms(),
      ]);
    } catch (err) {
      console.error(
        "Gagal menghapus penghuni:",
        err
      );

      showToast(
        err.response?.data
          ?.message ||
          "Gagal menghapus data penghuni."
      );
    }
  };

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalTenants =
    activeTenants.length;

  const activeTenantCount =
    activeTenants.filter(
      (tenant) =>
        tenant.status ===
        "active"
    ).length;

  const inactiveTenantCount =
    activeTenants.filter(
      (tenant) =>
        tenant.status ===
        "inactive"
    ).length;

  // =====================================================
  // STATUS LABEL
  // =====================================================

  const getStatusLabel = (
    status
  ) => {
    if (
      status === "active"
    ) {
      return "Aktif";
    }

    if (
      status === "inactive"
    ) {
      return "Nonaktif";
    }

    return status;
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="tenants-page">

      {/* TOAST */}

      {toast && (
        <div className="tenants-toast">
          <span>✓</span>
          {toast}
        </div>
      )}

      {/* HEADER */}

      <div className="tenants-header">

        <div>

          <span className="tenants-eyebrow">
            MANAJEMEN PENGHUNI
          </span>

          <h1>
            Kelola Penghuni
          </h1>

          <p>
            Kelola data dan akun
            penghuni pada kost
            yang sedang aktif.
          </p>

        </div>

        <button
          className="tenants-add-button"
          onClick={
            openAddModal
          }
          disabled={
            !activeKostId
          }
        >
          <span>＋</span>
          Tambah Penghuni
        </button>

      </div>

      {/* STATISTICS */}

      <div className="tenants-stat-grid">

        <div className="tenants-stat-card">

          <div className="tenants-stat-icon total">
            ♟
          </div>

          <div>
            <span>
              Total Penghuni
            </span>

            <strong>
              {totalTenants}
            </strong>
          </div>

        </div>


        <div className="tenants-stat-card">

          <div className="tenants-stat-icon active">
            ✓
          </div>

          <div>
            <span>
              Aktif
            </span>

            <strong>
              {activeTenantCount}
            </strong>
          </div>

        </div>


        <div className="tenants-stat-card">

          <div className="tenants-stat-icon inactive">
            ●
          </div>

          <div>
            <span>
              Nonaktif
            </span>

            <strong>
              {inactiveTenantCount}
            </strong>
          </div>

        </div>

      </div>

      {/* TABLE */}

      <div className="tenants-card">

        {/* TOOLBAR */}

        <div className="tenants-toolbar">

          <div className="tenants-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Cari nama, NIK, kamar, atau kost..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>


          <select
            className="tenants-filter"
            value={
              statusFilter
            }
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >

            <option value="all">
              Semua Status
            </option>

            <option value="active">
              Aktif
            </option>

            <option value="inactive">
              Nonaktif
            </option>

          </select>

        </div>

        {/* ERROR */}

        {error && (
          <div className="tenants-error">

            <strong>
              Gagal memuat data
            </strong>

            <span>
              {error}
            </span>

            <button
              onClick={() => {
                fetchTenants();
                fetchRooms();
                fetchKosts();
              }}
            >
              Coba Lagi
            </button>

          </div>
        )}

        {/* LOADING */}

        {loading ? (

          <div className="tenants-loading">

            <div className="tenants-spinner"></div>

            <span>
              Memuat data
              penghuni...
            </span>

          </div>

        ) : filteredTenants.length === 0 ? (

          <div className="tenants-empty">

            <div className="tenants-empty-icon">
              ♟
            </div>

            <strong>
              {!activeKostId
                ? "Belum ada Kost Aktif"
                : activeTenants.length === 0
                ? "Belum ada penghuni"
                : "Penghuni tidak ditemukan"}
            </strong>

            <p>
              {!activeKostId
                ? "Pilih Kost Aktif dari sidebar terlebih dahulu."
                : activeTenants.length === 0
                ? "Tambahkan penghuni untuk kost yang sedang aktif."
                : "Coba gunakan kata kunci atau filter yang berbeda."}
            </p>

            {activeKostId &&
              activeTenants.length === 0 && (
                <button
                  className="tenants-empty-button"
                  onClick={
                    openAddModal
                  }
                >
                  ＋ Tambah Penghuni
                </button>
              )}

          </div>

        ) : (

          <div className="tenants-table-wrapper">

            <table className="tenants-table">

              <thead>

                <tr>
                  <th>NO</th>
                  <th>PENGHUNI</th>
                  <th>NIK</th>
                  <th>KAMAR</th>
                  <th>KOST</th>
                  <th>NO. HP</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>

              </thead>


              <tbody>

                {filteredTenants.map(
                  (
                    tenant,
                    index
                  ) => {

                    const name =
                      tenant.user?.name ||
                      tenant.name ||
                      "-";

                    const nik =
                      tenant.user?.nik ||
                      tenant.nik ||
                      "-";

                    return (
                      <tr
                        key={
                          tenant.id
                        }
                      >

                        <td>
                          {index + 1}
                        </td>

                        <td>

                          <div className="tenant-person">

                            <div className="tenant-avatar">
                              {name
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {name}
                              </strong>

                              <small>
                                Penghuni
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>

                          <span className="tenant-nik">
                            {nik}
                          </span>

                        </td>

                        <td>

                          <span className="tenant-room">
                            {tenant.room
                              ?.room_number ||
                              "-"}
                          </span>

                        </td>

                        <td>

                          <div className="tenant-kost">
                            {tenant.kost
                              ?.name ||
                              activeKost
                                ?.name ||
                              "-"}
                          </div>

                        </td>

                        <td>
                          {tenant.phone ||
                            "-"}
                        </td>

                        <td>

                          <span
                            className={`tenant-status ${tenant.status}`}
                          >

                            <span></span>

                            {getStatusLabel(
                              tenant.status
                            )}

                          </span>

                        </td>

                        <td>

                          <div className="tenant-actions">

                            <button
                              className="tenant-action edit"
                              onClick={() =>
                                openEditModal(
                                  tenant
                                )
                              }
                              title="Edit penghuni"
                            >
                              ✎
                            </button>

                            <button
                              className="tenant-action delete"
                              onClick={() =>
                                handleDelete(
                                  tenant
                                )
                              }
                              title="Hapus penghuni"
                            >
                              ×
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      {modalOpen && (

        <div
          className="tenants-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="tenants-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="tenants-modal-header">

              <div>

                <span className="tenants-modal-eyebrow">
                  {editingTenant
                    ? "EDIT DATA"
                    : "DATA BARU"}
                </span>

                <h2>
                  {editingTenant
                    ? "Edit Penghuni"
                    : "Tambah Penghuni"}
                </h2>

              </div>

              <button
                className="tenants-modal-close"
                onClick={
                  closeModal
                }
                disabled={saving}
              >
                ×
              </button>

            </div>


            {/* FORM */}

            <form
              className="tenants-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* NAMA */}

              <div className="tenants-form-group">

                <label>
                  Nama Lengkap
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Contoh: Dandi Riziq"
                  disabled={
                    saving
                  }
                  required
                />

              </div>


              {/* NIK */}

              <div className="tenants-form-group">

                <label>
                  NIK
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="nik"
                  value={
                    form.nik
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Masukkan NIK"
                  maxLength="16"
                  disabled={
                    saving
                  }
                  required
                />

              </div>


              {/* PASSWORD */}

              <div className="tenants-form-group">

                <label>
                  Password

                  {!editingTenant && (
                    <span>*</span>
                  )}
                </label>

                <input
                  type="password"
                  name="password"
                  value={
                    form.password
                  }
                  onChange={
                    handleChange
                  }
                  placeholder={
                    editingTenant
                      ? "Kosongkan jika tidak diubah"
                      : "Password akun penghuni"
                  }
                  disabled={
                    saving
                  }
                  required={
                    !editingTenant
                  }
                />

                {!editingTenant && (
                  <small className="tenants-form-help">
                    Password digunakan
                    penghuni untuk
                    login menggunakan
                    NIK.
                  </small>
                )}

              </div>


              {/* KOST AKTIF */}

              <div className="tenants-form-group">

                <label className="tenants-form-label">
                  Kost
                </label>

                <div className="tenants-selected-kost">

                  <div className="tenants-selected-kost-icon">
                    ▦
                  </div>

                  <div className="tenants-selected-kost-info">

                    <strong>
                      {editingTenant
                        ? editingTenant.kost?.name ||
                          activeKost?.name ||
                          "Belum ada Kost"
                        : activeKost?.name ||
                          "Belum ada Kost"}
                    </strong>

                    <span>
                      {editingTenant
                        ? editingTenant.kost?.city ||
                          activeKost?.city ||
                          "Lokasi kost belum tersedia"
                        : activeKost?.city ||
                          "Lokasi kost belum tersedia"}
                    </span>

                  </div>

                  <div className="tenants-selected-kost-check">
                    ✓
                  </div>

                </div>

              </div>


              {/* KAMAR */}

              <div className="tenants-form-group">

                <label>
                  Kamar
                  <span>*</span>
                </label>

                <select
                  name="room_id"
                  value={
                    form.room_id
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving ||
                    availableRooms.length ===
                      0
                  }
                  required
                >

                  <option value="">
                    {availableRooms.length ===
                    0
                      ? "Belum ada kamar tersedia"
                      : "Pilih Kamar"}
                  </option>

                  {availableRooms.map(
                    (room) => (
                      <option
                        key={
                          room.id
                        }
                        value={
                          room.id
                        }
                      >
                        {
                          room.room_number
                        }{" "}
                        — Rp{" "}
                        {Number(
                          room.price
                        ).toLocaleString(
                          "id-ID"
                        )}

                        {room.status ===
                          "occupied" &&
                          " (Kamar Saat Ini)"}
                      </option>
                    )
                  )}

                </select>

                {!editingTenant &&
                  availableRooms.length ===
                    0 && (
                    <small className="tenants-form-help">
                      Semua kamar sedang
                      terisi atau tidak
                      tersedia.
                    </small>
                  )}

              </div>


              {/* NO HP */}

              <div className="tenants-form-group">

                <label>
                  Nomor HP
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="phone"
                  value={
                    form.phone
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Contoh: 081234567890"
                  disabled={
                    saving
                  }
                  required
                />

              </div>


              {/* ALAMAT */}

              <div className="tenants-form-group">

                <label>
                  Alamat
                </label>

                <textarea
                  name="address"
                  value={
                    form.address
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Alamat asal penghuni"
                  rows="3"
                  disabled={
                    saving
                  }
                />

              </div>


              {/* STATUS */}

              <div className="tenants-form-group">

                <label>
                  Status
                  <span>*</span>
                </label>

                <select
                  name="status"
                  value={
                    form.status
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving
                  }
                  required
                >

                  <option value="active">
                    Aktif
                  </option>

                  <option value="inactive">
                    Nonaktif
                  </option>

                </select>

              </div>


              {/* ACTION */}

              <div className="tenants-form-actions">

                <button
                  type="button"
                  className="tenants-cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="tenants-save-button"
                  disabled={
                    saving ||
                    (!editingTenant &&
                      availableRooms.length ===
                        0)
                  }
                >
                  {saving
                    ? "Menyimpan..."
                    : editingTenant
                    ? "Simpan Perubahan"
                    : "Tambah Penghuni"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Tenants;