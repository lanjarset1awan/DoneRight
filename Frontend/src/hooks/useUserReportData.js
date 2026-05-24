import { useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function useUserReportData(token) {
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

  return {
    stats,
    loading,
    downloading,
    toast,
    handleDownloadPDF,
    productivity
  };
}
