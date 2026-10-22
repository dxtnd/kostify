import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./Rooms.css";

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [kosts, setKosts] = useState([]);
  const [bills, setBills] = useState([]);

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
  const [editingRoom, setEditingRoom] = useState(null);

  const [form, setForm] = useState({
    kost_id: "",
    room_number: "",
    price: "",
    status: "available",
  });


  // =====================================================
  // FETCH ROOMS
  // =====================================================

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/owner/rooms");

      setRooms(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      );
    } catch (err) {
      console.error("Gagal mengambil kamar:", err);

      setError(
        err.response?.data?.message ||
          "Gagal memuat data kamar."
      );
    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // FETCH KOSTS
  // =====================================================

  const fetchKosts = async () => {
    try {
      const response = await api.get("/owner/overview");

      const ownerKosts = Array.isArray(
        response.data?.kosts
      )
        ? response.data.kosts
        : [];

      setKosts(ownerKosts);

      // Pastikan Kost Aktif masih valid
      const savedKostId =
        localStorage.getItem("active_kost_id");

      const savedKostExists = ownerKosts.some(
        (kost) =>
          String(kost.id) ===
          String(savedKostId)
      );

      if (savedKostExists) {
        setActiveKostId(String(savedKostId));
      } else if (ownerKosts.length > 0) {
        const firstKost = ownerKosts[0];

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
  // FETCH BILLS
  // =====================================================

  const fetchBills = async () => {
    try {
      const response = await api.get("/owner/bills");

      setBills(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      );
    } catch (err) {
      console.error(
        "Gagal mengambil data tagihan:",
        err
      );

      setBills([]);
    }
  };


  // =====================================================
  // REFRESH STATUS TAGIHAN
  // =====================================================

  const refreshBillStatus = async () => {
    try {
      const response = await api.get("/owner/bills");

      setBills(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      );
    } catch (err) {
      console.error(
        "Gagal memperbarui status tagihan:",
        err
      );
    }
  };


  // =====================================================
  // INITIAL FETCH
  // =====================================================

  useEffect(() => {
    fetchRooms();
    fetchKosts();
    fetchBills();

    const handleBillUpdated = () => {
      refreshBillStatus();
    };

    const handleActiveKostChanged = () => {
      const kostId =
        localStorage.getItem(
          "active_kost_id"
        ) || "";

      setActiveKostId(kostId);
    };

    window.addEventListener(
      "bill-status-updated",
      handleBillUpdated
    );

    window.addEventListener(
      "active-kost-changed",
      handleActiveKostChanged
    );

    return () => {
      window.removeEventListener(
        "bill-status-updated",
        handleBillUpdated
      );

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
  // FILTER ROOM BERDASARKAN KOST AKTIF
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
  }, [rooms, activeKostId]);


  // =====================================================
  // ROOM PAYMENT STATUS
  // =====================================================

  const hasUnpaidBill = (room) => {
    return bills.some((bill) => {
      const billRoomId =
        bill.tenant?.room_id ||
        bill.tenant?.room?.id;

      const isSameRoom =
        Number(billRoomId) ===
        Number(room.id);

      const isUnpaid =
        bill.status === "unpaid" ||
        bill.status === "rejected";

      return isSameRoom && isUnpaid;
    });
  };


  const getRoomVisualStatus = (room) => {

    // Perbaikan
    if (
      room.status === "maintenance"
    ) {
      return "maintenance";
    }

    // Terisi + belum bayar
    if (
      room.status === "occupied" &&
      hasUnpaidBill(room)
    ) {
      return "unpaid";
    }

    return room.status;
  };


  // =====================================================
  // SEARCH + STATUS FILTER
  // =====================================================

  const filteredRooms = useMemo(() => {
    return activeRooms.filter((room) => {

      const keyword =
        search.toLowerCase().trim();

      const matchesSearch =
        !keyword ||
        room.room_number
          ?.toLowerCase()
          .includes(keyword) ||
        room.kost?.name
          ?.toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        room.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    activeRooms,
    search,
    statusFilter,
  ]);


  // =====================================================
  // FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      kost_id: "",
      room_number: "",
      price: "",
      status: "available",
    });

    setEditingRoom(null);
  };


  // =====================================================
  // TAMBAH KAMAR
  // =====================================================

  const openAddModal = () => {

    if (!activeKostId) {
      showToast(
        "Pilih Kost Aktif terlebih dahulu."
      );
      return;
    }

    resetForm();

    setForm({
      kost_id: String(activeKostId),
      room_number: "",
      price: "",
      status: "available",
    });

    setModalOpen(true);
  };


  // =====================================================
  // EDIT KAMAR
  // =====================================================

  const openEditModal = (room) => {

    setEditingRoom(room);

    setForm({
      kost_id:
        room.kost_id || "",
      room_number:
        room.room_number || "",
      price:
        room.price || "",
      status:
        room.status || "available",
    });

    setModalOpen(true);
  };


  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    resetForm();
  };


  const handleChange = (e) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    /*
     * Saat tambah:
     * gunakan Kost Aktif.
     *
     * Saat edit:
     * pertahankan kost kamar tersebut.
     */
    const selectedKostId = editingRoom
      ? editingRoom.kost_id
      : activeKostId;

    if (!selectedKostId) {
      showToast(
        "Belum ada Kost Aktif."
      );
      return;
    }

    if (!form.room_number.trim()) {
      showToast(
        "Nomor kamar wajib diisi."
      );
      return;
    }

    if (
      !form.price ||
      Number(form.price) <= 0
    ) {
      showToast(
        "Harga kamar harus lebih dari 0."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        kost_id:
          Number(selectedKostId),

        room_number:
          form.room_number.trim(),

        price:
          Number(form.price),

        status:
          form.status,
      };

      if (editingRoom) {

        await api.put(
          `/owner/rooms/${editingRoom.id}`,
          payload
        );

        showToast(
          "Kamar berhasil diperbarui."
        );

      } else {

        await api.post(
          "/owner/rooms",
          payload
        );

        showToast(
          "Kamar berhasil ditambahkan."
        );
      }

      setModalOpen(false);

      resetForm();

      await fetchRooms();
      await fetchBills();

    } catch (err) {

      console.error(
        "Gagal menyimpan kamar:",
        err
      );

      const validationErrors =
        err.response?.data?.errors;

      if (validationErrors) {

        const firstError =
          Object.values(
            validationErrors
          )[0];

        showToast(
          Array.isArray(firstError)
            ? firstError[0]
            : "Data kamar tidak valid."
        );

      } else {

        showToast(
          err.response?.data?.message ||
            "Gagal menyimpan data kamar."
        );
      }

    } finally {
      setSaving(false);
    }
  };


  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (room) => {

    const confirmed =
      window.confirm(
        `Hapus kamar ${room.room_number}?`
      );

    if (!confirmed) return;

    try {

      await api.delete(
        `/owner/rooms/${room.id}`
      );

      showToast(
        "Kamar berhasil dihapus."
      );

      await fetchRooms();
      await fetchBills();

    } catch (err) {

      console.error(
        "Gagal menghapus kamar:",
        err
      );

      showToast(
        err.response?.data?.message ||
          "Gagal menghapus kamar."
      );
    }
  };


  // =====================================================
  // STATISTICS
  // =====================================================

  const totalRooms =
    activeRooms.length;

  const availableRooms =
    activeRooms.filter(
      (room) =>
        room.status ===
        "available"
    ).length;

  const occupiedRooms =
    activeRooms.filter(
      (room) =>
        room.status ===
        "occupied"
    ).length;

  const maintenanceRooms =
    activeRooms.filter(
      (room) =>
        room.status ===
        "maintenance"
    ).length;


  // =====================================================
  // FORMAT PRICE
  // =====================================================

  const formatPrice = (price) => {
    return `Rp ${Number(
      price || 0
    ).toLocaleString("id-ID")}`;
  };


  // =====================================================
  // STATUS LABEL
  // =====================================================

  const getStatusLabel = (status) => {

    if (
      status === "available"
    ) {
      return "Tersedia";
    }

    if (
      status === "occupied"
    ) {
      return "Terisi";
    }

    if (
      status === "maintenance"
    ) {
      return "Perbaikan";
    }

    if (
      status === "unpaid"
    ) {
      return "Belum Bayar";
    }

    return status;
  };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="rooms-page">

      {/* =================================================
          TOAST
      ================================================= */}

      {toast && (
        <div className="rooms-toast">
          <span>✓</span>
          {toast}
        </div>
      )}


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="rooms-header">

        <div>

          <span className="rooms-eyebrow">
            MANAJEMEN KAMAR
          </span>

          <h1>
            Kelola Kamar
          </h1>

          <p>
            Kelola data dan status kamar
            pada kost yang sedang aktif.
          </p>

        </div>


        <button
          className="rooms-add-button"
          onClick={openAddModal}
          disabled={!activeKostId}
        >
          <span>＋</span>
          Tambah Kamar
        </button>

      </div>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="rooms-stat-grid">

        <div className="rooms-stat-card">

          <div className="rooms-stat-icon total">
            ▦
          </div>

          <div>
            <span>
              Total Kamar
            </span>

            <strong>
              {totalRooms}
            </strong>
          </div>

        </div>


        <div className="rooms-stat-card">

          <div className="rooms-stat-icon available">
            ✓
          </div>

          <div>
            <span>
              Tersedia
            </span>

            <strong>
              {availableRooms}
            </strong>
          </div>

        </div>


        <div className="rooms-stat-card">

          <div className="rooms-stat-icon occupied">
            ●
          </div>

          <div>
            <span>
              Terisi
            </span>

            <strong>
              {occupiedRooms}
            </strong>
          </div>

        </div>


        <div className="rooms-stat-card">

          <div className="rooms-stat-icon maintenance">
            !
          </div>

          <div>
            <span>
              Perbaikan
            </span>

            <strong>
              {maintenanceRooms}
            </strong>
          </div>

        </div>

      </div>


      {/* =================================================
          TABLE CARD
      ================================================= */}

      <div className="rooms-card">

        {/* TOOLBAR */}

        <div className="rooms-toolbar">

          <div className="rooms-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Cari nomor kamar..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>


          <select
            className="rooms-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >

            <option value="all">
              Semua Status
            </option>

            <option value="available">
              Tersedia
            </option>

            <option value="occupied">
              Terisi
            </option>

            <option value="maintenance">
              Perbaikan
            </option>

          </select>

        </div>


        {/* ERROR */}

        {error && (
          <div className="rooms-error">

            <strong>
              Gagal memuat data
            </strong>

            <span>
              {error}
            </span>

            <button
              onClick={() => {
                fetchRooms();
                fetchBills();
              }}
            >
              Coba Lagi
            </button>

          </div>
        )}


        {/* LOADING */}

        {loading ? (

          <div className="rooms-loading">

            <div className="rooms-spinner"></div>

            <span>
              Memuat data kamar...
            </span>

          </div>

        ) : filteredRooms.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <div className="rooms-empty">

            <div className="rooms-empty-icon">
              ▦
            </div>

            <strong>
              {!activeKostId
                ? "Belum ada Kost Aktif"
                : activeRooms.length === 0
                ? "Belum ada kamar"
                : "Kamar tidak ditemukan"}
            </strong>

            <p>
              {!activeKostId
                ? "Pilih Kost Aktif dari sidebar terlebih dahulu."
                : activeRooms.length === 0
                ? "Tambahkan kamar untuk kost yang sedang aktif."
                : "Coba gunakan kata kunci atau filter yang berbeda."}
            </p>

            {activeKostId &&
              activeRooms.length === 0 && (
                <button
                  className="rooms-empty-button"
                  onClick={
                    openAddModal
                  }
                >
                  ＋ Tambah Kamar
                </button>
              )}

          </div>

        ) : (

          /* =================================================
             TABLE
          ================================================= */

          <div className="rooms-table-wrapper">

            <table className="rooms-table">

              <thead>

                <tr>
                  <th>NO</th>
                  <th>KAMAR</th>
                  <th>KOST</th>
                  <th>HARGA / BULAN</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>

              </thead>


              <tbody>

                {filteredRooms.map(
                  (room, index) => {

                    const visualStatus =
                      getRoomVisualStatus(
                        room
                      );

                    return (
                      <tr
                        key={room.id}
                      >

                        <td>
                          {index + 1}
                        </td>


                        <td>

                          <div className="room-number">

                            <div className="room-number-icon">
                              ▦
                            </div>

                            <strong>
                              {room.room_number}
                            </strong>

                          </div>

                        </td>


                        <td>

                          <div className="room-kost">
                            {room.kost?.name ||
                              activeKost?.name ||
                              "-"}
                          </div>

                        </td>


                        <td>

                          <strong className="room-price">
                            {formatPrice(
                              room.price
                            )}
                          </strong>

                        </td>


                        <td>

                          <span
                            className={`room-status ${visualStatus}`}
                          >

                            <span></span>

                            {getStatusLabel(
                              visualStatus
                            )}

                          </span>

                        </td>


                        <td>

                          <div className="room-actions">

                            <button
                              className="room-action edit"
                              onClick={() =>
                                openEditModal(
                                  room
                                )
                              }
                              title="Edit kamar"
                            >
                              ✎
                            </button>


                            <button
                              className="room-action delete"
                              onClick={() =>
                                handleDelete(
                                  room
                                )
                              }
                              title="Hapus kamar"
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
          className="rooms-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="rooms-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="rooms-modal-header">

              <div>

                <span className="rooms-modal-eyebrow">
                  {editingRoom
                    ? "EDIT DATA"
                    : "DATA BARU"}
                </span>

                <h2>
                  {editingRoom
                    ? "Edit Kamar"
                    : "Tambah Kamar"}
                </h2>

              </div>


              <button
                className="rooms-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>


            {/* FORM */}

            <form
              className="rooms-form"
              onSubmit={handleSubmit}
            >

              {/* =================================================
                  KOST
              ================================================= */}

              <div className="rooms-form-group">

              <label className="rooms-form-label">
                Kost
              </label>

              <div className="rooms-selected-kost">

                <div className="rooms-selected-kost-icon">
                  ▦
                </div>

                <div className="rooms-selected-kost-info">

                  <strong>
                    {editingRoom
                      ? editingRoom.kost?.name ||
                        activeKost?.name ||
                        "Belum ada Kost"
                      : activeKost?.name ||
                        "Belum ada Kost"}
                  </strong>

                  <span>
                    {editingRoom
                      ? editingRoom.kost?.city ||
                        activeKost?.city ||
                        "Lokasi kost belum tersedia"
                      : activeKost?.city ||
                        "Lokasi kost belum tersedia"}
                  </span>

                </div>

                <div className="rooms-selected-kost-check">
                  ✓
                </div>

              </div>

            </div>


              {/* =================================================
                  NOMOR KAMAR
              ================================================= */}

              <div className="rooms-form-group">

                <label>
                  Nomor Kamar
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="room_number"
                  value={
                    form.room_number
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Contoh: A01"
                  disabled={saving}
                  required
                />

              </div>


              {/* =================================================
                  HARGA
              ================================================= */}

              <div className="rooms-form-group">

                <label>
                  Harga per Bulan
                  <span>*</span>
                </label>

                <div className="rooms-price-input">

                  <span>Rp</span>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={
                      handleChange
                    }
                    placeholder="750000"
                    min="1"
                    disabled={saving}
                    required
                  />

                </div>

              </div>


              {/* =================================================
                  STATUS
              ================================================= */}

              <div className="rooms-form-group">

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
                  disabled={saving}
                  required
                >

                  <option value="available">
                    Tersedia
                  </option>

                  <option value="occupied">
                    Terisi
                  </option>

                  <option value="maintenance">
                    Perbaikan
                  </option>

                </select>

              </div>


              {/* =================================================
                  ACTION
              ================================================= */}

              <div className="rooms-form-actions">

                <button
                  type="button"
                  className="rooms-cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  Batal
                </button>


                <button
                  type="submit"
                  className="rooms-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Menyimpan..."
                    : editingRoom
                    ? "Simpan Perubahan"
                    : "Tambah Kamar"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Rooms;