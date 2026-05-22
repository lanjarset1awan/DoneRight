import { useState, useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UserReport from "./pages/UserReport";
import AdminReport from "./pages/AdminReport";
import Trash from "./pages/Trash";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });
  const [resetToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("resetToken") || "";
  });

  const [showProfileModal, setShowProfileModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("resetToken")) {
      return "reset-password";
    }
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return "landing";
    try {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (savedUser && savedUser.role === "admin") {
        return "admin";
      }
      return "dashboard";
    } catch {
      return "landing";
    }
  });

  // Clean up URL query parameters on mount if resetToken was present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("resetToken")) {
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const handleLoginSuccess = (userToken, userData, enteredPassword = "") => {
    setToken(userToken);
    const mergedUser = { ...userData };
    if (enteredPassword) {
      mergedUser.plaintextPassword = enteredPassword;
    }
    setUser(mergedUser);
    if (userData.role === "admin") {
      setCurrentPage("admin");
    } else {
      setCurrentPage("dashboard");
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    localStorage.clear();
    setCurrentPage("landing");
  };

  // State Router
  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return (
          <LandingPage
            onNavigateLogin={() => setCurrentPage("login")}
            onNavigateRegister={() => setCurrentPage("register")}
          />
        );
      case "login":
        return (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => setCurrentPage("register")}
            onNavigateForgotPassword={() => setCurrentPage("forgot-password")}
          />
        );
      case "forgot-password":
        return (
          <ForgotPassword
            onNavigateLogin={() => setCurrentPage("login")}
          />
        );
      case "reset-password":
        return (
          <ResetPassword
            resetToken={resetToken}
            onNavigateLogin={() => setCurrentPage("login")}
          />
        );
      case "register":
        return (
          <Register
            onNavigateLogin={() => setCurrentPage("login")}
          />
        );
      case "dashboard":
        return (
          <Dashboard
            token={token}
            user={user}
            onLogout={handleLogout}
            onNavigateReport={() => setCurrentPage("report-user")}
            onNavigateTrash={() => setCurrentPage("trash")}
            onOpenProfile={() => setShowProfileModal(true)}
          />
        );
      case "trash":
        return (
          <Trash
            token={token}
            user={user}
            onLogout={handleLogout}
            onNavigateDashboard={() => setCurrentPage("dashboard")}
            onOpenProfile={() => setShowProfileModal(true)}
          />
        );
      case "admin":
        return (
          <AdminDashboard
            token={token}
            user={user}
            onLogout={handleLogout}
            onNavigateReport={() => setCurrentPage("report-admin")}
            onOpenProfile={() => setShowProfileModal(true)}
          />
        );

      case "report-user":
        return (
          <UserReport
            token={token}
            user={user}
            onLogout={handleLogout}
            onNavigateDashboard={() => setCurrentPage("dashboard")}
            onOpenProfile={() => setShowProfileModal(true)}
          />
        );
      case "report-admin":
        return (
          <AdminReport
            token={token}
            user={user}
            onLogout={handleLogout}
            onNavigateDashboard={() => setCurrentPage("admin")}
            onOpenProfile={() => setShowProfileModal(true)}
          />
        );
      default:
        return (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => setCurrentPage("register")}
            onNavigateForgotPassword={() => setCurrentPage("forgot-password")}
          />
        );
    }
  };

  return (
    <div className="app-root-container">
      {renderPage()}
      
      {showProfileModal && (
        <Profile
          token={token}
          user={user}
          onUserUpdate={(updatedUser, newPassword = "") => {
            const mergedUser = { ...user, ...updatedUser };
            if (newPassword) {
              mergedUser.plaintextPassword = newPassword;
            }
            if (updatedUser.avatar) {
              const baseUrl = updatedUser.avatar.split('?')[0];
              mergedUser.avatar = `${baseUrl}?t=${new Date().getTime()}`;
            }
            setUser(mergedUser);
          }}
          onLogout={handleLogout}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
