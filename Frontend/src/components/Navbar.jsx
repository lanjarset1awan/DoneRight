import { useState, useEffect, useRef } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Navbar({
  token,
  title = "DoneRight",
  subtitle,
  user,
  onOpenProfile,
  onNavigateReport,
  onLogout,
  // Notification props
  showNotifBell = false,
  tasks = [],
  setSelectedTask,
  setShowDetailModal,
}) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifDropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!token || !showNotifBell) return;
    try {
      const res = await fetch(`${BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();

    function handleClickOutside(event) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, showNotifBell]);

  const handleReadNotif = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id_notifications === id ? { ...n, is_read: true } : n));
      }
    } catch (err) {
      console.error("Read notification error:", err);
    }
  };

  const handleReadAllNotifs = async () => {
    try {
      const res = await fetch(`${BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error("Read all notifications error:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const formatTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    return `${diffDays} hari yang lalu`;
  };

  return (
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
          <div className="navbar-title">{title}</div>
          {subtitle && <div className="navbar-subtitle">{subtitle}</div>}
        </div>
      </div>

      <div className="btn-group-row admin-dash-header-row" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Laporan Button (Admin) */}
        {onNavigateReport && (
          <button
            className="btn-primary admin-dash-btn-report"
            onClick={onNavigateReport}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="nav-btn-text">Laporan</span>
          </button>
        )}

        {/* NOTIFICATION BELL */}
        {showNotifBell && (
          <div className="notif-bell-container" ref={notifDropdownRef}>
            <button 
              className={`btn-notif-bell ${showNotifDropdown ? "active" : ""}`}
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              title="Notifikasi"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount}</span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <h3>Notifikasi</h3>
                  {unreadCount > 0 && (
                    <button type="button" className="btn-read-all" onClick={handleReadAllNotifs}>
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
                <div className="notif-dropdown-list animate-slide-down">
                  {notifications.length === 0 ? (
                    <div className="notif-empty-state">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="notif-empty-icon-svg">
                        <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5"/>
                        <path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7"/>
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4-.4"/>
                        <path d="m2 2 20 20"/>
                      </svg>
                      <p>Belum ada notifikasi</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id_notifications} 
                        className={`notif-item ${!notif.is_read ? "unread" : ""}`}
                        onClick={() => {
                          if (notif.task_id && setShowDetailModal && setSelectedTask) {
                            const foundTask = tasks.find(t => t.id_tasks === notif.task_id);
                            if (foundTask) {
                              setSelectedTask(foundTask);
                              setShowDetailModal(true);
                              setShowNotifDropdown(false);
                            }
                          }
                          if (!notif.is_read) {
                            handleReadNotif(notif.id_notifications);
                          }
                        }}
                      >
                        <div className="notif-item-dot-wrapper">
                          {!notif.is_read && <span className="notif-unread-dot"></span>}
                        </div>
                        <div className="notif-item-content">
                          <p className="notif-item-message">{notif.message}</p>
                          <div className="notif-item-meta">
                            {notif.task_deadline && (
                              <span className="notif-item-deadline">
                                Batas: {new Date(notif.task_deadline).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            <span className="notif-item-time">
                              {formatTimeAgo(notif.created_at)}
                            </span>
                          </div>
                        </div>
                        {!notif.is_read && (
                          <button 
                            type="button"
                            className="btn-mark-read-icon" 
                            title="Tandai dibaca"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReadNotif(notif.id_notifications);
                            }}
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profil Button */}
        {onOpenProfile && (
          <button 
            className="btn-secondary" 
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 12px" }} 
            onClick={onOpenProfile}
            type="button"
          >
            {user && user.avatar ? (
              <img 
                src={user.avatar} 
                alt="Avatar" 
                style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }} 
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
            <span className="nav-btn-text">Profil</span>
          </button>
        )}

        {/* Logout Button */}
        <button 
          className="btn-logout" 
          onClick={onLogout} 
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="nav-btn-text">Logout</span>
        </button>
      </div>
    </nav>
  );
}
