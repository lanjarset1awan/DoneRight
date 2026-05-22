/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import "../style/pages/AdminDashboard.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function AdminDashboard({ token, user, onLogout, onNavigateReport, onOpenProfile }) {
  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersStats, setUsersStats] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingUsersStats, setLoadingUsersStats] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState({});
  const [usersList, setUsersList] = useState([]);
  const [loadingUsersList, setLoadingUsersList] = useState(false);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [searchProd, setSearchProd] = useState("");
  const [sortByProd, setSortByProd] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [sortByUser, setSortByUser] = useState("");

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
    confirmText: "Ya, Hapus",
    cancelText: "Batal",
    isDanger: true
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      // 1. Stats
      const statsRes = await fetch(`${BASE_URL}/admin/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = statsRes.ok ? await statsRes.json() : null;
      setStats(statsData);

      // 2. Overdue tasks
      const overdueRes = await fetch(`${BASE_URL}/admin/overdue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const overdueData = overdueRes.ok ? await overdueRes.json() : [];
      setOverdueTasks(overdueData);

      // 3. All tasks for priority calculation
      const tasksRes = await fetch(`${BASE_URL}/admin/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tasksData = tasksRes.ok ? await tasksRes.json() : [];
      setAllTasks(tasksData);
    } catch (err) {
      console.error("Overview data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllTasks(data);
      }
    } catch (err) {
      console.error("All tasks load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdueTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/overdue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOverdueTasks(data);
      }
    } catch (err) {
      console.error("Overdue tasks load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Categories load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersStats = async () => {
    setLoadingUsersStats(true);
    try {
      const res = await fetch(`${BASE_URL}/statistics/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersStats(data);
      }
    } catch (err) {
      console.error("Users productivity statistics load error:", err);
    } finally {
      setLoadingUsersStats(false);
    }
  };

  const handleDownloadUserPDF = async (userId, username) => {
    setDownloadingPdf((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(`${BASE_URL}/statistics/pdf/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh laporan.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Productivity_${username}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Laporan PDF ${username} berhasil diunduh!`, "success");
    } catch (err) {
      console.error("User PDF download error:", err);
      showToast(`Gagal mengunduh laporan PDF ${username}.`, "error");
    } finally {
      setDownloadingPdf((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const fetchUsersList = async () => {
    setLoadingUsersList(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error("Users list load error:", err);
    } finally {
      setLoadingUsersList(false);
    }
  };

  const handleSoftDeleteUser = (userId, username) => {
    setConfirmModal({
      show: true,
      title: "Nonaktifkan Akun User",
      message: `Apakah Anda yakin ingin menonaktifkan akun user "${username}"? User ini tidak akan dapat login ke sistem.`,
      confirmText: "Ya, Nonaktifkan",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`${BASE_URL}/admin/users/${userId}/soft-delete`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            showToast(`Akun user ${username} berhasil dinonaktifkan!`, "success");
            fetchUsersList();
            fetchOverviewData();
            fetchUsersStats();
          } else {
            throw new Error();
          }
        } catch (err) {
          console.error("Soft delete user error:", err);
          showToast(`Gagal menonaktifkan akun user ${username}.`, "error");
        }
      },
      onCancel: () => {}
    });
  };

  const handleRestoreUser = async (userId, username) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/users/${userId}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(`Akun user ${username} berhasil dipulihkan!`, "success");
        fetchUsersList();
        fetchOverviewData();
        fetchUsersStats();
      } else {
        throw new Error();
      }
    } catch (err) {
      console.error("Restore user error:", err);
      showToast(`Gagal memulihkan akun user ${username}.`, "error");
    }
  };

  // Load overview data automatically
  useEffect(() => {
    fetchOverviewData();
    fetchUsersStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch based on Active Tab
  useEffect(() => {
    if (activeTab === "overview") {
      fetchOverviewData();
      fetchUsersStats();
    } else if (activeTab === "categories") {
      fetchCategories();
    } else if (activeTab === "users") {
      fetchUsersList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Submit Category
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      showToast("Nama kategori wajib diisi!", "warning");
      return;
    }

    setCategorySubmitting(true);
    try {
      let url = `${BASE_URL}/admin/categories`;
      let method = "POST";

      if (editingCategory) {
        url = `${BASE_URL}/admin/categories/${editingCategory.id_categories}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: categoryName.trim() }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan kategori.");

      const isEdit = !!editingCategory;
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryName("");
      await fetchCategories();
      showToast(isEdit ? "Kategori global berhasil diupdate!" : "Kategori global baru berhasil ditambahkan!", "success");
    } catch (err) {
      console.error("Save global category error:", err);
      showToast("Gagal menyimpan kategori global.", "error");
    } finally {
      setCategorySubmitting(false);
    }
  };

  // Delete Category Actual
  const executeDeleteCategory = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal menghapus kategori.");

      await fetchCategories();
      showToast("Kategori global berhasil dihapus!", "success");
    } catch (err) {
      console.error("Delete global category error:", err);
      showToast("Gagal menghapus kategori global.", "error");
    }
  };

  // Delete Category
  const handleDeleteCategory = (id) => {
    setConfirmModal({
      show: true,
      title: "Hapus Kategori Global",
      message: "Apakah Anda yakin ingin menghapus kategori global ini? Kategori kustom buatan admin ini akan dihapus dari sistem.",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: () => executeDeleteCategory(id),
      onCancel: () => {}
    });
  };

  // Priority calculations
  const totalTasksCount = stats ? stats.total_tasks || 0 : allTasks.length;
  const completedTasksCount = stats ? stats.completed_tasks || 0 : allTasks.filter((t) => t.is_completed).length;
  const overdueCount = overdueTasks.length;
  const now = new Date();
  const activeCount = allTasks.filter((t) => {
    const deadline = t.deadline ? new Date(t.deadline) : null;
    const isOverdue = !t.is_completed && deadline && deadline < now;
    return !t.is_completed && !isOverdue;
  }).length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;


  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  allTasks.forEach((t) => {
    if (t.priority === "high") highCount++;
    else if (t.priority === "medium") mediumCount++;
    else if (t.priority === "low") lowCount++;
  });

  const highPercent = totalTasksCount > 0 ? (highCount / totalTasksCount) * 100 : 0;
  const mediumPercent = totalTasksCount > 0 ? (mediumCount / totalTasksCount) * 100 : 0;
  const lowPercent = totalTasksCount > 0 ? (lowCount / totalTasksCount) * 100 : 0;

  // Reset page when search or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchProd, sortByProd]);

  // Filter & sort productivity users
  const filteredAndSortedUsersStats = React.useMemo(() => {
    let result = [...usersStats];

    if (searchProd.trim() !== "") {
      const query = searchProd.toLowerCase();
      result = result.filter(
        (u) =>
          (u.username && u.username.toLowerCase().includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query))
      );
    }

    if (sortByProd === "overdue-desc") {
      result.sort((a, b) => (Number(b.overdue) || 0) - (Number(a.overdue) || 0));
    } else if (sortByProd === "prod-asc") {
      result.sort((a, b) => (Number(a.productivity) || 0) - (Number(b.productivity) || 0));
    } else if (sortByProd === "prod-desc") {
      result.sort((a, b) => (Number(b.productivity) || 0) - (Number(a.productivity) || 0));
    } else if (sortByProd === "name-asc") {
      result.sort((a, b) => (a.username || "").localeCompare(b.username || ""));
    }

    return result;
  }, [usersStats, searchProd, sortByProd]);

  const itemsPerPage = 7;
  const indexOfLastRow = currentPage * itemsPerPage;
  const indexOfFirstRow = indexOfLastRow - itemsPerPage;
  const currentRows = filteredAndSortedUsersStats.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredAndSortedUsersStats.length / itemsPerPage);

  // Reset user page when search or sorting changes
  useEffect(() => {
    setUsersCurrentPage(1);
  }, [searchUser, sortByUser]);

  // Filter & sort users list
  const filteredAndSortedUsersList = React.useMemo(() => {
    let result = [...usersList];

    if (searchUser.trim() !== "") {
      const query = searchUser.toLowerCase();
      result = result.filter(
        (u) =>
          (u.username && u.username.toLowerCase().includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query))
      );
    }

    if (sortByUser === "name-asc") {
      result.sort((a, b) => (a.username || "").localeCompare(b.username || ""));
    } else if (sortByUser === "name-desc") {
      result.sort((a, b) => (b.username || "").localeCompare(a.username || ""));
    } else if (sortByUser === "status-active") {
      result.sort((a, b) => {
        const aActive = !a.deleted_at;
        const bActive = !b.deleted_at;
        if (aActive === bActive) return 0;
        return aActive ? -1 : 1;
      });
    } else if (sortByUser === "status-inactive") {
      result.sort((a, b) => {
        const aActive = !a.deleted_at;
        const bActive = !b.deleted_at;
        if (aActive === bActive) return 0;
        return aActive ? 1 : -1;
      });
    }

    return result;
  }, [usersList, searchUser, sortByUser]);

  return (
    <div>
      {/* NAVBAR */}
      <Navbar
        title="DoneRight Admin"
        subtitle="Admin DoneRight"
        user={user}
        onOpenProfile={onOpenProfile}
        onNavigateReport={onNavigateReport}
        onLogout={onLogout}
      />

      {/* MAIN CONTAINER */}
      <div className="dashboard-container">
        {/* TABS HEADER */}
        <div className="admin-tabs-card">
          <div className="admin-tabs-row">
            <button
              className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`admin-tab-btn ${activeTab === "categories" ? "active" : ""}`}
              onClick={() => setActiveTab("categories")}
            >
              Kelola Kategori
            </button>
            <button
              className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              Kelola Akun User
            </button>
          </div>
        </div>

        {/* TAB PANEL: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="tab-panel active">
            {/* STATS GRID */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-left">
                  <span className="admin-stat-label">Total Tugas</span>
                  <span className="admin-stat-value">{totalTasksCount}</span>
                  <span className="admin-stat-sub">Tugas terdaftar</span>
                </div>
                <div className="admin-stat-icon-circle icon-blue">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-left">
                  <span className="admin-stat-label">Selesai</span>
                  <span className="admin-stat-value">{completedTasksCount}</span>
                  <span className="admin-stat-sub">{completionRate}% completion rate</span>
                </div>
                <div className="admin-stat-icon-circle icon-green">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-left">
                  <span className="admin-stat-label">Aktif</span>
                  <span className="admin-stat-value">{activeCount}</span>
                  <span className="admin-stat-sub">Sedang berjalan</span>
                </div>
                <div className="admin-stat-icon-circle icon-yellow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-left">
                  <span className="admin-stat-label">Overdue</span>
                  <span className="admin-stat-value">{overdueCount}</span>
                  <span className="admin-stat-sub">Perlu perhatian</span>
                </div>
                <div className="admin-stat-icon-circle icon-red">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* PRIORITY DISTRIBUTION */}
            <div className="board-card">
              <div className="board-title">Distribusi Prioritas</div>
              <div className="priority-dist-row">
                <div className="priority-progress-item">
                  <div className="priority-progress-header">
                    <span>High Priority</span>
                    <span>{highCount} tugas</span>
                  </div>
                  <div className="priority-progress-bar">
                    <div className="priority-progress-fill fill-red" style={{ width: `${highPercent}%` }}></div>
                  </div>
                </div>

                <div className="priority-progress-item">
                  <div className="priority-progress-header">
                    <span>Medium Priority</span>
                    <span>{mediumCount} tugas</span>
                  </div>
                  <div className="priority-progress-bar">
                    <div className="priority-progress-fill fill-yellow" style={{ width: `${mediumPercent}%` }}></div>
                  </div>
                </div>

                <div className="priority-progress-item">
                  <div className="priority-progress-header">
                    <span>Low Priority</span>
                    <span>{lowCount} tugas</span>
                  </div>
                  <div className="priority-progress-bar">
                    <div className="priority-progress-fill fill-green" style={{ width: `${lowPercent}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* USER PRODUCTIVITY TABLE */}
            <div className="board-card" style={{ marginTop: "24px" }}>
              <div className="board-title" style={{ marginBottom: "16px" }}>User Productivity Table</div>
              
              {/* FILTERS FOR USER PRODUCTIVITY */}
              <div className="prod-table-filters">
                <div className="search-input-wrapper">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Cari user berdasarkan username atau email..."
                    value={searchProd}
                    onChange={(e) => setSearchProd(e.target.value)}
                  />
                </div>

                <CustomSelect
                  value={sortByProd}
                  onChange={setSortByProd}
                  options={[
                    { value: "", label: "Urutkan: Default" },
                    { value: "name-asc", label: "Urutkan: Nama A-Z" },
                    { value: "overdue-desc", label: "Urutkan: Overdue Terbanyak" },
                    { value: "prod-asc", label: "Urutkan: Produktivitas Terendah" },
                    { value: "prod-desc", label: "Urutkan: Produktivitas Tertinggi" }
                  ]}
                  placeholder="Urutkan"
                />
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>No</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Total Task</th>
                      <th>Pending</th>
                      <th>On Time</th>
                      <th>Overdue</th>
                      <th>Productivity</th>
                      <th style={{ width: "100px", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsersStats && usersStats.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="admin-dash-empty-td">
                          <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                            <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          Memuat data produktivitas...
                        </td>
                      </tr>
                    ) : filteredAndSortedUsersStats.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="admin-dash-empty-td">
                          {usersStats.length === 0 ? "Tidak ada data pengguna." : "Tidak ada data pengguna sesuai kriteria filter."}
                        </td>
                      </tr>
                    ) : (
                      currentRows.map((userRow, index) => {
                        const globalIndex = indexOfFirstRow + index + 1;
                        const prodVal = Number(userRow.productivity);
                        const displayProd = userRow.total_tasks === 0 || prodVal === 0 
                          ? "0%" 
                          : `${prodVal.toFixed(1)}%`;
                        
                        return (
                          <tr key={userRow.id_users}>
                            <td>{globalIndex}</td>
                            <td>
                              <div className="admin-table-title">{userRow.username}</div>
                            </td>
                            <td>{userRow.email}</td>
                            <td>{userRow.total_tasks}</td>
                            <td>{userRow.pending}</td>
                            <td>{userRow.on_time}</td>
                            <td>{userRow.overdue}</td>
                            <td>
                              <span 
                                className="badge" 
                                style={{ 
                                  backgroundColor: prodVal >= 75 ? "#ecfdf5" : prodVal >= 40 ? "#fffbeb" : "#fef2f2",
                                  color: prodVal >= 75 ? "#059669" : prodVal >= 40 ? "#d97706" : "#dc2626",
                                  fontWeight: "600"
                                }}
                              >
                                {displayProd}
                              </span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="btn-primary"
                                style={{ 
                                  padding: "6px 12px", 
                                  fontSize: "12px", 
                                  borderRadius: "4px",
                                  backgroundColor: "#f1f5f9",
                                  border: "1px solid #cbd5e1",
                                  color: "#334155",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = "#e2e8f0";
                                  e.target.style.color = "#0f172a";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = "#f1f5f9";
                                  e.target.style.color = "#334155";
                                }}
                                onClick={() => handleDownloadUserPDF(userRow.id_users, userRow.username)}
                                disabled={downloadingPdf[userRow.id_users]}
                              >
                                {downloadingPdf[userRow.id_users] ? "..." : "PDF"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION FOOTER */}
              {filteredAndSortedUsersStats.length > 0 && (
                <div className="productivity-footer">
                  <div className="productivity-footer-text">
                    Menampilkan {currentRows.length} dari {filteredAndSortedUsersStats.length} laporan
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      &lt;
                    </button>
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        className={`pagination-btn ${currentPage === pageNum ? "active" : ""}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB PANEL: KELOLA KATEGORI */}
        {activeTab === "categories" && (
          <div className="tab-panel active">
            <div className="board-card">
              <div className="board-header">
                <div className="board-title">Kelola Kategori Tugas</div>
                <button
                  className="btn-primary admin-dash-btn-manage-cats"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryName("");
                    setCategorySubmitting(false);
                    setShowCategoryModal(true);
                  }}
                >
                  <span className="btn-icon-add">+</span> Tambah Kategori
                </button>
              </div>

              <div className="category-cards-grid">
                {loading && categories.length === 0 ? (
                  <div className="empty-state admin-dash-empty-state-full">
                    <div className="empty-state-icon" style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                      <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <p>Memuat kategori...</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="empty-state admin-dash-empty-state-full">
                    <p>Tidak ada kategori global.</p>
                  </div>
                ) : (
                  categories.map((cat) => {
                    const nameLower = cat.name.toLowerCase();
                    const isDefault = nameLower === "akademik" || nameLower === "organisasi" || nameLower === "pekerjaan";
                    const typeText = isDefault ? "Kategori Default" : "Kategori Custom";
                    const dateText = cat.created_at ? new Date(cat.created_at).toLocaleDateString("id-ID") : "14/5/2026";

                    return (
                      <div className="category-admin-card" key={cat.id_categories}>
                        <div className="category-admin-left">
                          <span className="category-admin-name">
                            {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                          </span>
                          <span className="category-admin-type">{typeText}</span>
                          <span className="category-admin-date">Dibuat: {dateText}</span>
                        </div>
                        <div className="admin-dash-cats-row">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(cat);
                              setCategoryName(cat.name);
                              setCategorySubmitting(false);
                              setShowCategoryModal(true);
                            }}
                            className="dashboard-manage-cats-item-btn dashboard-manage-cats-item-btn-edit"
                            title="Edit Kategori"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                           <button
                             className="admin-dash-cat-del-icon"
                             onClick={() => handleDeleteCategory(cat.id_categories)}
                             title="Hapus Kategori"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                             </svg>
                           </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB PANEL: KELOLA AKUN USER */}
        {activeTab === "users" && (
          <div className="tab-panel active">
            <div className="board-card">
              <div className="board-header" style={{ marginBottom: "20px", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                <div className="board-title">Kelola Akun User</div>
                <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.5" }}>
                  Gunakan panel ini untuk menonaktifkan (<i>soft delete</i>) atau memulihkan kembali akun pengguna DoneRight. Akun pengguna yang dinonaktifkan tidak akan dapat masuk (<i>login</i>) ke sistem.
                </p>
              </div>

              {/* FILTERS FOR USER ACCOUNTS */}
              <div className="prod-table-filters" style={{ marginTop: "0px", marginBottom: "20px" }}>
                <div className="search-input-wrapper">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Cari user berdasarkan username atau email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                </div>

                <CustomSelect
                  value={sortByUser}
                  onChange={setSortByUser}
                  options={[
                    { value: "", label: "Urutkan: Default" },
                    { value: "name-asc", label: "Urutkan: Nama A-Z" },
                    { value: "name-desc", label: "Urutkan: Nama Z-A" },
                    { value: "status-active", label: "Urutkan: Status Aktif" },
                    { value: "status-inactive", label: "Urutkan: Status Nonaktif" }
                  ]}
                  placeholder="Urutkan"
                />
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>No</th>
                      <th style={{ width: "80px" }}>Avatar</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th style={{ width: "160px", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsersList && usersList.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="admin-dash-empty-td">
                          <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
                            <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          Memuat data user...
                        </td>
                      </tr>
                    ) : filteredAndSortedUsersList.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="admin-dash-empty-td">
                          {usersList.length === 0 ? "Tidak ada data user terdaftar." : "Tidak ada data user sesuai kriteria filter."}
                        </td>
                      </tr>
                    ) : (
                      (() => {
                        const uItemsPerPage = 7;
                        const uIndexOfLastRow = usersCurrentPage * uItemsPerPage;
                        const uIndexOfFirstRow = uIndexOfLastRow - uItemsPerPage;
                        const uCurrentRows = filteredAndSortedUsersList.slice(uIndexOfFirstRow, uIndexOfLastRow);

                        return (
                          <>
                            {uCurrentRows.map((userRow, index) => {
                              const globalIndex = uIndexOfFirstRow + index + 1;
                              const isSelf = user && user.id_users === userRow.id_users;
                              const isActive = !userRow.deleted_at;

                              return (
                                <tr key={userRow.id_users}>
                                  <td>{globalIndex}</td>
                                  <td>
                                    {userRow.avatar ? (
                                      <img 
                                        src={userRow.avatar} 
                                        alt="Avatar" 
                                        style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} 
                                      />
                                    ) : (
                                      <div 
                                        style={{ 
                                          width: "32px", 
                                          height: "32px", 
                                          borderRadius: "50%", 
                                          backgroundColor: "#f1f5f9", 
                                          display: "flex", 
                                          alignItems: "center", 
                                          justifyContent: "center",
                                          color: "#64748b",
                                          fontSize: "12px",
                                          fontWeight: "600",
                                          border: "1px solid #cbd5e1"
                                        }}
                                      >
                                        {userRow.username.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <div className="admin-table-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      {userRow.username} 
                                      {isSelf && (
                                        <span style={{ 
                                          fontSize: "11px", 
                                          backgroundColor: "#ede9fe", 
                                          color: "var(--primary-color)", 
                                          fontWeight: "600",
                                          padding: "2px 6px",
                                          borderRadius: "4px"
                                        }}>
                                          Anda
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td>{userRow.email}</td>
                                  <td>
                                    <span 
                                      className="badge"
                                      style={{
                                        backgroundColor: userRow.role === "admin" ? "#f3e8ff" : "#f1f5f9",
                                        color: userRow.role === "admin" ? "#7c3aed" : "#475569",
                                        fontWeight: "600"
                                      }}
                                    >
                                      {userRow.role.toUpperCase()}
                                    </span>
                                  </td>
                                  <td>
                                    {isActive ? (
                                      <span className="badge badge-active">AKTIF</span>
                                    ) : (
                                      <span className="badge badge-overdue">NONAKTIF</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    {isSelf ? (
                                      <span style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>Tidak ada aksi</span>
                                    ) : isActive ? (
                                      <button
                                        className="btn-batal"
                                        style={{ 
                                          padding: "6px 12px", 
                                          fontSize: "12px", 
                                          borderRadius: "6px",
                                          border: "1px solid #fee2e2",
                                          backgroundColor: "#fff5f5",
                                          color: "#ef4444",
                                          fontWeight: "600",
                                          cursor: "pointer",
                                          transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = "#fee2e2";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = "#fff5f5";
                                        }}
                                        onClick={() => handleSoftDeleteUser(userRow.id_users, userRow.username)}
                                      >
                                        Nonaktifkan
                                      </button>
                                    ) : (
                                      <button
                                        className="btn-primary"
                                        style={{ 
                                          padding: "6px 12px", 
                                          fontSize: "12px", 
                                          borderRadius: "6px",
                                          border: "1px solid var(--primary-color)",
                                          backgroundColor: "#f5f3ff",
                                          color: "var(--primary-color)",
                                          fontWeight: "600",
                                          cursor: "pointer",
                                          transition: "all 0.2s"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = "#ede9fe";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = "#f5f3ff";
                                        }}
                                        onClick={() => handleRestoreUser(userRow.id_users, userRow.username)}
                                      >
                                        Pulihkan
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </>
                        );
                      })()
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION FOOTER */}
              {filteredAndSortedUsersList.length > 0 && (
                (() => {
                  const uItemsPerPage = 7;
                  const uIndexOfLastRow = usersCurrentPage * uItemsPerPage;
                  const uIndexOfFirstRow = uIndexOfLastRow - uItemsPerPage;
                  const uCurrentRows = filteredAndSortedUsersList.slice(uIndexOfFirstRow, uIndexOfLastRow);
                  const uTotalPages = Math.ceil(filteredAndSortedUsersList.length / uItemsPerPage);

                  return (
                    <div className="productivity-footer">
                      <div className="productivity-footer-text">
                        Menampilkan {uCurrentRows.length} dari {filteredAndSortedUsersList.length} user
                      </div>
                      <div className="pagination-controls">
                        <button
                          className="pagination-btn"
                          onClick={() => setUsersCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={usersCurrentPage === 1}
                        >
                          &lt;
                        </button>
                        {Array.from({ length: uTotalPages }, (_, idx) => idx + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            className={`pagination-btn ${usersCurrentPage === pageNum ? "active" : ""}`}
                            onClick={() => setUsersCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        ))}
                        <button
                          className="pagination-btn"
                          onClick={() => setUsersCurrentPage((prev) => Math.min(prev + 1, uTotalPages))}
                          disabled={usersCurrentPage === uTotalPages}
                        >
                          &gt;
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT GLOBAL CATEGORY */}
      {showCategoryModal && (
        <div className="modal-overlay active">
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <div className="modal-title">
                {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
              </div>
              <button
                type="button"
                className="btn-close-modal admin-dash-modal-close"
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryName("");
                  setEditingCategory(null);
                }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCategorySubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="dashboard-manage-cats-label">
                    {editingCategory ? `Edit Nama Kategori "${editingCategory.name}" *` : "Nama Kategori *"}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masukkan nama kategori"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-batal"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    setCategoryName("");
                  }}
                  disabled={categorySubmitting}
                >
                  Batal
                </button>
                <button type="submit" className="btn-simpan" disabled={categorySubmitting}>
                  {categorySubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="modal-overlay active admin-dash-modal-overlay">
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <div className={`modal-title ${confirmModal.isDanger ? "admin-dash-modal-title-danger" : "admin-dash-modal-title-default"}`}>
                {confirmModal.title}
              </div>
              <button
                type="button"
                className="btn-close-modal admin-dash-modal-close"
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="admin-dash-modal-body-text">
                {confirmModal.message}
              </p>
            </div>
            <div className="modal-footer admin-dash-modal-footer">
              <button
                type="button"
                className="btn-batal admin-dash-modal-btn-cancel"
                onClick={() => {
                  if (confirmModal.onCancel) confirmModal.onCancel();
                  setConfirmModal({ ...confirmModal, show: false });
                }}
              >
                {confirmModal.cancelText}
              </button>
               <button
                 type="button"
                 className={confirmModal.isDanger ? "btn-hapus-modal admin-dash-modal-btn-confirm" : "btn-simpan admin-dash-modal-btn-confirm"}
                 onClick={() => {
                   if (confirmModal.onConfirm) confirmModal.onConfirm();
                   setConfirmModal({ ...confirmModal, show: false });
                 }}
               >
                 {confirmModal.isDanger && (
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ fill: "none" }}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                   </svg>
                 )}
                 {confirmModal.confirmText}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      <div className={`toast-notification ${toast.show ? "active" : ""} ${toast.type}`}>
        <div className="toast-message">{toast.message}</div>
      </div>
    </div>
  );
}

function CustomSelect({ value, onChange, options, placeholder, isFormInput = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <div ref={dropdownRef} className="custom-select-container dashboard-select-container">
      <div 
        className={`custom-select-trigger ${isFormInput ? "dashboard-select-trigger-form" : "dashboard-select-trigger-filter"} ${isOpen ? "open" : ""} ${selectedOption && selectedOption.value !== "" ? "has-value" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2.5}
          className={`dashboard-select-icon ${isOpen ? "open" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div className="custom-select-options dashboard-select-options">
          {options.map((option) => (
            <div
              key={option.value}
              className={`custom-select-option dashboard-select-option ${String(value) === String(option.value) ? "selected" : ""}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {String(value) === String(option.value) && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

