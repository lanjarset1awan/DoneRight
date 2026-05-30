import useProfileData from "../hooks/useProfileData";
import ProfileAvatar from "../components/profile/ProfileAvatar";
import ProfileView from "../components/profile/ProfileView";
import ProfileForm from "../components/profile/ProfileForm";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/pages/profile.css";

export default function Profile({ token, user, onUserUpdate, onLogout, onClose }) {
  const {
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
    avatarPreview,
    currentPasswordVisible,
    setCurrentPasswordVisible,
    newPasswordVisible,
    setNewPasswordVisible,
    confirmPasswordVisible,
    setConfirmPasswordVisible,
    loading,
    errorMsg,
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
  } = useProfileData(token, user, onUserUpdate, onLogout, onClose);

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
          <ProfileAvatar
            avatarPreview={avatarPreview}
            username={username}
            user={user}
            isEditing={isEditing}
            triggerFileSelect={triggerFileSelect}
            fileInputRef={fileInputRef}
            handleAvatarChange={handleAvatarChange}
            handleRemoveAvatar={handleRemoveAvatar}
            getInitials={getInitials}
          />

          {/* VIEW / EDIT FORM PANEL */}
          {!isEditing ? (
            <ProfileView
              user={user}
              setIsEditing={setIsEditing}
              currentPasswordVisible={currentPasswordVisible}
              setCurrentPasswordVisible={setCurrentPasswordVisible}
              plaintextPassword={plaintextPassword}
              setShowDeleteConfirm={setShowDeleteConfirm}
            />
          ) : (
            <ProfileForm
              handleSubmit={handleSubmit}
              username={username}
              setUsername={setUsername}
              email={email}
              setEmail={setEmail}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              newPasswordVisible={newPasswordVisible}
              setNewPasswordVisible={setNewPasswordVisible}
              confirmPasswordVisible={confirmPasswordVisible}
              setConfirmPasswordVisible={setConfirmPasswordVisible}
              loading={loading}
              handleCancelEdit={handleCancelEdit}
            />
          )}

        </div>
      </div>

      {/* CONFIRMATION MODAL FOR ACCOUNT DELETION */}
      <ConfirmModal
        show={showDeleteConfirm}
        title="Hapus Akun Permanen"
        message="Apakah Anda yakin ingin menghapus akun Anda secara permanen? Seluruh tugas, kategori, dan pengaturan Anda akan dihapus dari sistem. Aksi ini tidak dapat dibatalkan."
        confirmText={loading ? "Menghapus..." : "Ya, Hapus Akun"}
        cancelText="Batal"
        isDanger={true}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
        closingModal=""
        closeModal={() => setShowDeleteConfirm(false)}
        overlayClass=""
        titleClass="admin-dash-modal-title-danger"
        bodyTextClass="admin-dash-modal-body-text"
        footerClass="admin-dash-modal-footer"
        cancelBtnClass="admin-dash-modal-btn-cancel"
        confirmBtnClass="admin-dash-modal-btn-confirm"
      />

      {/* TOAST NOTIFICATION */}
      <div className={`toast-notification ${toast.show ? "active" : ""} ${toast.type}`}>
        <div className="toast-message">{toast.message}</div>
      </div>
    </div>
  );
}
