import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./Billing.css";

function Billing() {
  const [bills, setBills] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [activeKostId, setActiveKostId] = useState(
    localStorage.getItem("active_kost_id") || ""
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    tenant_id: "",
    title: "Sewa Kost",
    amount: "",
    due_date: "",
    period: "",
  });

  const [toast, setToast] = useState({
    show: false,
    type: "",
    message: "",
  });

  /* =========================
     TOAST
  ========================= */

  const showToast = (type, message) => {
    setToast({
      show: true,
      type,
      message,
    });

    setTimeout(() => {
      setToast({
        show: false,
        type: "",
        message: "",
      });
    }, 3000);
  };

  /* =========================
     FETCH BILLS
  ========================= */

  const fetchBills = async () => {
    try {
      setLoading(true);

      const response = await api.get("/owner/bills");

      setBills(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      );
    } catch (error) {
      console.error(
        "Gagal mengambil data tagihan:",
        error
      );

      showToast(
        "error",
        error.response?.data?.message ||
          "Gagal mengambil data tagihan."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     FETCH TENANTS
  ========================= */

  const fetchTenants = async () => {
    try {
      const response = await api.get("/owner/tenants");

      setTenants(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      );
    } catch (error) {
      console.error(
        "Gagal mengambil data penghuni:",
        error
      );

      showToast(
        "error",
        error.response?.data?.message ||
          "Gagal mengambil data penghuni."
      );
    }
  };

  /* =========================
     INITIAL FETCH
  ========================= */

  useEffect(() => {
    fetchBills();
    fetchTenants();

    const handleActiveKostChanged = () => {
      const kostId =
        localStorage.getItem("active_kost_id") || "";

      setActiveKostId(kostId);

      // Reset pencarian dan filter
      setSearch("");
      setFilter("all");

      // Reset pilihan penghuni
      setForm((prev) => ({
        ...prev,
        tenant_id: "",
      }));

      // Tutup modal jika sedang terbuka
      setShowModal(false);
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

  /* =========================
     TENANTS KOST AKTIF
  ========================= */

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
  }, [tenants, activeKostId]);

  /* =========================
     BILLS KOST AKTIF
  ========================= */

  const activeBills = useMemo(() => {
    if (!activeKostId) {
      return [];
    }

    return bills.filter((bill) => {
      const billKostId =
        bill.tenant?.kost_id ||
        bill.tenant?.kost?.id;

      return (
        String(billKostId) ===
        String(activeKostId)
      );
    });
  }, [bills, activeKostId]);

  /* =========================
     FILTER
  ========================= */

  const filteredBills = useMemo(() => {
    const keyword = search
      .toLowerCase()
      .trim();

    return activeBills.filter((bill) => {
      const tenantName =
        bill.tenant?.user?.name?.toLowerCase() ||
        "";

      const nik =
        bill.tenant?.user?.nik?.toLowerCase() ||
        "";

      const room =
        bill.tenant?.room?.room_number?.toLowerCase() ||
        "";

      const kost =
        bill.tenant?.kost?.name?.toLowerCase() ||
        "";

      const title =
        bill.title?.toLowerCase() || "";

      const period =
        bill.period?.toLowerCase() || "";

      const matchesSearch =
        tenantName.includes(keyword) ||
        nik.includes(keyword) ||
        room.includes(keyword) ||
        kost.includes(keyword) ||
        title.includes(keyword) ||
        period.includes(keyword);

      const matchesFilter =
        filter === "all" ||
        bill.status === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [
    activeBills,
    search,
    filter,
  ]);

  /* =========================
     STATISTICS
  ========================= */

  const totalBills = activeBills.length;

  const unpaidBills = activeBills.filter(
    (bill) => bill.status === "unpaid"
  ).length;

  const rejectedBills = activeBills.filter(
    (bill) => bill.status === "rejected"
  ).length;

  const pendingBills = activeBills.filter(
    (bill) => bill.status === "pending"
  ).length;

  /* =========================
     HELPERS
  ========================= */

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (
      Number.isNaN(parsedDate.getTime())
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const isOverdue = (bill) => {
    if (!bill.due_date) return false;

    if (
      bill.status === "paid" ||
      bill.status === "pending"
    ) {
      return false;
    }

    const today = new Date();
    const dueDate = new Date(
      bill.due_date
    );

    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today;
  };

  const getStatusLabel = (status) => {
    const labels = {
      unpaid: "Belum Bayar",
      pending: "Menunggu Verifikasi",
      paid: "Lunas",
      rejected: "Ditolak",
    };

    return labels[status] || status;
  };

  /* =========================
     FORM
  ========================= */

  const handleFormChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      tenant_id: "",
      title: "Sewa Kost",
      amount: "",
      due_date: "",
      period: "",
    });
  };

  const openModal = () => {
    if (!activeKostId) {
      showToast(
        "error",
        "Pilih Kost Aktif terlebih dahulu."
      );
      return;
    }

    if (activeTenants.length === 0) {
      showToast(
        "error",
        "Belum ada penghuni pada Kost Aktif."
      );
      return;
    }

    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  /* =========================
     CREATE BILL
  ========================= */

  const handleCreateBill = async (e) => {
    e.preventDefault();

    if (!activeKostId) {
      showToast(
        "error",
        "Kost Aktif belum dipilih."
      );
      return;
    }

    if (!form.tenant_id) {
      showToast(
        "error",
        "Silakan pilih penghuni terlebih dahulu."
      );
      return;
    }

    const selectedTenant =
      activeTenants.find(
        (tenant) =>
          String(tenant.id) ===
          String(form.tenant_id)
      );

    if (!selectedTenant) {
      showToast(
        "error",
        "Penghuni tidak termasuk dalam Kost Aktif."
      );
      return;
    }

    if (!form.title.trim()) {
      showToast(
        "error",
        "Judul tagihan wajib diisi."
      );
      return;
    }

    if (
      !form.amount ||
      Number(form.amount) < 0
    ) {
      showToast(
        "error",
        "Nominal tagihan tidak valid."
      );
      return;
    }

    if (!form.due_date) {
      showToast(
        "error",
        "Jatuh tempo wajib diisi."
      );
      return;
    }

    if (!form.period.trim()) {
      showToast(
        "error",
        "Periode wajib diisi."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await api.post(
        "/owner/bills",
        {
          tenant_id: Number(
            form.tenant_id
          ),
          title: form.title,
          amount: Number(
            form.amount
          ),
          due_date: form.due_date,
          period: form.period,
        }
      );

      showToast(
        "success",
        response.data?.message ||
          "Tagihan berhasil dibuat."
      );

      setShowModal(false);
      resetForm();

      await fetchBills();

    } catch (error) {
      console.error(
        "Gagal membuat tagihan:",
        error
      );

      showToast(
        "error",
        error.response?.data?.message ||
          "Gagal membuat tagihan."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     REMINDER
  ========================= */

  const handleReminder = async (
    bill
  ) => {
    if (bill.status === "paid") {
      showToast(
        "error",
        "Tagihan yang sudah lunas tidak perlu ditagih."
      );
      return;
    }

    const tenantName =
      bill.tenant?.user?.name ||
      "penghuni";

    const confirmed = window.confirm(
      `Kirim pengingat tagihan kepada ${tenantName}?\n\n` +
        `${bill.title || "Tagihan"} - ${formatRupiah(
          bill.amount
        )}`
    );

    if (!confirmed) return;

    try {
      setSendingId(bill.id);

      const response =
        await api.post(
          `/owner/bills/${bill.id}/reminder`
        );

      showToast(
        "success",
        response.data?.message ||
          "Pengingat tagihan berhasil dikirim."
      );

    } catch (error) {
      console.error(
        "Gagal mengirim pengingat:",
        error
      );

      showToast(
        "error",
        error.response?.data?.message ||
          "Gagal mengirim pengingat."
      );
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="billing-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="billing-header">

        <div>

          <span className="billing-eyebrow">
            MANAJEMEN TAGIHAN
          </span>

          <h1>
            Penagihan
          </h1>

          <p>
            Buat tagihan dan kirim pengingat
            kepada penghuni.
          </p>

        </div>

        <button
          className="billing-add-btn"
          onClick={openModal}
          disabled={
            !activeKostId ||
            activeTenants.length === 0
          }
        >
          <span>＋</span>
          Buat Tagihan
        </button>

      </div>

      {/* =========================
          STATISTICS
      ========================= */}

      <div className="billing-stats">

        <div className="billing-stat-card">

          <div className="billing-stat-icon">
            ≡
          </div>

          <div>
            <span>
              Total Tagihan
            </span>

            <strong>
              {totalBills}
            </strong>
          </div>

        </div>

        <div className="billing-stat-card warning">

          <div className="billing-stat-icon">
            !
          </div>

          <div>
            <span>
              Belum Bayar
            </span>

            <strong>
              {unpaidBills}
            </strong>
          </div>

        </div>

        <div className="billing-stat-card pending">

          <div className="billing-stat-icon">
            ◷
          </div>

          <div>
            <span>
              Menunggu Verifikasi
            </span>

            <strong>
              {pendingBills}
            </strong>
          </div>

        </div>

        <div className="billing-stat-card danger">

          <div className="billing-stat-icon">
            ×
          </div>

          <div>
            <span>
              Ditolak
            </span>

            <strong>
              {rejectedBills}
            </strong>
          </div>

        </div>

      </div>

      {/* =========================
          TOOLBAR
      ========================= */}

      <div className="billing-toolbar">

        <div className="billing-search">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Cari penghuni, kamar, tagihan..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <div className="billing-filter">

          <button
            className={
              filter === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("all")
            }
          >
            Semua
          </button>

          <button
            className={
              filter === "unpaid"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("unpaid")
            }
          >
            Belum Bayar
          </button>

          <button
            className={
              filter === "pending"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("pending")
            }
          >
            Menunggu
          </button>

          <button
            className={
              filter === "rejected"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("rejected")
            }
          >
            Ditolak
          </button>

        </div>

      </div>

      {/* =========================
          TABLE CARD
      ========================= */}

      <div className="billing-card">

        <div className="billing-card-header">

          <div>

            <h2>
              Daftar Tagihan
            </h2>

            <span>
              {filteredBills.length} tagihan ditemukan
            </span>

          </div>

        </div>

        {loading ? (

          <div className="billing-loading">

            <div className="billing-spinner"></div>

            <p>
              Memuat data tagihan...
            </p>

          </div>

        ) : filteredBills.length === 0 ? (

          <div className="billing-empty">

            <div className="billing-empty-icon">
              ✓
            </div>

            <h3>
              {!activeKostId
                ? "Belum Ada Kost Aktif"
                : activeBills.length === 0
                ? "Belum Ada Tagihan"
                : "Data Tidak Ditemukan"}
            </h3>

            <p>
              {!activeKostId
                ? "Pilih Kost Aktif dari sidebar terlebih dahulu."
                : activeBills.length === 0
                ? "Belum ada tagihan untuk kost yang sedang aktif."
                : "Coba ubah kata kunci atau filter status."}
            </p>

          </div>

        ) : (

          <div className="billing-table-wrapper">

            <table className="billing-table">

              <thead>

                <tr>
                  <th>NO</th>
                  <th>PENGHUNI</th>
                  <th>TAGIHAN</th>
                  <th>PERIODE</th>
                  <th>NOMINAL</th>
                  <th>JATUH TEMPO</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>

              </thead>

              <tbody>

                {filteredBills.map(
                  (bill, index) => {

                    const tenantName =
                      bill.tenant?.user?.name ||
                      "Penghuni";

                    const room =
                      bill.tenant?.room
                        ?.room_number ||
                      "-";

                    const overdue =
                      isOverdue(bill);

                    return (
                      <tr
                        key={bill.id}
                      >

                        <td className="billing-number">
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </td>

                        <td>

                          <div className="billing-tenant">

                            <div className="billing-avatar">
                              {tenantName
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {tenantName}
                              </strong>

                              <span>
                                Kamar{" "}
                                {room}
                              </span>

                            </div>

                          </div>

                        </td>

                        <td>

                          <div className="billing-title">

                            <strong>
                              {bill.title ||
                                "-"}
                            </strong>

                            <span>
                              {bill.tenant
                                ?.kost?.name ||
                                "-"}
                            </span>

                          </div>

                        </td>

                        <td>

                          <span className="billing-period">
                            {bill.period ||
                              "-"}
                          </span>

                        </td>

                        <td>

                          <strong className="billing-amount">
                            {formatRupiah(
                              bill.amount
                            )}
                          </strong>

                        </td>

                        <td>

                          <div
                            className={`billing-due ${
                              overdue
                                ? "overdue"
                                : ""
                            }`}
                          >

                            <span>
                              {formatDate(
                                bill.due_date
                              )}
                            </span>

                            {overdue && (
                              <small>
                                Terlambat
                              </small>
                            )}

                          </div>

                        </td>

                        <td>

                          <span
                            className={`billing-status ${bill.status}`}
                          >

                            <i></i>

                            {getStatusLabel(
                              bill.status
                            )}

                          </span>

                        </td>

                        <td>

                          {bill.status ===
                          "paid" ? (

                            <span className="billing-no-action">
                              —
                            </span>

                          ) : (

                            <button
                              className="billing-reminder-btn"
                              onClick={() =>
                                handleReminder(
                                  bill
                                )
                              }
                              disabled={
                                sendingId ===
                                bill.id
                              }
                            >
                              {sendingId ===
                              bill.id
                                ? "Mengirim..."
                                : "Kirim Pengingat"}
                            </button>

                          )}

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

      {/* =========================
          MODAL BUAT TAGIHAN
      ========================= */}

      {showModal && (

        <div
          className="billing-modal-overlay"
          onMouseDown={(e) => {

            if (
              e.target ===
                e.currentTarget &&
              !saving
            ) {
              closeModal();
            }

          }}
        >

          <div className="billing-modal">

            <div className="billing-modal-header">

              <div>

                <span className="billing-modal-eyebrow">
                  TAGIHAN BARU
                </span>

                <h2>
                  Buat Tagihan
                </h2>

                <p>
                  Buat tagihan untuk
                  penghuni kost.
                </p>

              </div>

              <button
                className="billing-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleCreateBill
              }
              className="billing-form"
            >

              {/* PENGHUNI */}

              <div className="billing-form-group">

                <label>
                  Penghuni
                  <span>*</span>
                </label>

                <select
                  name="tenant_id"
                  value={
                    form.tenant_id
                  }
                  onChange={
                    handleFormChange
                  }
                  required
                >

                  <option value="">
                    Pilih penghuni
                  </option>

                  {activeTenants.map(
                    (tenant) => (

                      <option
                        key={
                          tenant.id
                        }
                        value={
                          tenant.id
                        }
                      >

                        {tenant.user
                          ?.name ||
                          "Penghuni"}{" "}
                        — Kamar{" "}
                        {tenant.room
                          ?.room_number ||
                          "-"}

                      </option>

                    )
                  )}

                </select>

              </div>

              {/* JUDUL */}

              <div className="billing-form-group">

                <label>
                  Judul Tagihan
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="title"
                  value={
                    form.title
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder="Contoh: Sewa Kost"
                  required
                />

              </div>

              {/* NOMINAL */}

              <div className="billing-form-group">

                <label>
                  Nominal
                  <span>*</span>
                </label>

                <div className="billing-input-prefix">

                  <span>Rp</span>

                  <input
                    type="number"
                    name="amount"
                    value={
                      form.amount
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="750000"
                    min="0"
                    required
                  />

                </div>

              </div>

              <div className="billing-form-row">

                {/* PERIODE */}

                <div className="billing-form-group">

                  <label>
                    Periode
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="period"
                    value={
                      form.period
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Oktober 2026"
                    required
                  />

                </div>

                {/* JATUH TEMPO */}

                <div className="billing-form-group">

                  <label>
                    Jatuh Tempo
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="due_date"
                    value={
                      form.due_date
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  />

                </div>

              </div>

              {/* FOOTER */}

              <div className="billing-modal-footer">

                <button
                  type="button"
                  className="billing-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="billing-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Menyimpan..."
                    : "Buat Tagihan"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* TOAST */}

      {toast.show && (

        <div
          className={`billing-toast ${toast.type}`}
        >

          <span>
            {toast.type ===
            "success"
              ? "✓"
              : "!"}
          </span>

          <p>
            {toast.message}
          </p>

        </div>

      )}

    </div>
  );
}

export default Billing;