import { useEffect, useState } from "react";
import "./App.css";
import { AdminAuthFlow } from "./components/AdminAuthFlow";
import type { AdminAuthenticatedResult } from "./api/adminAuth";
import {
  clearSession,
  getAdminRole,
  hasSession,
  saveSession,
} from "./auth/session";
import AcceptInvitationPage from "./pages/AcceptInvitationPage";
import ISPAdminDashboard from "./pages/ISPAdminDashboard";
import PlatformAdminDashboard from "./pages/PlatformAdminDashboard";

export default function RealApp() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isLoggedIn, setIsLoggedIn] = useState(hasSession());

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handleAuthenticated(result: AdminAuthenticatedResult) {
    saveSession(result.session);
    setIsLoggedIn(true);
  }

  function handleLogout() {
    clearSession();
    setIsLoggedIn(false);
  }

  if (currentPath === "/accept-invitation") {
    return <AcceptInvitationPage />;
  }

  if (!isLoggedIn) {
    return <AdminAuthFlow onAuthenticated={handleAuthenticated} />;
  }

  const role = getAdminRole();

  if (role === "platform_admin") {
    return <PlatformAdminDashboard onLogout={handleLogout} />;
  }

  if (role === "isp_admin") {
    return <ISPAdminDashboard onLogout={handleLogout} />;
  }

  clearSession();
  return <AdminAuthFlow onAuthenticated={handleAuthenticated} />;
}
