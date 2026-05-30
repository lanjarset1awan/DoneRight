import { useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function useNotifications(token, showNotifBell) {
  const [notifications, setNotifications] = useState([]);

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
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, showNotifBell]);

  const handleReadNotif = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id_notifications === id ? { ...n, is_read: true } : n)
        );
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

  const handleDeleteNotif = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id_notifications !== id));
      }
    } catch (err) {
      console.error("Delete notification error:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    setNotifications,
    unreadCount,
    fetchNotifications,
    handleReadNotif,
    handleReadAllNotifs,
    handleDeleteNotif
  };
}
