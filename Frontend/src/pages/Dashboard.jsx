import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import "../style/pages/Dashboard.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function CustomSelect({ value, onChange, options, placeholder, isFormInput = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
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

export default function Dashboard({ token, user, onLogout, onNavigateReport, onNavigateTrash, onOpenProfile }) {
  // State
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("list");

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
    confirmText: "Ya, Hapus",
    cancelText: "Batal",
    isDanger: true,
    isCategoryDelete: false,
    onKeepTasks: null,
    onDeleteTasks: null
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  // Selected Items for modals
  const [selectedTask, setSelectedTask] = useState(null); // for Detail view
  const [editingTask, setEditingTask] = useState(null); // for edit inside Task Modal

  // Form states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskCategory, setTaskCategory] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDeadline, setTaskDeadline] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${BASE_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Tasks fetch error:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Categories fetch error:", err);
    }
  };



  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchTasks(), fetchCategories()]);
    } catch (err) {
      console.error("Initial load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Data on Load and handle click outside
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Checkbox Toggle Completion
  const handleToggleCompleted = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/tasks/toggle/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error("Toggle completion error:", err);
    }
  };

  // Submit Task (Add or Edit)
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskPriority || !taskDeadline) {
      showToast("Kolom dengan bintang (*) wajib diisi!", "warning");
      return;
    }

    setTaskSubmitting(true);
    const bodyData = {
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      category_id: taskCategory ? parseInt(taskCategory, 10) : null,
      priority: taskPriority,
      deadline: taskDeadline,
    };

    try {
      let url = `${BASE_URL}/tasks`;
      let method = "POST";

      if (editingTask) {
        url = `${BASE_URL}/tasks/${editingTask.id_tasks}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) throw new Error("Gagal menyimpan tugas.");

      setShowTaskModal(false);
      await fetchTasks();
      showToast(editingTask ? "Tugas berhasil diperbarui!" : "Tugas baru berhasil ditambahkan!", "success");
    } catch (err) {
      console.error("Task submit error:", err);
      showToast(err.message || "Gagal menyimpan tugas.", "error");
    } finally {
      setTaskSubmitting(false);
    }
  };

  // Submit Category
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      showToast("Nama kategori wajib diisi!", "warning");
      return;
    }

    setCategorySubmitting(true);
    try {
      let url = `${BASE_URL}/categories`;
      let method = "POST";

      if (editingCategory) {
        url = `${BASE_URL}/categories/${editingCategory.id_categories}`;
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

      setEditingCategory(null);
      setCategoryName("");
      await fetchCategories();
      await fetchTasks();
      showToast(editingCategory ? "Kategori berhasil diperbarui!" : "Kategori kustom baru berhasil dibuat!", "success");
    } catch (err) {
      console.error("Category save error:", err);
      showToast("Terjadi kesalahan saat menyimpan kategori.", "error");
    } finally {
      setCategorySubmitting(false);
    }
  };

  // Delete Category Actual
  const executeDeleteCategory = async (id, mode) => {
    try {
      const res = await fetch(`${BASE_URL}/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode }),
      });

      if (!res.ok) throw new Error("Gagal menghapus kategori.");

      await fetchCategories();
      await fetchTasks();
      showToast("Kategori berhasil dihapus!", "success");
    } catch (err) {
      console.error("Delete category error:", err);
      showToast(err.message || "Gagal menghapus kategori.", "error");
    }
  };

  // Delete Category
  const handleDeleteCategory = (id) => {
    setConfirmModal({
      show: true,
      title: "Hapus Kategori",
      message: "Apakah Anda yakin ingin menghapus kategori ini? Pilih opsi di bawah untuk menentukan nasib tugas yang ada di dalamnya:",
      confirmText: "Hapus Kategori & Seluruh Tugas",
      cancelText: "Batal",
      isDanger: true,
      isCategoryDelete: true,
      onDeleteTasks: () => executeDeleteCategory(id, "delete_tasks"),
      onKeepTasks: () => executeDeleteCategory(id, "keep_tasks"),
      onCancel: () => {}
    });
  };

  // Delete Task Actual
  const executeDeleteTask = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setShowDetailModal(false);
        await fetchTasks();
        showToast("Tugas dipindahkan ke keranjang sampah", "success");
      }
    } catch (err) {
      console.error("Delete task error:", err);
    }
  };

  // Delete Task
  const handleDeleteTask = (id) => {
    setConfirmModal({
      show: true,
      title: "Hapus Tugas",
      message: "Apakah Anda yakin ingin menghapus tugas ini? Tugas ini akan dipindahkan ke keranjang sampah.",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      isDanger: true,
      isCategoryDelete: false,
      onConfirm: () => executeDeleteTask(id),
      onCancel: () => {}
    });
  };

  // Open modals helper
  const openAddTask = () => {
    setEditingTask(null);
    setTaskTitle("");
    setTaskDesc("");
    setTaskCategory("");
    setTaskPriority("medium");
    setTaskDeadline("");
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || "");
    setTaskCategory(task.category_id || "");
    setTaskPriority(task.priority);
    // Format deadline for datetime-local input
    if (task.deadline) {
      const date = new Date(task.deadline);
      const tzOffset = date.getTimezoneOffset() * 60000;
      const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
      setTaskDeadline(localISOTime);
    } else {
      setTaskDeadline("");
    }
    setShowDetailModal(false);
    setShowTaskModal(true);
  };

  // Calculation Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter Tasks Client-side
  const filteredTasks = tasks.filter((task) => {
    // Keyword filter
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()));

    // Category filter
    let matchesCategory = true;
    if (filterCategory) {
      if (filterCategory === "null") {
        matchesCategory = !task.category_id;
      } else {
        matchesCategory = task.category_id === parseInt(filterCategory, 10);
      }
    }

    // Priority filter
    const matchesPriority = filterPriority ? task.priority === filterPriority : true;

    // Status filter
    let matchesStatus = true;
    const now = new Date();
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const completedAt = task.completed_at ? new Date(task.completed_at) : null;
    const isOverdue = deadline && (
      (!task.is_completed && deadline < now) ||
      (task.is_completed && completedAt && completedAt > deadline)
    );

    if (filterStatus === "pending") {
      matchesStatus = !task.is_completed && !isOverdue;
    } else if (filterStatus === "done") {
      matchesStatus = task.is_completed;
    } else if (filterStatus === "overdue") {
      matchesStatus = isOverdue;
    }

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  })
    .sort((a, b) => {
      if (sortBy === "deadline") {
        return new Date(a.deadline) - new Date(b.deadline);
      }

      if (sortBy === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      }

      const priorityOrder = {
        high: 0,
        medium: 1,
        low: 2,
      };

      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });


  const groupedTasks = filteredTasks.reduce((groups, task) => {
    const key = task.category_name || "Tanpa Kategori";

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(task);

    return groups;
  }, {});



  return (
    <div>
      {/* NAVBAR */}
      <Navbar
        title="DoneRight"
        subtitle={`Selamat datang, ${user ? user.username : "Pengguna"}`}
        user={user}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
        token={token}
        showNotifBell={true}
        tasks={tasks}
        setSelectedTask={setSelectedTask}
        setShowDetailModal={setShowTaskModal}
      />

      {/* MAIN CONTAINER */}
      <div className="dashboard-container">
        {/* PROGRESS BANNER */}
        <div className="progress-banner">
          <div className="progress-banner-title">Progress Penyelesaian Tugas</div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <div className="progress-stats">
            <span>
              {completedTasks} dari {totalTasks} tugas selesai
            </span>
            <span className="progress-percentage">{progressPercent}%</span>
          </div>
        </div>

        {/* DAFTAR TUGAS FILTER BOARD */}
        <div className="board-card">
          <div className="board-header">
            <div className="dashboard-actions-left">
              <div className="board-title">Daftar Tugas</div>

              <div className="dashboard-viewmode-switcher">
                <button
                  onClick={() => setViewMode("list")}
                  className={`dashboard-viewmode-btn ${viewMode === "list" ? "active" : ""}`}
                >
                  Daftar
                </button>

                <button
                  onClick={() => setViewMode("grouped")}
                  className={`dashboard-viewmode-btn ${viewMode === "grouped" ? "active" : ""}`}
                >
                  Per Kategori
                </button>
              </div>
            </div>
            <div className="btn-group-row">
              <button
                className="btn-primary dashboard-btn-report"
                onClick={onNavigateReport}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Laporan
              </button>
              <button
                className="btn-secondary dashboard-btn-trash"
                onClick={onNavigateTrash}
                title="Keranjang Sampah"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Sampah
              </button>
              <button
                className="btn-secondary dashboard-btn-admin"
                onClick={() => setShowCategoryModal(true)}
              >
                <span className="btn-icon-add">+</span> Kategori
              </button>
              <button className="btn-primary dashboard-btn-add" onClick={openAddTask}>
                <span className="btn-icon-add">+</span> Tambah Tugas
              </button>
            </div>
          </div>

          {/* FILTERS */}
          <div className="filters-grid">
            <input
              type="text"
              className="filter-input"
              placeholder="Cari tugas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <CustomSelect
              value={filterCategory}
              onChange={setFilterCategory}
              options={[
                { value: "", label: "Semua Kategori" },
                { value: "null", label: "Tanpa Kategori" },
                ...categories.map((cat) => ({
                  value: cat.id_categories,
                  label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1)
                }))
              ]}
              placeholder="Pilih Kategori"
            />

            <CustomSelect
              value={filterPriority}
              onChange={setFilterPriority}
              options={[
                { value: "", label: "Semua Prioritas" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" }
              ]}
              placeholder="Pilih Prioritas"
            />

            <CustomSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: "", label: "Semua Status" },
                { value: "done", label: "Selesai" },
                { value: "pending", label: "Belum Selesai" },
                { value: "overdue", label: "Overdue" }
              ]}
              placeholder="Pilih Status"
            />

            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "deadline", label: "Urutkan: Deadline" },
                { value: "priority", label: "Urutkan: Prioritas" },
                { value: "newest", label: "Urutkan: Terbaru" }
              ]}
              placeholder="Urutkan"
            />
          </div>
        </div>



        {/* TASKS LIST */}
        <div id="taskListContainer">
          {loading ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p>Memuat tugas...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎉</div>
              <p>Tidak ada tugas terdaftar sesuai kriteria filter.</p>
            </div>
          ) : viewMode === "list" ? (
            filteredTasks.map((task) => {
              const deadline = task.deadline ? new Date(task.deadline) : null;
              const completedAt = task.completed_at ? new Date(task.completed_at) : null;
              const now = new Date();
              const isOverdue = deadline && (
                (!task.is_completed && deadline < now) ||
                (task.is_completed && completedAt && completedAt > deadline)
              );


              return (
                <div className="task-item" key={task.id_tasks}>
                  <div className="task-left">
                    <div className="task-title-row">
                      <div
                        className={`todo-checkbox ${task.is_completed ? "checked" : ""}`}
                        onClick={() =>
                          handleToggleCompleted(task.id_tasks)
                        }
                      ></div>

                      <h3 className={`task-title ${task.is_completed ? "completed" : ""}`}>
                        {task.title}
                      </h3>
                    </div>

                    {task.description && (
                      <p className="task-desc">{task.description}</p>
                    )}

                    <div className="task-badges">
                      <span className={`badge badge-${task.priority}`}>
                        {task.priority.toUpperCase()}
                      </span>

                      {task.category_name && (
                        <span className="badge badge-category">
                          {task.category_name}
                        </span>
                      )}

                      {deadline && (
                        <span className="badge badge-deadline">
                          Deadline:{" "}
                          {deadline.toLocaleDateString("id-ID")}
                        </span>
                      )}

                      {task.is_completed && (
                        <span className="badge badge-completed">
                          ✓ Selesai
                        </span>
                      )}

                      {isOverdue && (
                        <span className="badge badge-overdue">
                          ⚠ Overdue
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="task-right">
                    <button
                      className="btn-detail"
                      onClick={() => {
                        setSelectedTask(task);
                        setShowDetailModal(true);
                      }}
                    >
                      Detail
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            Object.entries(groupedTasks).map(([category, categoryTasks]) => (
              <div
                key={category}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "20px",
                  marginBottom: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: "10px",
                  }}
                >
                  <h3 style={{ fontSize: "18px", fontWeight: 700 }}>
                    {category}
                  </h3>

                  <span
                    style={{
                      background: "#e0e7ff",
                      color: "#4338ca",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {categoryTasks.length} tugas
                  </span>
                </div>

                {categoryTasks.map((task) => {
                  const deadline = task.deadline ? new Date(task.deadline) : null;
                  const completedAt = task.completed_at ? new Date(task.completed_at) : null;
                  const now = new Date();
                  const isOverdue = deadline && (
                    (!task.is_completed && deadline < now) ||
                    (task.is_completed && completedAt && completedAt > deadline)
                  );


                  return (
                    <div className="task-item" key={task.id_tasks}>
                      <div className="task-left">
                        <div className="task-title-row">
                          <div
                            className={`todo-checkbox ${task.is_completed ? "checked" : ""}`}
                            onClick={() =>
                              handleToggleCompleted(task.id_tasks)
                            }
                          ></div>

                          <h3 className={`task-title ${task.is_completed ? "completed" : ""}`}>
                            {task.title}
                          </h3>
                        </div>

                        {task.description && (
                          <p className="task-desc">{task.description}</p>
                        )}

                        <div className="task-badges">
                          <span className={`badge badge-${task.priority}`}>
                            {task.priority.toUpperCase()}
                          </span>

                          {deadline && (
                            <span className="badge badge-deadline">
                              Deadline:{" "}
                              {deadline.toLocaleDateString("id-ID")}
                            </span>
                          )}

                          {task.is_completed && (
                            <span className="badge badge-completed">
                              ✓ Selesai
                            </span>
                          )}

                          {isOverdue && (
                            <span className="badge badge-overdue">
                              ⚠ Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="task-right">
                        <button
                          className="btn-detail"
                          onClick={() => {
                            setSelectedTask(task);
                            setShowDetailModal(true);
                          }}
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* MODAL: ADD / EDIT TASK */}
        {showTaskModal && (
          <div className="modal-overlay active">
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-title">
                  {editingTask ? "Edit Detail Tugas" : "Tambah Tugas Baru"}
                </div>
                <button
                  type="button"
                  className="btn-close-modal dashboard-modal-close"
                  onClick={() => setShowTaskModal(false)}
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleTaskSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Judul Tugas *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Masukkan judul tugas"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      required
                      disabled={taskSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label>Deskripsi</label>
                    <textarea
                      className="form-input"
                      placeholder="Deskripsi tugas (opsional)"
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      disabled={taskSubmitting}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Kategori</label>
                    <CustomSelect
                      value={taskCategory}
                      onChange={setTaskCategory}
                      isFormInput={true}
                      options={[
                        { value: "", label: "Tanpa Kategori" },
                        ...categories.map((cat) => ({
                          value: cat.id_categories,
                          label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1)
                        }))
                      ]}
                      placeholder="Pilih Kategori"
                    />
                  </div>

                  <div className="form-group">
                    <label>Prioritas *</label>
                    <CustomSelect
                      value={taskPriority}
                      onChange={setTaskPriority}
                      isFormInput={true}
                      options={[
                        { value: "high", label: "High" },
                        { value: "medium", label: "Medium" },
                        { value: "low", label: "Low" }
                      ]}
                      placeholder="Pilih Prioritas"
                    />
                  </div>

                  <div className="form-group">
                    <label>Deadline *</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      required
                      disabled={taskSubmitting}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-batal"
                    onClick={() => setShowTaskModal(false)}
                    disabled={taskSubmitting}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn-simpan" disabled={taskSubmitting}>
                    {taskSubmitting ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DETAIL VIEW */}
        {showDetailModal && selectedTask && (
          <div className="modal-overlay active">
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-title">Detail Tugas</div>
                <button
                  type="button"
                  className="btn-close-modal dashboard-modal-close"
                  onClick={() => setShowDetailModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-grid dashboard-detail-grid">
                  <div className="detail-item dashboard-detail-item-full">
                    <span className="detail-label">Judul</span>
                    <span className="detail-value dashboard-detail-title">{selectedTask.title}</span>
                  </div>

                  <div className="detail-item dashboard-detail-item-full">
                    <span className="detail-label">Deskripsi</span>
                    <span className="detail-value detail-value-span dashboard-detail-desc">
                      {selectedTask.description || "-"}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Kategori</span>
                    <span className="detail-value">
                      {selectedTask.category_name
                        ? selectedTask.category_name.charAt(0).toUpperCase() +
                        selectedTask.category_name.slice(1)
                        : "-"}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Prioritas</span>
                    <span className={`badge badge-${selectedTask.priority} dashboard-detail-badge`}>
                      {selectedTask.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Deadline</span>
                    <span className="detail-value">
                      {selectedTask.deadline
                        ? new Date(selectedTask.deadline).toLocaleString("id-ID")
                        : "-"}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <div className="dashboard-detail-status-wrapper">
                      {selectedTask.is_completed ? (
                        <span className="badge badge-completed dashboard-detail-badge">✓ Selesai</span>
                      ) : (selectedTask.deadline && new Date(selectedTask.deadline) < new Date() ? (
                        <span className="badge badge-overdue dashboard-detail-badge">⚠ Overdue</span>
                      ) : (
                        <span className="badge badge-pending dashboard-detail-badge" style={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", color: "#64748b", fontWeight: 600 }}>Aktif</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-hapus-modal"
                  onClick={() => handleDeleteTask(selectedTask.id_tasks)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus
                </button>
                <button
                  type="button"
                  className="btn-edit-modal"
                  onClick={() => openEditTask(selectedTask)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-batal"
                  onClick={() => setShowDetailModal(false)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD CUSTOM CATEGORY */}
        {showCategoryModal && (
          <div className="modal-overlay active">
            <div className="modal-content" style={{ maxWidth: "420px" }}>
              <div className="modal-header">
                <div className="modal-title">Kelola Kategori</div>
                <button
                  type="button"
                  className="btn-close-modal dashboard-modal-close"
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
                  <div className="form-group dashboard-manage-cats-group">
                    <label className="dashboard-manage-cats-label">
                      {editingCategory ? `Edit Kategori "${editingCategory.name}" *` : "Tambah Kategori Baru *"}
                    </label>
                    <div className="dashboard-manage-cats-input-row">
                      <input
                        type="text"
                        className="form-input dashboard-manage-cats-input"
                        placeholder="Masukkan nama kategori"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        required
                        disabled={categorySubmitting}
                      />
                      <button type="submit" className="btn-simpan dashboard-manage-cats-btn-add" disabled={categorySubmitting}>
                        {categorySubmitting ? "..." : editingCategory ? "Simpan" : "Tambah"}
                      </button>
                      {editingCategory && (
                        <button
                          type="button"
                          className="btn-batal dashboard-manage-cats-btn-close"
                          onClick={() => {
                            setEditingCategory(null);
                            setCategoryName("");
                          }}
                        >
                          Batal
                        </button>
                      )}
                    </div>
                  </div>

                  <hr className="dashboard-manage-cats-divider" />

                  <div className="form-group dashboard-manage-cats-list-container">
                    <label className="dashboard-manage-cats-list-title">Daftar Kategori Kustom</label>
                    {categories.filter(cat => !cat.is_global).length === 0 ? (
                      <p className="dashboard-manage-cats-empty">Belum ada kategori kustom.</p>
                    ) : (
                      <div className="dashboard-manage-cats-list">
                        {categories.filter(cat => !cat.is_global).map((cat) => (
                          <div
                            key={cat.id_categories}
                            className="dashboard-manage-cats-item"
                          >
                            <span className="dashboard-manage-cats-item-name">
                              {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                            </span>
                            <div className="dashboard-manage-cats-item-actions">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setCategoryName(cat.name);
                                }}
                                className="dashboard-manage-cats-item-btn dashboard-manage-cats-item-btn-edit"
                                title="Edit Kategori"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id_categories)}
                                className="dashboard-manage-cats-item-btn dashboard-manage-cats-item-btn-delete"
                                title="Hapus Kategori"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer dashboard-manage-cats-footer">
                  <button
                    type="button"
                    className="btn-batal dashboard-manage-cats-footer-btn"
                    onClick={() => {
                      setShowCategoryModal(false);
                      setCategoryName("");
                      setEditingCategory(null);
                    }}
                  >
                    Tutup
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* CUSTOM CONFIRMATION MODAL */}
        {confirmModal.show && (
          <div className="modal-overlay active" style={{ zIndex: 200 }}>
            <div className="modal-content" style={{ maxWidth: "420px" }}>
              <div className="modal-header">
                <div className={`modal-title ${confirmModal.isDanger ? "dashboard-detail-item-full text-danger" : ""}`}>
                  {confirmModal.title}
                </div>
                <button
                  type="button"
                  className="btn-close-modal dashboard-modal-close"
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <p className="dashboard-detail-desc">
                  {confirmModal.message}
                </p>
              </div>
              <div className="modal-footer dashboard-cat-del-footer">
                {confirmModal.isCategoryDelete ? (
                  <>
                    <button
                      type="button"
                      className="btn-hapus-modal dashboard-cat-del-btn-option"
                      onClick={() => {
                        if (confirmModal.onDeleteTasks) confirmModal.onDeleteTasks();
                        setConfirmModal({ ...confirmModal, show: false });
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ fill: "none" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus Kategori & Seluruh Tugas
                    </button>
                    <button
                      type="button"
                      className="btn-hapus-modal dashboard-cat-del-btn-option"
                      onClick={() => {
                        if (confirmModal.onKeepTasks) confirmModal.onKeepTasks();
                        setConfirmModal({ ...confirmModal, show: false });
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ fill: "none" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus Kategori Saja (Simpan Tugas)
                    </button>
                    <button
                      type="button"
                      className="btn-batal dashboard-cat-del-btn-cancel"
                      onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                    >
                      Batal
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-batal"
                      onClick={() => {
                        if (confirmModal.onCancel) confirmModal.onCancel();
                        setConfirmModal({ ...confirmModal, show: false });
                      }}
                      style={{ margin: 0, padding: "10px 20px" }}
                    >
                      {confirmModal.cancelText}
                    </button>
                    <button
                      type="button"
                      className={confirmModal.isDanger ? "btn-hapus-modal" : "btn-simpan"}
                      onClick={() => {
                        if (confirmModal.onConfirm) confirmModal.onConfirm();
                        setConfirmModal({ ...confirmModal, show: false });
                      }}
                      style={{ margin: 0, padding: "10px 24px", display: "inline-flex", gap: "6px", alignItems: "center", justifyContent: "center" }}
                    >
                      {confirmModal.isDanger && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ fill: "none" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                      {confirmModal.confirmText}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        <div className={`toast-notification ${toast.show ? "active" : ""} ${toast.type}`}>
          <div className="toast-message">{toast.message}</div>
        </div>
      </div>
    </div>
  );
}
