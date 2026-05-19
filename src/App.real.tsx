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
export type AdminTheme = "dark" | "light";

const ADMIN_THEME_STORAGE_KEY = "pulsefi-admin-theme";

function getInitialTheme(): AdminTheme {
  try {
    const savedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {
    return "dark";
  }

  return "dark";
}

export default function RealApp() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    hasSession() ? "checking" : "logged_out"
  );
  const [theme, setTheme] = useState<AdminTheme>(getInitialTheme);

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

  function toggleTheme() {
    setTheme((current) => {
      const nextTheme = current === "dark" ? "light" : "dark";

      try {
        window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Theme still updates for the current session if storage is unavailable.
      }

      return nextTheme;
    });
  }

  function renderCurrentView() {
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
      return (
        <PlatformAdminDashboard
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
        />
      );
    }

    if (role === "isp_admin") {
      return (
        <ISPAdminDashboard
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
        />
      );
    }

    clearSession();
    return <AdminAuthFlow onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="pf-real-app" data-theme={theme}>
      {renderCurrentView()}
    </div>
  );
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
