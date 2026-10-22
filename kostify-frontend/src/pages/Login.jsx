import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError("");
    setEmail("");
    setPassword("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const endpoint =
        role === "super_admin"
          ? "/login"
          : "/owner/login";

      const response = await api.post(endpoint, {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (rememberMe) {
        localStorage.setItem("remember_me", "true");
      } else {
        localStorage.removeItem("remember_me");
      }

      if (user.role === "super_admin") {
        navigate("/super-admin/dashboard");
      } else if (user.role === "owner") {
        navigate("/owner/dashboard");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login gagal. Periksa email dan password Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoRole) => {
    setRole(demoRole);
    setError("");

    if (demoRole === "owner") {
      setEmail("owner@kostify.com");
      setPassword("password123");
    } else {
      setEmail("superadmin@kostify.com");
      setPassword("password123");
    }
  };

  return (
    <main className="login-page">

      {/* Decorative background */}
      <div className="glow glow-green"></div>
      <div className="glow glow-blue"></div>

      {/* Top navigation */}
      <header className="login-topbar">
        <div className="topbar-logo">
          <div className="logo-mark">
            <span>K</span>
          </div>

          <span className="logo-name">Kostify</span>
        </div>

        <div className="topbar-right">
          <span>Sistem Manajemen Kost</span>

          <span className="topbar-divider"></span>

          <button type="button" className="support-link">
            <span>?</span>
            Bantuan
          </button>
        </div>
      </header>

      {/* Login area */}
      <section className="login-container">

        <div className="login-card">

          {/* Card header */}
          <div className="card-header">

            <div className="building-icon">
              <span>▦</span>
            </div>

            <div className="version-badge">
              KOSTIFY OS V3.4
            </div>

            <h1>Selamat datang</h1>

            <p>
              Masuk untuk mengelola data kost,
              <br />
              kamar, penghuni, tagihan, dan komplain.
            </p>

          </div>

          {/* Role selector */}
          <div className="role-tabs">

            <button
              type="button"
              className={`role-tab ${
                role === "owner" ? "active" : ""
              }`}
              onClick={() => handleRoleChange("owner")}
            >
              <span className="tab-icon">⌂</span>

              <span className="tab-content">
                <strong>Pemilik Kos</strong>
                <small>Kelola kost</small>
              </span>
            </button>

            <button
              type="button"
              className={`role-tab ${
                role === "super_admin" ? "active" : ""
              }`}
              onClick={() => handleRoleChange("super_admin")}
            >
              <span className="tab-icon">◆</span>

              <span className="tab-content">
                <strong>Super Admin</strong>
                <small>Kelola platform</small>
              </span>
            </button>

          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>

            {/* Email */}
            <div className="field">

              <div className="field-label-row">
                <label htmlFor="email">
                  Email
                </label>

                <span className="access-badge">
                  {role === "owner"
                    ? "Akses Pemilik"
                    : "Akses Admin"}
                </span>
              </div>

              <div className="input-box">

                <span className="input-symbol">
                  @
                </span>

                <input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            {/* Password */}
            <div className="field">

              <div className="field-label-row">

                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-button"
                  onClick={() =>
                    setError(
                      "Silakan hubungi administrator Kostify untuk mengatur ulang password."
                    )
                  }
                >
                  Lupa password?
                </button>

              </div>

              <div className="input-box">

                <span className="input-symbol password-symbol">
                  ●
                </span>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                >
                  {showPassword ? "Sembunyi" : "Lihat"}
                </button>

              </div>

            </div>

            {/* Error */}
            {error && (
              <div className="error-message">
                <span className="error-icon">!</span>

                <span>{error}</span>
              </div>
            )}

            {/* Options */}
            <div className="login-options">

              <label className="remember-option">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                />

                <span className="custom-checkbox"></span>

                <span>
                  Tetap masuk di perangkat ini
                </span>

              </label>

              <div className="system-status">
                <span className="status-dot"></span>
                Sistem aktif
              </div>

            </div>

            {/* Submit */}
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Sedang masuk..."
                  : "Masuk ke Dashboard"}
              </span>

              {!loading && (
                <span className="arrow">
                  →
                </span>
              )}
            </button>

          </form>

          {/* Demo accounts */}
          <div className="demo-panel">

            <div className="demo-header">

              <div>
                <span className="demo-title">
                  AKUN DEMO
                </span>

                <span className="demo-subtitle">
                  Untuk pengujian sistem
                </span>
              </div>

              <span className="demo-status">
                ● Siap digunakan
              </span>

            </div>

            <div className="demo-accounts">

              <button
                type="button"
                className="demo-account"
                onClick={() =>
                  fillDemoAccount("owner")
                }
              >
                <div className="demo-account-top">
                  <strong>Pemilik Kos</strong>
                  <span>Owner</span>
                </div>

                <span>
                  owner@kostify.com
                </span>
              </button>

              <button
                type="button"
                className="demo-account"
                onClick={() =>
                  fillDemoAccount("super_admin")
                }
              >
                <div className="demo-account-top">
                  <strong>Super Admin</strong>
                  <span>Admin</span>
                </div>

                <span>
                  superadmin@kostify.com
                </span>
              </button>

            </div>

            <div className="security-note">
              <span>◇</span>
              Akses dilindungi oleh autentikasi Kostify
            </div>

          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="login-footer">

        <span>
          © 2026 Kostify
        </span>

        <span className="footer-dot">•</span>

        <span>
          Sistem Manajemen Multi-Kost
        </span>

        <span className="footer-dot">•</span>

        <span>
          Semua hak dilindungi
        </span>

      </footer>

    </main>
  );
}

export default Login;