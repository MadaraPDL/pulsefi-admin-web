import { useEffect, useState } from "react";
import { AdminAuthFlow } from "./components/AdminAuthFlow";
import { restoreAdminSession } from "./api/adminAuth";
import type { AdminAuthenticatedResult } from "./api/adminAuth";
import {
  clearSession,
  getAccessToken,
  getAdminRole,
  hasSession,
  saveSession,
} from "./auth/session";
import AcceptInvitationPage from "./pages/AcceptInvitationPage";
import ISPAdminDashboard from "./pages/ISPAdminDashboard";
import PlatformAdminDashboard from "./pages/PlatformAdminDashboard";

type AuthStatus = "checking" | "logged_out" | "authenticated";

export default function RealApp() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    hasSession() ? "checking" : "logged_out"
  );

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (currentPath === "/accept-invitation") {
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      clearSession();
      return;
    }

    const sessionToken = accessToken;

    let isCancelled = false;

    async function restoreSession() {
      setAuthStatus("checking");

      try {
        const result = await restoreAdminSession(sessionToken);

        if (!isCancelled) {
          saveSession(result.session);
          setAuthStatus("authenticated");
        }
      } catch {
        clearSession();

        if (!isCancelled) {
          setAuthStatus("logged_out");
        }
      }
    }

    void restoreSession();

    return () => {
      isCancelled = true;
    };
  }, [currentPath]);

  function handleAuthenticated(result: AdminAuthenticatedResult) {
    saveSession(result.session);
    setAuthStatus("authenticated");
  }

  function handleLogout() {
    clearSession();
    setAuthStatus("logged_out");
  }

  if (currentPath === "/accept-invitation") {
    return <AcceptInvitationPage />;
  }

  if (authStatus === "checking") {
    return <SessionRestorePage />;
  }

  if (authStatus === "logged_out") {
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

function SessionRestorePage() {
  return (
    <main className="pf-auth-page">
      <div className="pf-auth-wrap">
        <section className="pf-login-card">
          <div className="pf-auth-heading">
            <h1>Checking session</h1>
            <p>Verifying your admin session with PulseFi.</p>
          </div>

          <p className="pf-loading-text">Loading admin dashboard...</p>
        </section>
      </div>
    </main>
  );
}
