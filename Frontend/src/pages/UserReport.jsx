import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import "../style/pages/UserReport.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function UserReport({ token, user, onLogout, onNavigateDashboard, onNavigateProfile }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BASE_URL}/statistics/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Personal report load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${BASE_URL}/statistics/pdf/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh dokumen.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Laporan_Produktivitas_Anda.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Laporan PDF berhasil diunduh!", "success");
    } catch (err) {
      console.error("PDF download error:", err);
      showToast("Gagal mengunduh laporan PDF.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const productivity = stats ? stats.productivity || 0 : 0;

  return (
    <div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* NAVBAR */}
      <Navbar
        title="DoneRight"
        subtitle="Analisis Performa Produktivitas"
        user={user}
        onNavigateProfile={onNavigateProfile}
        onLogout={onLogout}
      />

      {/* MAIN CONTAINER */}
      <div className="dashboard-container user-report-container">
        {/* BACK BUTTON */}
        <div className="report-header-row user-report-header">
          <button 
            className="btn-secondary user-report-btn-back" 
            onClick={onNavigateDashboard}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Dashboard
          </button>
        </div>

        {loading ? (
          <div className="report-loading user-report-loading-container">
            <div className="user-report-loading-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="var(--primary-color)" strokeWidth={2.5} className="user-report-loading-spinner">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
              </svg>
            </div>
            <p className="user-report-loading-text">Menganalisis performa tugas Anda...</p>
          </div>
        ) : !stats ? (
          <div className="report-loading user-report-error-container">
            <div className="user-report-error-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="user-report-error-text">Terjadi kesalahan saat memuat data laporan.</p>
          </div>
        ) : (
          <div className="report-content active">
            {/* BIG BANNER */}
            <div className="big-productivity-card user-report-banner-card">
              <div className="big-prod-label user-report-banner-label">Productivity Rate Anda</div>
              <div className="big-prod-value user-report-banner-value">{productivity}%</div>
              <div className="progress-bar-container user-report-progress-container">
                <div className="progress-bar-fill user-report-progress-fill" style={{ width: `${productivity}%` }}></div>
              </div>
            </div>

            {/* STATS GRID */}
            <div className="admin-stats-grid user-report-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-left">
                  <span className="admin-stat-label">Total Tugas</span>
                  <span className="admin-stat-value">{stats.total_tasks || 0}</span>
                  <span className="admin-stat-sub">Tugas Anda terdaftar</span>
                </div>
                <div className="admin-stat-icon-circle icon-blue">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-left">
                  <span className="admin-stat-label">Tugas Selesai</span>
                  <span className="admin-stat-value">{stats.completed_tasks || 0}</span>
                  <span className="admin-stat-sub">Berhasil diselesaikan</span>
                </div>
                <div className="admin-stat-icon-circle icon-green">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-left">
                  <span className="admin-stat-label">Tepat Waktu</span>
                  <span className="admin-stat-value">{stats.on_time || 0}</span>
                  <span className="admin-stat-sub">Sebelum deadline</span>
                </div>
                <div className="admin-stat-icon-circle icon-yellow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-left">
                  <span className="admin-stat-label">Terlambat</span>
                  <span className="admin-stat-value">{stats.overdue || 0}</span>
                  <span className="admin-stat-sub">Melewati deadline</span>
                </div>
                <div className="admin-stat-icon-circle icon-red">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* ACTION CARD */}
            <div className="report-action-card user-report-action-card">
              <h3 className="user-report-action-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--primary-color)" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Unduh Laporan Format PDF
              </h3>
              <p className="user-report-action-desc">
                Dapatkan dokumen PDF resmi yang memuat rincian statistik tugas, kategori, dan timeline performa produktivitas Anda.
              </p>
              <button
                className="btn-primary user-report-btn-download"
                onClick={handleDownloadPDF}
                disabled={downloading}
              >
                {downloading ? (
                  "Mengunduh PDF..."
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Unduh Laporan PDF
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      {/* TOAST NOTIFICATION */}
      <div className={`toast-notification ${toast.show ? "active" : ""} ${toast.type}`}>
        <div className="toast-message">{toast.message}</div>
      </div>
    </div>
  );
}
