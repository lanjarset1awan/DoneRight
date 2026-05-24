import { useState, useRef } from "react";
import "../style/pages/Profile.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Profile({ token, user, onUserUpdate, onLogout, onClose }) {
  // Navigation states
  const [isEditing, setIsEditing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

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

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef(null);

  // Get initials for placeholder avatar
  const getInitials = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  // Plaintext password entered at login (if available)
  const plaintextPassword = user ? user.plaintextPassword || "" : "";

  // Handle avatar file selection
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

  // Trigger file selection click
  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Submit Profile update
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

      // Update parent state & localStorage user
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

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
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
      onLogout(); // Log user out and clean local storage
    } catch (err) {
      console.error("Delete profile error:", err);
      setErrorMsg("Gagal menghapus akun. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit mode
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

  return (
    <div className={`profile-body ${isClosing ? "closing" : ""}`}>
      <div className={`profile-container ${isClosing ? "closing" : ""}`}>
        
        {/* ALERTS */}
        {errorMsg && (
          <div className="profile-error-alert">
            <span>⚠ {errorMsg}</span>
          </div>
        )}

        {/* MAIN PROFILE CARD */}
        <div className="profile-card">
          <button className="profile-close-btn" onClick={handleClose} aria-label="Close Profile">
             &times;
          </button>
          
          <h2 style={{ textAlign: "center", marginBottom: "24px", color: "#0f172a", fontSize: "24px", fontWeight: "700" }}>
            {isEditing ? "Edit Profil Saya" : "Profil Saya"}
          </h2>

          {/* AVATAR SECTION */}
          <div className="profile-avatar-container">
            <div className="profile-avatar-wrapper">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Foto Profil" className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {getInitials(username || user?.username)}
                </div>
              )}

              {/* CAMERA OVERLAY (only in edit mode) */}
              {isEditing && (
                <div className="profile-camera-btn" onClick={triggerFileSelect} title="Ganti Foto Profil">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* HIDDEN FILE INPUT */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>

          {/* VIEW MODE */}
          {!isEditing ? (
            <div>
              {/* NAMA LENGKAP */}
              <div className="form-group">
                <label className="profile-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="form-input profile-input-readonly"
                  value={user ? user.username : ""}
                  readOnly
                />
              </div>

              {/* EMAIL */}
              <div className="form-group">
                <label className="profile-label">Alamat Email</label>
                <input
                  type="email"
                  className="form-input profile-input-readonly"
                  value={user ? user.email : ""}
                  readOnly
                />
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <div className="profile-label-row">
                  <label className="profile-label">Kata Sandi</label>
                  <button className="profile-link-btn" onClick={() => setIsEditing(true)}>
                    Ubah Kata Sandi
                  </button>
                </div>
                <div className="profile-field-container">
                  <input
                    type={currentPasswordVisible ? "text" : "password"}
                    className="form-input profile-input-readonly"
                    value={
                      plaintextPassword 
                        ? plaintextPassword 
                        : (currentPasswordVisible ? "Sandi dienkripsi di DB" : "••••••••")
                    }
                    readOnly
                  />
                  <button 
                    type="button" 
                    className="profile-eye-btn" 
                    onClick={() => setCurrentPasswordVisible(!currentPasswordVisible)}
                    title={currentPasswordVisible ? "Sembunyikan" : "Tampilkan"}
                  >
                    {currentPasswordVisible ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <button 
                className="btn-edit-modal" 
                onClick={() => setIsEditing(true)}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "12px" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                EDIT PROFIL
              </button>

              <button 
                className="btn-hapus-modal" 
                onClick={() => setShowDeleteConfirm(true)}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "12px", margin: "12px 0 0 0" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus Akun
              </button>
            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSubmit}>
              {/* NAMA LENGKAP */}
              <div className="form-group">
                <label className="profile-label">Nama Lengkap *</label>
                <input
                  type="text"
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  required
                  disabled={loading}
                />
              </div>

              {/* EMAIL */}
              <div className="form-group">
                <label className="profile-label">Alamat Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  disabled={loading}
                />
              </div>

              {/* KATA SANDI BARU */}
              <div className="form-group">
                <label className="profile-label">Kata Sandi Baru</label>
                <div className="profile-field-container">
                  <input
                    type={newPasswordVisible ? "text" : "password"}
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    disabled={loading}
                  />
                  <button 
                    type="button" 
                    className="profile-eye-btn" 
                    onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                  >
                    {newPasswordVisible ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* KONFIRMASI KATA SANDI BARU */}
              <div className="form-group">
                <label className="profile-label">Konfirmasi Kata Sandi Baru</label>
                <div className="profile-field-container">
                  <input
                    type={confirmPasswordVisible ? "text" : "password"}
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi kata sandi baru"
                    disabled={loading || !newPassword}
                  />
                  <button 
                    type="button" 
                    className="profile-eye-btn" 
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    disabled={!newPassword}
                  >
                    {confirmPasswordVisible ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* EDIT MODE ACTION BUTTONS */}
              <button 
                type="submit" 
                className="profile-action-btn profile-btn-save" 
                disabled={loading}
                style={{ width: "100%", padding: "12px" }}
              >
                {loading ? "Menyimpan..." : "SIMPAN PERUBAHAN"}
              </button>

              <button 
                type="button" 
                className="profile-action-btn profile-btn-cancel" 
                onClick={handleCancelEdit}
                disabled={loading}
                style={{ width: "100%", padding: "12px", marginTop: "12px" }}
              >
                Batal
              </button>
            </form>
          )}

        </div>

      </div>

      {/* CUSTOM CONFIRMATION MODAL FOR ACCOUNT DELETION */}
      {showDeleteConfirm && (
        <div className="modal-overlay active">
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: "#ef4444" }}>
                Hapus Akun Permanen
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6" }}>
                Apakah Anda yakin ingin menghapus akun Anda secara permanen? Seluruh tugas, kategori, dan pengaturan Anda akan dihapus dari sistem. Aksi ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-batal"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-hapus-modal"
                onClick={handleDeleteAccount}
                disabled={loading}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {loading ? "Menghapus..." : "Ya, Hapus Akun"}
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
