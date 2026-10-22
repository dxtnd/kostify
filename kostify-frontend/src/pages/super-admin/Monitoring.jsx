import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Monitoring.css";

function Monitoring() {
  const [owners, setOwners] = useState([]);
  const [kosts, setKosts] = useState([]);

  const [loadingOwners, setLoadingOwners] = useState(true);
  const [loadingKosts, setLoadingKosts] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    fetchMonitoring();
  }, []);

  const fetchMonitoring = async () => {
    setError("");

    try {
      const [ownersResponse, kostsResponse] = await Promise.all([
        api.get("/super-admin/monitoring/owners"),
        api.get("/super-admin/monitoring/kosts"),
      ]);

      setOwners(ownersResponse.data.data || []);
      setKosts(kostsResponse.data.data || []);
    } catch (err) {
      console.error("Monitoring error:", err);

      setError(
        err.response?.data?.message ||
          "Gagal mengambil data monitoring."
      );
    } finally {
      setLoadingOwners(false);
      setLoadingKosts(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "active") return "status-active";
    if (status === "inactive") return "status-inactive";
    return "status-default";
  };

  const formatStatus = (status) => {
    if (status === "active") return "Aktif";
    if (status === "inactive") return "Nonaktif";
    return status || "-";
  };

  return (
    <div className="monitoring-page">

      {/* HEADER */}
      <div className="monitoring-header">
        <div>
          <span className="monitoring-eyebrow">
            SISTEM
          </span>

          <h1>Monitoring Sistem</h1>

          <p>
            Pantau data Pemilik Kos dan Kost yang terdaftar
            di platform Kostify.
          </p>
        </div>

        <button
          className="monitoring-refresh"
          onClick={fetchMonitoring}
        >
          ↻ Perbarui Data
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="monitoring-error">
          <span>!</span>
          <div>
            <strong>Gagal memuat data</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* SUMMARY */}
      <div className="monitoring-summary">

        <div className="monitoring-summary-card">
          <div className="summary-icon owner-icon">
            ♙
          </div>

          <div>
            <span>Total Pemilik Kos</span>

            <strong>
              {loadingOwners ? "..." : owners.length}
            </strong>

            <small>
              Pemilik terdaftar
            </small>
          </div>
        </div>

        <div className="monitoring-summary-card">
          <div className="summary-icon kost-icon">
            ▦
          </div>

          <div>
            <span>Total Kost</span>

            <strong>
              {loadingKosts ? "..." : kosts.length}
            </strong>

            <small>
              Kost terdaftar
            </small>
          </div>
        </div>

      </div>

      {/* OWNER SECTION */}
      <section className="monitoring-section">

        <div className="section-heading">
          <div>
            <h2>Pemilik Kos Terdaftar</h2>

            <p>
              Daftar Pemilik Kos yang terdaftar pada
              platform Kostify.
            </p>
          </div>

          <span className="section-count">
            {owners.length} Pemilik
          </span>
        </div>

        <div className="monitoring-table-card">

          {loadingOwners ? (
            <div className="monitoring-loading">
              Memuat data Pemilik Kos...
            </div>
          ) : owners.length === 0 ? (
            <div className="monitoring-empty">
              <div className="empty-icon">♙</div>

              <strong>
                Belum ada Pemilik Kos
              </strong>

              <p>
                Data Pemilik Kos yang terdaftar
                akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="monitoring-table-wrapper">
              <table className="monitoring-table">

                <thead>
                  <tr>
                    <th>No</th>
                    <th>Pemilik Kos</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Terdaftar</th>
                  </tr>
                </thead>

                <tbody>
                  {owners.map((owner, index) => (
                    <tr key={owner.id}>

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        <div className="person-cell">
                          <div className="person-avatar">
                            {owner.name
                              ? owner.name
                                  .charAt(0)
                                  .toUpperCase()
                              : "P"}
                          </div>

                          <div>
                            <strong>
                              {owner.name || "-"}
                            </strong>

                            <small>
                              ID #{owner.id}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {owner.email || "-"}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            owner.status
                          )}`}
                        >
                          <span className="status-dot"></span>
                          {formatStatus(owner.status)}
                        </span>
                      </td>

                      <td>
                        {owner.created_at
                          ? new Date(
                              owner.created_at
                            ).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>
      </section>

      {/* KOST SECTION */}
      <section className="monitoring-section">

        <div className="section-heading">
          <div>
            <h2>Kost Terdaftar</h2>

            <p>
              Daftar Kost yang terdaftar pada
              platform Kostify.
            </p>
          </div>

          <span className="section-count">
            {kosts.length} Kost
          </span>
        </div>

        <div className="monitoring-table-card">

          {loadingKosts ? (
            <div className="monitoring-loading">
              Memuat data Kost...
            </div>
          ) : kosts.length === 0 ? (
            <div className="monitoring-empty">
              <div className="empty-icon">▦</div>

              <strong>
                Belum ada Kost
              </strong>

              <p>
                Data Kost yang terdaftar
                akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="monitoring-table-wrapper">
              <table className="monitoring-table">

                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Kost</th>
                    <th>Pemilik</th>
                    <th>Kota</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {kosts.map((kost, index) => (
                    <tr key={kost.id}>

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        <div className="kost-cell">
                          <div className="kost-icon-small">
                            ▦
                          </div>

                          <div>
                            <strong>
                              {kost.name || "-"}
                            </strong>

                            <small>
                              ID #{kost.id}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {kost.owner?.name ||
                          kost.owner_name ||
                          "-"}
                      </td>

                      <td>
                        {kost.city || "-"}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            kost.status
                          )}`}
                        >
                          <span className="status-dot"></span>
                          {formatStatus(kost.status)}
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>
      </section>

    </div>
  );
}

export default Monitoring;