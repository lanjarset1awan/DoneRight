import React from "react";

export default function ProfileForm({
  handleSubmit,
  username,
  setUsername,
  email,
  setEmail,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  newPasswordVisible,
  setNewPasswordVisible,
  confirmPasswordVisible,
  setConfirmPasswordVisible,
  loading,
  handleCancelEdit,
}) {
  return (
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
        <div className="profile-field-container" style={{ marginBottom: newPassword ? "10px" : "20px" }}>
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
        {/* PASSWORD REQUIREMENTS REAL-TIME INDICATOR */}
        {newPassword && (
          <div className="password-checker-container">
            <div className="password-checker-title">Persyaratan Kata Sandi:</div>
            <div className={`password-checker-item ${newPassword.length >= 8 ? "is-valid" : "is-invalid"}`}>
              <span className="checker-icon">
                {newPassword.length >= 8 ? "✓" : "○"}
              </span>
              <span>Minimal 8 karakter</span>
            </div>
            <div className={`password-checker-item ${/[^a-zA-Z0-9]/.test(newPassword) ? "is-valid" : "is-invalid"}`}>
              <span className="checker-icon">
                {/[^a-zA-Z0-9]/.test(newPassword) ? "✓" : "○"}
              </span>
              <span>Minimal 1 karakter unik/spesial (misal: @, #, $, !, dll)</span>
            </div>
          </div>
        )}
      </div>

      {/* KONFIRMASI KATA SANDI BARU */}
      <div className="form-group">
        <label className="profile-label">Konfirmasi Kata Sandi Baru</label>
        <div className="profile-field-container" style={{ marginBottom: newPassword ? "10px" : "20px" }}>
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
        {/* CONFIRMATION MATCH STATUS */}
        {newPassword && (
          <div className="password-confirm-status">
            {!confirmPassword ? (
              <div className="confirm-status-item is-warning">
                <span className="status-icon">⚠</span>
                <span>Konfirmasi kata sandi belum diisi</span>
              </div>
            ) : confirmPassword !== newPassword ? (
              <div className="confirm-status-item is-invalid">
                <span className="status-icon">✗</span>
                <span>Konfirmasi kata sandi tidak cocok</span>
              </div>
            ) : (
              <div className="confirm-status-item is-valid">
                <span className="status-icon">✓</span>
                <span>Konfirmasi kata sandi cocok</span>
              </div>
            )}
          </div>
        )}
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
  );
}
