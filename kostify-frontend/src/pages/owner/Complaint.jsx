import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./Complaint.css";

function Complaint() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

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
     FETCH COMPLAINTS
  ========================= */
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get("/owner/complaints");
      setComplaints(response.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil data komplain:", error);
      showToast(
        "error",
        error.response?.data?.message || "Gagal mengambil data komplain."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  /* =========================
     SEARCH FILTER
  ========================= */
  const filteredComplaints = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return complaints;

    return complaints.filter((complaint) => {
      const title = complaint.title?.toLowerCase() || "";
      const description = complaint.description?.toLowerCase() || "";
      const tenantName = complaint.tenant?.user?.name?.toLowerCase() || "";
      const nik = complaint.tenant?.user?.nik?.toLowerCase() || "";
      const room = complaint.tenant?.room?.room_number?.toLowerCase() || "";
      const kost = complaint.tenant?.kost?.name?.toLowerCase() || "";

      return (
        title.includes(keyword) ||
        description.includes(keyword) ||
        tenantName.includes(keyword) ||
        nik.includes(keyword) ||
        room.includes(keyword) ||
        kost.includes(keyword)
      );
    });
  }, [complaints, search]);

  /* =========================
     STATISTICS
  ========================= */
  const totalComplaints = complaints.length;

  const submittedComplaints = complaints.filter(
    (item) => item.status === "submitted"
  ).length;

  const readComplaints = complaints.filter(
    (item) => item.status === "read"
  ).length;

  const resolvedComplaints = complaints.filter(
    (item) => item.status === "resolved"
  ).length;

  /* =========================
     HELPERS
  ========================= */
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      submitted: "Baru",
      read: "Sudah Dibaca",
      resolved: "Selesai",
    };
    return labels[status] || status;
  };

  return (
    <div className="complaint-page">
      {/* HEADER */}
      <div className="complaint-header">
        <div>
          <span className="complaint-eyebrow">LAYANAN PENGHUNI</span>
          <h1>Komplain Penghuni</h1>
          <p>Pantau laporan dan kendala yang dialami oleh penghuni hunian kost.</p>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="complaint-stats">
        <div className="complaint-stat-card">
          <div className="complaint-stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <span>Total Komplain</span>
            <strong>{totalComplaints}</strong>
          </div>
        </div>

        <div className="complaint-stat-card new">
          <div className="complaint-stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div>
            <span>Komplain Baru</span>
            <strong>{submittedComplaints}</strong>
          </div>
        </div>

        <div className="complaint-stat-card read">
          <div className="complaint-stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <span>Sudah Dibaca</span>
            <strong>{readComplaints}</strong>
          </div>
        </div>

        <div className="complaint-stat-card resolved">
          <div className="complaint-stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div>
            <span>Selesai</span>
            <strong>{resolvedComplaints}</strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="complaint-toolbar">
        <div className="complaint-search">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Cari komplain, nama penghuni, kamar, atau kos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="complaint-search-clear"
              onClick={() => setSearch("")}
              title="Hapus pencarian"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* CONTENT TABLE CARD */}
      <div className="complaint-card">
        <div className="complaint-card-header">
          <div>
            <h2>Daftar Komplain Masuk</h2>
            <span>
              {filteredComplaints.length} komplain ditemukan
              {search && ` untuk kata kunci "${search}"`}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="complaint-loading">
            <div className="complaint-spinner"></div>
            <p>Memuat data komplain...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="complaint-empty">
            <div className="complaint-empty-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3>Belum Ada Komplain</h3>
            <p>
              {search
                ? `Tidak ditemukan komplain yang cocok dengan kata kunci "${search}".`
                : "Semua fasilitas aman dan belum ada laporan keluhan dari penghuni."}
            </p>
          </div>
        ) : (
          <div className="complaint-table-wrapper">
            <table className="complaint-table">
              <thead>
                <tr>
                  <th>NO</th>
                  <th>PENGHUNI</th>
                  <th>KOMPLAIN</th>
                  <th>KAMAR</th>
                  <th>TANGGAL</th>
                  <th>STATUS</th>
                  <th>AKSI</th>
                </tr>
              </thead>

              <tbody>
                {filteredComplaints.map((complaint, index) => {
                  const tenantName = complaint.tenant?.user?.name || "Penghuni";
                  const room = complaint.tenant?.room?.room_number || "-";

                  return (
                    <tr key={complaint.id}>
                      <td className="complaint-number">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      {/* PENGHUNI */}
                      <td>
                        <div className="complaint-tenant">
                          <div className="complaint-avatar">
                            {tenantName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{tenantName}</strong>
                            <span>{complaint.tenant?.kost?.name || "-"}</span>
                          </div>
                        </div>
                      </td>

                      {/* KOMPLAIN */}
                      <td>
                        <div className="complaint-title">
                          <strong>{complaint.title || "-"}</strong>
                          <span>{complaint.description || "-"}</span>
                        </div>
                      </td>

                      {/* KAMAR */}
                      <td>
                        <span className="complaint-room">{room}</span>
                      </td>

                      {/* TANGGAL */}
                      <td>
                        <div className="complaint-date">
                          <span>{formatDate(complaint.created_at)}</span>
                          <small>{formatTime(complaint.created_at)}</small>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span className={`complaint-status ${complaint.status}`}>
                          <i></i>
                          {getStatusLabel(complaint.status)}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td>
                        <button
                          className="complaint-view-btn"
                          onClick={() => setSelectedComplaint(complaint)}
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedComplaint && (
        <div
          className="complaint-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedComplaint(null);
            }
          }}
        >
          <div className="complaint-modal">
            <div className="complaint-modal-header">
              <div>
                <span className="complaint-modal-eyebrow">DETAIL KOMPLAIN</span>
                <h2>{selectedComplaint.title || "Laporan Komplain"}</h2>
              </div>

              <button
                className="complaint-modal-close"
                onClick={() => setSelectedComplaint(null)}
                title="Tutup"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="complaint-modal-body">
              {/* USER */}
              <div className="complaint-detail-person">
                <div className="complaint-detail-avatar">
                  {(selectedComplaint.tenant?.user?.name || "P")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <strong>
                    {selectedComplaint.tenant?.user?.name || "Penghuni"}
                  </strong>
                  <span>
                    Kamar {selectedComplaint.tenant?.room?.room_number || "-"}
                  </span>
                </div>
              </div>

              {/* INFO GRID */}
              <div className="complaint-detail-grid">
                <div>
                  <span>Nama Kost</span>
                  <strong>
                    {selectedComplaint.tenant?.kost?.name || "-"}
                  </strong>
                </div>

                <div>
                  <span>NIK Penghuni</span>
                  <strong>
                    {selectedComplaint.tenant?.user?.nik || "-"}
                  </strong>
                </div>

                <div>
                  <span>Tanggal Laporan</span>
                  <strong>
                    {formatDate(selectedComplaint.created_at)} •{" "}
                    {formatTime(selectedComplaint.created_at)}
                  </strong>
                </div>

                <div>
                  <span>Status Komplain</span>
                  <strong>
                    {getStatusLabel(selectedComplaint.status)}
                  </strong>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="complaint-description-box">
                <span>Isi Laporan / Kendala</span>
                <p>
                  {selectedComplaint.description || "Tidak ada deskripsi rinci."}
                </p>
              </div>
            </div>

            <div className="complaint-modal-footer">
              <button
                className="complaint-close-btn"
                onClick={() => setSelectedComplaint(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.show && (
        <div className={`complaint-toast ${toast.type}`}>
          <span>
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <p>{toast.message}</p>
        </div>
      )}
    </div>
  );
}

export default Complaint;
