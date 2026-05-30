import { useState, useRef } from "react";

export default function useProfileData(token, user, onUserUpdate, onLogout, onClose) {
  // Navigation states
  const [isEditing, setIsEditing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Form states
  const [username, setUsername] = useState(user ? user.username : "");
  const [email, setEmail] = useState(user ? user.email : "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Avatar states
  const [avatarData, setAvatarData] = useState(user ? user.avatar || "" : "");
  const [avatarPreview, setAvatarPreview] = useState(user ? user.avatar || "" : "");

  // Visibility states
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg("Ukuran file gambar tidak boleh melebihi 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setAvatarData(reader.result); // Base64 string
        setErrorMsg("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview("");
    setAvatarData("REMOVE_AVATAR");
    setErrorMsg("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      setErrorMsg("Nama lengkap dan email wajib diisi!");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        setErrorMsg("Password baru harus minimal 8 karakter!");
        return;
      }
      const hasSpecialChar = /[^a-zA-Z0-9]/.test(newPassword);
      if (!hasSpecialChar) {
        setErrorMsg("Password baru harus mengandung minimal 1 karakter unik/spesial!");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg("Konfirmasi password baru tidak cocok.");
        return;
      }
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      const response = await fetch(`${BASE_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: newPassword || null,
          avatar: avatarData || null,
        }),
      });

      let data = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server Error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(data.message || "Gagal memperbarui profil.");
      }

      onUserUpdate(data, newPassword || null);
      showToast("Profil berhasil diperbarui!", "success");
      setIsEditing(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Update profile error:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat memperbarui profil.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      const response = await fetch(`${BASE_URL}/users/profile`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus akun.");
      }

      setShowDeleteConfirm(false);
      onLogout();
    } catch (err) {
      console.error("Delete profile error:", err);
      setErrorMsg("Gagal menghapus akun. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setUsername(user ? user.username : "");
    setEmail(user ? user.email : "");
    setNewPassword("");
    setConfirmPassword("");
    setAvatarPreview(user ? user.avatar || "" : "");
    setAvatarData(user ? user.avatar || "" : "");
    setErrorMsg("");
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const plaintextPassword = user ? user.plaintextPassword || "" : "";

  return {
    isEditing,
    setIsEditing,
    isClosing,
    handleClose,
    username,
    setUsername,
    email,
    setEmail,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    avatarData,
    avatarPreview,
    currentPasswordVisible,
    setCurrentPasswordVisible,
    newPasswordVisible,
    setNewPasswordVisible,
    confirmPasswordVisible,
    setConfirmPasswordVisible,
    loading,
    errorMsg,
    setErrorMsg,
    toast,
    showDeleteConfirm,
    setShowDeleteConfirm,
    fileInputRef,
    handleAvatarChange,
    triggerFileSelect,
    handleRemoveAvatar,
    handleSubmit,
    handleDeleteAccount,
    handleCancelEdit,
    getInitials,
    plaintextPassword
  };
}
