/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect */
import React, { useState, useEffect } from "react";
import "../style/pages/AdminDashboard.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function AdminDashboard({ token, user, onLogout, onNavigateReport }) {
  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // Load overview data automatically
  useEffect(() => {
    fetchOverviewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch based on Active Tab
  useEffect(() => {
    if (activeTab === "overview") {
      fetchOverviewData();
    } else if (activeTab === "all-tasks") {
      fetchAllTasks();
    } else if (activeTab === "overdue-tasks") {
      fetchOverdueTasks();
    } else if (activeTab === "categories") {
      fetchCategories();
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
  const activeCount = Math.max(0, totalTasksCount - completedTasksCount - overdueCount);
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

  return (
    <div>
      {/* NAVBAR */}
      <nav className="dashboard-navbar">
        <div className="navbar-brand">
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
          <div>
            <div className="navbar-title">DoneRight Admin</div>
            <div className="navbar-subtitle">Admin DoneRight</div>
          </div>
        </div>
        <div className="admin-dash-header-row">
          <button
            className="btn-primary admin-dash-btn-report"
            onClick={onNavigateReport}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Laporan
          </button>
          <button className="btn-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

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
              className={`admin-tab-btn ${activeTab === "all-tasks" ? "active" : ""}`}
              onClick={() => setActiveTab("all-tasks")}
            >
              Semua Tugas
            </button>
            <button
              className={`admin-tab-btn ${activeTab === "overdue-tasks" ? "active" : ""}`}
              onClick={() => setActiveTab("overdue-tasks")}
            >
              Tugas Overdue{" "}
              {overdueCount > 0 && <span className="admin-tab-badge">{overdueCount}</span>}
            </button>
            <button
              className={`admin-tab-btn ${activeTab === "categories" ? "active" : ""}`}
              onClick={() => setActiveTab("categories")}
            >
              Kelola Kategori
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
          </div>
        )}

        {/* TAB PANEL: SEMUA TUGAS */}
        {activeTab === "all-tasks" && (
          <div className="tab-panel active">
            <div className="board-card">
              <div className="board-title admin-dash-board-title">
                Monitoring Seluruh Tugas
              </div>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Judul</th>
                      <th>Prioritas</th>
                      <th>Status</th>
                      <th>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && allTasks.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="admin-dash-empty-td">
                          Memuat tugas...
                        </td>
                      </tr>
                    ) : allTasks.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="admin-dash-empty-td">
                          Tidak ada tugas terdaftar.
                        </td>
                      </tr>
                    ) : (
                      allTasks.map((task) => {
                        const now = new Date();
                        const deadline = task.deadline ? new Date(task.deadline) : null;

                        let statusBadge;
                        if (task.is_completed) {
                          statusBadge = <span className="badge badge-completed">COMPLETED</span>;
                        } else if (deadline && deadline < now) {
                          statusBadge = <span className="badge badge-overdue">OVERDUE</span>;
                        } else {
                          statusBadge = <span className="badge badge-active">ACTIVE</span>;
                        }

                        return (
                          <tr key={task.id_tasks}>
                            <td>
                              <div className="admin-table-title">{task.title}</div>
                              <div className="admin-table-subtitle">{task.description || "-"}</div>
                            </td>
                            <td>
                              <span className={`badge badge-${task.priority}`}>
                                {task.priority.toUpperCase()}
                              </span>
                            </td>
                            <td>{statusBadge}</td>
                            <td>{deadline ? deadline.toLocaleDateString("id-ID") : "-"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB PANEL: TUGAS OVERDUE */}
        {activeTab === "overdue-tasks" && (
          <div className="tab-panel active">
            <div className="board-card">
              <div className="board-title admin-dash-board-title">
                Tugas Overdue ({overdueCount})
              </div>
              <div className="overdue-list-row">
                {loading && overdueTasks.length === 0 ? (
                  <div className="empty-state">
                    <p>Memuat tugas overdue...</p>
                  </div>
                ) : overdueTasks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🎉</div>
                    <p>Hebat! Tidak ada tugas yang terlambat.</p>
                  </div>
                ) : (
                  overdueTasks.map((task) => {
                    const deadline = task.deadline ? new Date(task.deadline) : null;
                    return (
                      <div className="task-item-overdue" key={task.id_tasks}>
                        <h3 className="task-title admin-dash-task-item-title">
                          {task.title}
                        </h3>
                        <p className="task-desc admin-dash-task-item-desc">
                          {task.description || "-"}
                        </p>
                        <div className="task-badges">
                          <span className="badge badge-high admin-dash-badge-high">
                            HIGH
                          </span>
                          <span className="badge badge-deadline-overdue admin-dash-badge-overdue">
                            Deadline: {deadline ? deadline.toLocaleDateString("id-ID") : "-"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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
                             className="btn-delete-icon admin-dash-cat-del-icon"
                             onClick={() => handleDeleteCategory(cat.id_categories)}
                             title="Hapus Kategori"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="admin-dash-cat-svg-icon">
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
