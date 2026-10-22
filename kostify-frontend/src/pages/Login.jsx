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
      const endpoint = role === "super_admin" ? "/login" : "/owner/login";

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
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login gagal. Periksa kembali email dan password Anda."
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
      {/* Background Soft Ambient Lights */}
      <div className="ambient-glow ambient-glow-1"></div>
      <div className="ambient-glow ambient-glow-2"></div>
      <div className="ambient-grid"></div>

      {/* Top Navbar */}
      <header className="login-topbar">
        <div className="topbar-brand">
          <div className="brand-logo-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="brand-text">
            <strong>Kostify</strong>
            <span className="brand-pill">SaaS Platform</span>
          </div>
        </div>

        <div className="topbar-status">
          <span className="live-dot"></span>
          <span>Sistem Berjalan Normal</span>
        </div>
      </header>

      {/* Main Login Card Section */}
      <section className="login-container">
        <div className="login-card">
          {/* Card Header */}
          <div className="card-header">
            <div className="header-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                <path d="M9 22v-4h6v4"/>
                <path d="M8 6h.01"/><path d="M16 6h.01"/>
                <path d="M12 6h.01"/><path d="M12 10h.01"/>
                <path d="M12 14h.01"/><path d="M16 10h.01"/>
                <path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
              </svg>
            </div>
            <h1>Selamat Datang Kembali</h1>
            <p>Masuk ke portal manajemen kost untuk mengelola properti, penghuni, dan tagihan.</p>
          </div>

          {/* Segmented Role Switcher */}
          <div className="role-switcher">
            <button
              type="button"
              className={`role-tab-btn ${role === "owner" ? "active" : ""}`}
              onClick={() => handleRoleChange("owner")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Pemilik Kos</span>
            </button>

            <button
              type="button"
              className={`role-tab-btn ${role === "super_admin" ? "active" : ""}`}
              onClick={() => handleRoleChange("super_admin")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Super Admin</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="login-form">
            {/* Email Field */}
            <div className="input-group">
              <div className="label-row">
                <label htmlFor="email">Email Akun</label>
                <span className="role-tag">
                  {role === "owner" ? "Owner Portal" : "Admin Master"}
                </span>
              </div>
              <div className="input-field-wrapper">
                <span className="field-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="contoh@kostify.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="input-group">
              <div className="label-row">
                <label htmlFor="password">Kata Sandi</label>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() =>
                    setError(
                      "Hubungi administrator sistem untuk mereset kata sandi Anda."
                    )
                  }
                >
                  Lupa sandi?
                </button>
              </div>
              <div className="input-field-wrapper">
                <span className="field-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-pw-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="error-alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Remember Me */}
            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="checkbox-label">Ingat sesi di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="primary-login-btn"
              disabled={loading}
            >
              <span>{loading ? "Memproses Autentikasi..." : "Masuk ke Dashboard"}</span>
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="demo-section">
            <div className="demo-title-row">
              <span className="demo-label">AKUN PENGUJIAN (1-CLICK DEMO)</span>
            </div>

            <div className="demo-grid">
              <button
                type="button"
                className="demo-card-btn"
                onClick={() => fillDemoAccount("owner")}
              >
                <div className="demo-role-badge owner-badge">Pemilik Kos</div>
                <div className="demo-email">owner@kostify.com</div>
              </button>

              <button
                type="button"
                className="demo-card-btn"
                onClick={() => fillDemoAccount("super_admin")}
              >
                <div className="demo-role-badge admin-badge">Super Admin</div>
                <div className="demo-email">superadmin@kostify.com</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Minimal Footer */}
      <footer className="login-footer">
        <p>© 2026 Kostify Multi-Kost Platform • Dilindungi Autentikasi Sanctum Token</p>
      </footer>
    </main>
  );
}

export default Login;
