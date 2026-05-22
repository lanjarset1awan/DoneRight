import { useState } from "react";
import "../style/pages/Login.css"; // Reuse login stylesheet for styling consistency

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function ForgotPassword({ onNavigateLogin }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Email wajib diisi!");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setDevResetUrl("");

    try {
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengirim permintaan reset password.");
      }

      setSuccessMsg(data.message || "Tautan reset password telah dibuat.");
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat memproses permintaan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-body">
      <div className="auth-container">
        <div className="auth-header">
          <a href="/" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <div className="logo-icon">
              <div className="logo-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="check-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1>DoneRight</h1>
            <p>Sistem Manajemen Tugas Mahasiswa</p>
          </a>
        </div>

        <div className="auth-card">
          <h2>Lupa Password</h2>

          {errorMsg && (
            <div className="auth-error-msg">
              ⚠ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ color: "#10b981", fontSize: "14px", marginBottom: "16px", fontWeight: 500 }}>
              ✓ {successMsg}
            </div>
          )}

          {!successMsg ? (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px", lineHeight: "1.5" }}>
                Masukkan email akun Anda. Kami akan membuat tautan reset password untuk Anda (mode pengembangan).
              </p>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                {loading ? "Loading..." : "Kirim Permintaan"}
              </button>
            </form>
          ) : (
            <div style={{ marginTop: "10px" }}>
              {devResetUrl && (
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>
                    Tautan Reset Password (Dev Mode):
                  </p>
                  <a 
                    href={devResetUrl} 
                    style={{ fontSize: "13px", color: "#4f46e5", textDecoration: "underline", wordBreak: "break-all", display: "block", marginBottom: "12px" }}
                  >
                    {devResetUrl}
                  </a>
                  <button 
                    type="button" 
                    className="btn-primary auth-submit-btn"
                    onClick={() => {
                      window.location.href = devResetUrl;
                    }}
                    style={{ marginTop: "0" }}
                  >
                    Buka Halaman Reset Password
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="auth-footer" style={{ marginTop: "20px" }}>
            Kembali ke{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigateLogin(); }}>
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
