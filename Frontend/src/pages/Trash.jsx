import { useState, useEffect } from "react";
import "../style/pages/Trash.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Trash({ token, onLogout, onNavigateDashboard }) {
  const [trashTasks, setTrashTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
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

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/tasks/trash`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrashTasks(data);
      }
    } catch (err) {
      console.error("Fetch trash error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTrash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore task (individual)
  const handleRestore = async (id) => {
    setProcessing(true);
    try {
      const res = await fetch(`${BASE_URL}/tasks/restore/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchTrash();
      }
    } catch (err) {
      console.error("Restore task error:", err);
    } finally {
      setProcessing(false);
    }
  };

  // Delete permanently actual
  const executeDeletePermanent = async (id) => {
    setProcessing(true);
    try {
      const res = await fetch(`${BASE_URL}/tasks/permanent/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchTrash();
      }
    } catch (err) {
      console.error("Delete permanent error:", err);
    } finally {
      setProcessing(false);
    }
  };

  // Delete permanently (individual)
  const handleDeletePermanent = (id) => {
    setConfirmModal({
      show: true,
      title: "Hapus Permanen",
      message: "Apakah Anda yakin ingin menghapus tugas ini secara PERMANEN? Tindakan ini tidak dapat dibatalkan!",
      confirmText: "Ya, Hapus Permanen",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: () => executeDeletePermanent(id),
      onCancel: () => {}
    });
  };

  // Restore all actual
  const executeRestoreAll = async () => {
    setProcessing(true);
    try {
      await Promise.all(
        trashTasks.map((task) =>
          fetch(`${BASE_URL}/tasks/restore/${task.id_tasks}`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      await fetchTrash();
    } catch (err) {
      console.error("Restore all error:", err);
    } finally {
      setProcessing(false);
    }
  };

  // Restore All Tasks
  const handleRestoreAll = () => {
    if (trashTasks.length === 0) return;
    setConfirmModal({
      show: true,
      title: "Pulihkan Semua Tugas",
      message: "Apakah Anda yakin ingin memulihkan SEMUA tugas di keranjang sampah kembali ke Dashboard?",
      confirmText: "Ya, Pulihkan",
      cancelText: "Batal",
      isDanger: false,
      onConfirm: () => executeRestoreAll(),
      onCancel: () => {}
    });
  };

  // Clear all actual
  const executeClearAll = async () => {
    setProcessing(true);
    try {
      await Promise.all(
        trashTasks.map((task) =>
          fetch(`${BASE_URL}/tasks/permanent/${task.id_tasks}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      await fetchTrash();
    } catch (err) {
      console.error("Clear all error:", err);
    } finally {
      setProcessing(false);
    }
  };

  // Delete All Permanently
  const handleClearAll = () => {
    if (trashTasks.length === 0) return;
    setConfirmModal({
      show: true,
      title: "Kosongkan Tempat Sampah",
      message: "PERINGATAN! Apakah Anda yakin ingin menghapus SEMUA tugas di keranjang sampah secara PERMANEN?\nTindakan ini tidak dapat dibatalkan!",
      confirmText: "Ya, Hapus Semua",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: () => executeClearAll(),
      onCancel: () => {}
    });
  };

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
            <div className="navbar-title">DoneRight</div>
            <div className="navbar-subtitle">
              Keranjang Sampah & Restorasi
            </div>
          </div>
        </div>
        <button className="btn-logout" onClick={onLogout}>
          Logout
        </button>
      </nav>

      {/* MAIN CONTAINER */}
      <div className="dashboard-container">
        {/* HEADER ROW WITH ACTION BUTTONS */}
        <div className="trash-header-row">
          <button 
            className="btn-secondary trash-btn-back" 
            onClick={onNavigateDashboard}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Dashboard
          </button>

          {trashTasks.length > 0 && (
            <div className="btn-group-row" style={{ gap: "10px" }}>
              <button
                className="btn-secondary trash-btn-restore-all"
                onClick={handleRestoreAll}
                disabled={processing}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                </svg>
                Pulihkan Semua
              </button>
              <button
                className="btn-primary trash-btn-clear-all"
                onClick={handleClearAll}
                disabled={processing}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Kosongkan Sampah
              </button>
            </div>
          )}
        </div>

        {/* TRASHED TASKS BOARD */}
        <div className="board-card trash-board-card">
          <div className="board-header trash-board-header">
            <div className="board-title trash-board-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Keranjang Sampah ({trashTasks.length})
            </div>
          </div>

          {/* LIST INSIDE BOARD CARD */}
          <div>
            {loading ? (
              <div className="empty-state">
                <div className="empty-state-icon">🗑️</div>
                <p>Memuat keranjang sampah...</p>
              </div>
            ) : trashTasks.length === 0 ? (
              <div className="empty-state trash-empty-state">
                <div className="empty-state-icon trash-empty-icon">
                  🗑️
                </div>
                <h3 className="trash-empty-title">
                  Keranjang Sampah Kosong
                </h3>
                <p className="trash-empty-subtitle">
                  Tugas yang Anda hapus sementara akan tampil di sini untuk dipulihkan kembali.
                </p>
              </div>
            ) : (
              <div className="trash-list-container">
                {trashTasks.map((task) => {
                  const deadline = task.deadline ? new Date(task.deadline) : null;
                  return (
                    <div className="task-item trash-task-item" key={task.id_tasks}>
                      <div className="task-left">
                        <h3 className="task-title trash-task-title">
                          {task.title}
                        </h3>
                        {task.description && <p className="task-desc">{task.description}</p>}

                        <div className="task-badges">
                          <span className={`badge badge-${task.priority}`}>
                            {task.priority.toUpperCase()}
                          </span>
                          {task.category_name && (
                            <span className="badge badge-category">
                              {task.category_name.charAt(0).toUpperCase() + task.category_name.slice(1)}
                            </span>
                          )}
                          {deadline && (
                            <span className="badge badge-deadline">
                              Deadline: {deadline.toLocaleDateString("id-ID")}{" "}
                              {deadline.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="task-right trash-task-right">
                        <button
                          onClick={() => handleRestore(task.id_tasks)}
                          disabled={processing}
                          className="trash-btn-restore-single"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                          </svg>
                          Pulihkan
                        </button>
                        <button
                          onClick={() => handleDeletePermanent(task.id_tasks)}
                          disabled={processing}
                          className="trash-btn-delete-permanent"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus Permanen
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="modal-overlay active trash-modal-overlay">
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: confirmModal.isDanger ? "#ef4444" : "#0f172a" }}>
                {confirmModal.title}
              </div>
              <button
                type="button"
                className="trash-modal-close"
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="trash-modal-body-text">
                {confirmModal.message}
              </p>
            </div>
            <div className="modal-footer trash-modal-footer">
              <button
                type="button"
                className="btn-batal trash-btn-modal-cancel"
                onClick={() => {
                  if (confirmModal.onCancel) confirmModal.onCancel();
                  setConfirmModal({ ...confirmModal, show: false });
                }}
              >
                {confirmModal.cancelText}
              </button>
              <button
                type="button"
                className={`${confirmModal.isDanger ? "btn-hapus-modal" : "btn-simpan"} trash-btn-modal-confirm`}
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
    </div>
  </div>
);
}
