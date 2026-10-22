import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./Payments.css";

function Payments() {
  const [bills, setBills] = useState([]);

  const [activeKostId, setActiveKostId] = useState(
    localStorage.getItem("active_kost_id") || ""
  );

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedBill, setSelectedBill] = useState(null);

  const [toast, setToast] = useState({
    show: false,
    type: "",
    message: "",
  });

  // =====================================================
  // AMBIL DATA TAGIHAN
  // =====================================================

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
          "Gagal mengambil data pembayaran."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL FETCH + ACTIVE KOST
  // =====================================================

  useEffect(() => {
    fetchBills();

    const handleActiveKostChanged = () => {
      const kostId =
        localStorage.getItem("active_kost_id") || "";

      setActiveKostId(kostId);

      // Reset pencarian/filter ketika pindah kost
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

  // =====================================================
  // FORMAT RUPIAH
  // =====================================================

  const formatRupiah = (amount) => {
    return `Rp ${Number(amount || 0).toLocaleString(
      "id-ID"
    )}`;
  };

  // =====================================================
  // FORMAT TANGGAL
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // STATUS
  // =====================================================

  const getStatusLabel = (status) => {
    switch (status) {
      case "unpaid":
        return "Belum Bayar";

      case "pending":
        return "Menunggu Verifikasi";

      case "paid":
        return "Lunas";

      case "rejected":
        return "Ditolak";

      default:
        return "-";
    }
  };

  // =====================================================
  // TAGIHAN KOST AKTIF
  // =====================================================

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

  // =====================================================
  // FILTER DATA
  // =====================================================

  const filteredBills = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return activeBills.filter((bill) => {
      const tenantName =
        bill.tenant?.user?.name?.toLowerCase() || "";

      const tenantNik =
        bill.tenant?.user?.nik?.toLowerCase() || "";

      const roomNumber =
        bill.tenant?.room?.room_number?.toLowerCase() ||
        "";

      const kostName =
        bill.tenant?.kost?.name?.toLowerCase() || "";

      const title =
        bill.title?.toLowerCase() || "";

      const period =
        bill.period?.toLowerCase() || "";

      const matchesSearch =
        tenantName.includes(keyword) ||
        tenantNik.includes(keyword) ||
        roomNumber.includes(keyword) ||
        kostName.includes(keyword) ||
        title.includes(keyword) ||
        period.includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        bill.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    activeBills,
    search,
    statusFilter,
  ]);

  // =====================================================
  // STATISTIK
  // =====================================================

  const totalBills = activeBills.length;

  const unpaidCount = activeBills.filter(
    (bill) => bill.status === "unpaid"
  ).length;

  const pendingCount = activeBills.filter(
    (bill) => bill.status === "pending"
  ).length;

  const paidCount = activeBills.filter(
    (bill) => bill.status === "paid"
  ).length;

  // =====================================================
  // UPDATE STATUS PEMBAYARAN
  // =====================================================

  const updateBillStatus = async (
    bill,
    status
  ) => {
    if (!bill?.id) return;

    const tenantName =
      bill.tenant?.user?.name ||
      "penghuni";

    const action =
      status === "paid"
        ? "mengonfirmasi"
        : "menolak";

    const confirmed = window.confirm(
      `Yakin ingin ${action} pembayaran ${tenantName}?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(bill.id);

      await api.put(
        `/owner/bills/${bill.id}/status`,
        {
          status,
        }
      );

      setSelectedBill(null);

      // Beri tahu halaman lain
      window.dispatchEvent(
        new Event("bill-status-updated")
      );

      showToast(
        "success",
        status === "paid"
          ? "Pembayaran berhasil dikonfirmasi."
          : "Pembayaran berhasil ditolak."
      );

      // Refresh data setelah update
      await fetchBills();

    } catch (error) {
      console.error(
        "Gagal mengubah status pembayaran:",
        error
      );

      showToast(
        "error",
        error.response?.data?.message ||
          "Gagal mengubah status pembayaran."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // =====================================================
  // URL BUKTI PEMBAYARAN
  // =====================================================

  const getProofUrl = (path) => {
    if (!path) return "";

    if (
      path.startsWith("http://") ||
      path.startsWith("https://")
    ) {
      return path;
    }

    const baseURL =
      api.defaults?.baseURL || "";

    return `${baseURL.replace(
      /\/api\/?$/,
      ""
    )}/storage/${path
      .replace(/^storage\//, "")
      .replace(/^\//, "")}`;
  };

  // =====================================================
  // CEK FILE GAMBAR
  // =====================================================

  const isImageFile = (path) => {
    if (!path) return false;

    const extension = path
      .split("?")[0]
      .split(".")
      .pop()
      .toLowerCase();

    return [
      "jpg",
      "jpeg",
      "png",
      "webp",
    ].includes(extension);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="payments-page">

      {/* =================================================
          TOAST
      ================================================= */}

      {toast.show && (
        <div
          className={`payments-toast ${toast.type}`}
        >
          <span className="payments-toast-icon">
            {toast.type === "success"
              ? "✓"
              : "!"}
          </span>

          <span>
            {toast.message}
          </span>
        </div>
      )}

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="payments-header">

        <div>

          <span className="payments-eyebrow">
            MANAJEMEN PEMBAYARAN
          </span>

          <h1>
            Pembayaran
          </h1>

          <p>
            Periksa pembayaran dan verifikasi
            bukti pembayaran penghuni.
          </p>

        </div>

        <button
          className="payments-refresh-btn"
          onClick={fetchBills}
          disabled={loading}
        >
          <span>↻</span>

          {loading
            ? "Memuat..."
            : "Perbarui Data"}
        </button>

      </div>

      {/* =================================================
          STATISTIK
      ================================================= */}

      <div className="payments-stat-grid">

        <div className="payments-stat-card">

          <div className="payments-stat-icon total">
            ◫
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

        <div className="payments-stat-card">

          <div className="payments-stat-icon unpaid">
            !
          </div>

          <div>
            <span>
              Belum Bayar
            </span>

            <strong>
              {unpaidCount}
            </strong>
          </div>

        </div>

        <div className="payments-stat-card">

          <div className="payments-stat-icon pending">
            ◷
          </div>

          <div>
            <span>
              Menunggu Verifikasi
            </span>

            <strong>
              {pendingCount}
            </strong>
          </div>

        </div>

        <div className="payments-stat-card">

          <div className="payments-stat-icon paid">
            ✓
          </div>

          <div>
            <span>
              Lunas
            </span>

            <strong>
              {paidCount}
            </strong>
          </div>

        </div>

      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="payments-card">

        {/* TOOLBAR */}

        <div className="payments-toolbar">

          <div className="payments-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Cari penghuni, NIK, kamar, tagihan..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          <select
            className="payments-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >

            <option value="all">
              Semua Status
            </option>

            <option value="unpaid">
              Belum Bayar
            </option>

            <option value="pending">
              Menunggu Verifikasi
            </option>

            <option value="paid">
              Lunas
            </option>

            <option value="rejected">
              Ditolak
            </option>

          </select>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="payments-loading">

            <div className="payments-spinner"></div>

            <span>
              Memuat data pembayaran...
            </span>

          </div>

        ) : filteredBills.length === 0 ? (

          /* =================================================
              EMPTY
          ================================================= */

          <div className="payments-empty">

            <div className="payments-empty-icon">
              ◫
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

          /* =================================================
              TABLE
          ================================================= */

          <div className="payments-table-wrapper">

            <table className="payments-table">

              <thead>

                <tr>
                  <th>NO</th>
                  <th>PENGHUNI</th>
                  <th>TAGIHAN</th>
                  <th>PERIODE</th>
                  <th>NOMINAL</th>
                  <th>JATUH TEMPO</th>
                  <th>STATUS</th>
                  <th>BUKTI</th>
                  <th>AKSI</th>
                </tr>

              </thead>

              <tbody>

                {filteredBills.map(
                  (bill, index) => {

                    const tenantName =
                      bill.tenant?.user?.name ||
                      "-";

                    const tenantNik =
                      bill.tenant?.user?.nik ||
                      "-";

                    const roomNumber =
                      bill.tenant?.room
                        ?.room_number ||
                      "-";

                    const isProcessing =
                      processingId ===
                      bill.id;

                    return (
                      <tr
                        key={bill.id}
                      >

                        {/* NO */}

                        <td className="payments-number">
                          {index + 1}
                        </td>

                        {/* PENGHUNI */}

                        <td>

                          <div className="payments-tenant">

                            <div className="payments-avatar">
                              {tenantName
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="payments-tenant-info">

                              <strong>
                                {tenantName}
                              </strong>

                              <small>
                                NIK: {tenantNik}
                              </small>

                              <small>
                                Kamar{" "}
                                {roomNumber}
                              </small>

                            </div>

                          </div>

                        </td>

                        {/* TAGIHAN */}

                        <td>

                          <div className="payments-bill-title">
                            {bill.title ||
                              "-"}
                          </div>

                        </td>

                        {/* PERIODE */}

                        <td>
                          {bill.period ||
                            "-"}
                        </td>

                        {/* NOMINAL */}

                        <td>

                          <strong className="payments-amount">
                            {formatRupiah(
                              bill.amount
                            )}
                          </strong>

                        </td>

                        {/* JATUH TEMPO */}

                        <td>
                          {formatDate(
                            bill.due_date
                          )}
                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`payments-status ${bill.status}`}
                          >

                            <span className="payments-status-dot"></span>

                            {getStatusLabel(
                              bill.status
                            )}

                          </span>

                        </td>

                        {/* BUKTI */}

                        <td>

                          {bill.payment_proof ? (

                            <button
                              className="payments-proof-btn"
                              onClick={() =>
                                setSelectedBill(
                                  bill
                                )
                              }
                            >
                              Lihat Bukti
                            </button>

                          ) : (

                            <span className="payments-no-proof">
                              Belum ada
                            </span>

                          )}

                        </td>

                        {/* AKSI */}

                        <td>

                          {bill.status ===
                          "pending" ? (

                            <div className="payments-actions">

                              <button
                                className="payments-action approve"
                                onClick={() =>
                                  updateBillStatus(
                                    bill,
                                    "paid"
                                  )
                                }
                                disabled={
                                  isProcessing
                                }
                                title="Konfirmasi pembayaran"
                              >
                                ✓
                              </button>

                              <button
                                className="payments-action reject"
                                onClick={() =>
                                  updateBillStatus(
                                    bill,
                                    "rejected"
                                  )
                                }
                                disabled={
                                  isProcessing
                                }
                                title="Tolak pembayaran"
                              >
                                ×
                              </button>

                            </div>

                          ) : (

                            <span className="payments-no-action">
                              —
                            </span>

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

      {/* =================================================
          MODAL BUKTI PEMBAYARAN
      ================================================= */}

      {selectedBill && (

        <div
          className="payments-modal-overlay"
          onClick={() =>
            setSelectedBill(null)
          }
        >

          <div
            className="payments-proof-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="payments-modal-header">

              <div>

                <span className="payments-modal-eyebrow">
                  BUKTI PEMBAYARAN
                </span>

                <h2>
                  {selectedBill.tenant?.user
                    ?.name ||
                    "Penghuni"}
                </h2>

              </div>

              <button
                className="payments-modal-close"
                onClick={() =>
                  setSelectedBill(null)
                }
              >
                ×
              </button>

            </div>

            {/* INFO TAGIHAN */}

            <div className="payments-proof-info">

              <div>
                <span>
                  Tagihan
                </span>

                <strong>
                  {selectedBill.title ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>
                  Periode
                </span>

                <strong>
                  {selectedBill.period ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>
                  Nominal
                </span>

                <strong>
                  {formatRupiah(
                    selectedBill.amount
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Jatuh Tempo
                </span>

                <strong>
                  {formatDate(
                    selectedBill.due_date
                  )}
                </strong>
              </div>

            </div>

            {/* BUKTI */}

            <div className="payments-proof-preview">

              {isImageFile(
                selectedBill.payment_proof
              ) ? (

                <img
                  src={getProofUrl(
                    selectedBill.payment_proof
                  )}
                  alt="Bukti pembayaran"
                />

              ) : (

                <div className="payments-file-preview">

                  <div className="payments-file-icon">
                    PDF
                  </div>

                  <strong>
                    Bukti pembayaran
                  </strong>

                  <a
                    href={getProofUrl(
                      selectedBill.payment_proof
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="payments-open-file"
                  >
                    Buka File
                  </a>

                </div>

              )}

            </div>

            {/* MODAL ACTION */}

            {selectedBill.status ===
              "pending" && (

              <div className="payments-proof-actions">

                <button
                  className="payments-reject-btn"
                  onClick={() =>
                    updateBillStatus(
                      selectedBill,
                      "rejected"
                    )
                  }
                  disabled={
                    processingId ===
                    selectedBill.id
                  }
                >
                  Tolak Pembayaran
                </button>

                <button
                  className="payments-approve-btn"
                  onClick={() =>
                    updateBillStatus(
                      selectedBill,
                      "paid"
                    )
                  }
                  disabled={
                    processingId ===
                    selectedBill.id
                  }
                >
                  ✓ Konfirmasi Pembayaran
                </button>

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default Payments;