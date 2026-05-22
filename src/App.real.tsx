import { useEffect, useState } from "react";
import { AdminAuthFlow } from "./components/AdminAuthFlow";
import { restoreAdminSession } from "./api/adminAuth";
import type {
  AdminAuthenticatedResult,
  AdminSession,
  CurrentAdminResponse,
} from "./api/adminAuth";
import {
  clearSession,
  getAccessToken,
  getAdminRole,
  hasSession,
  saveSession,
} from "./auth/session";
import { AdminPasswordResetFlow } from "./components/AdminPasswordResetFlow";
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
  const [, setSessionRevision] = useState(0);

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (currentPath === "/accept-invitation" || currentPath === "/reset-password") {
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

  function handleAdminUpdated(admin: CurrentAdminResponse) {
    if (admin.account_type !== "admin" || !isAdminRole(admin.role)) {
      clearSession();
      setAuthStatus("logged_out");
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      clearSession();
      setAuthStatus("logged_out");
      return;
    }

    const session: AdminSession = {
      access_token: accessToken,
      token_type: "bearer",
      account_type: "admin",
      account_id: admin.account_id,
      full_name: admin.full_name,
      email: admin.email,
      username: admin.username,
      role: admin.role,
    };

    saveSession(session);
    setSessionRevision((current) => current + 1);
  }

  function handleLogout() {
    clearSession();
    setAuthStatus("logged_out");
  }

  function setAdminTheme(nextTheme: AdminTheme) {
    setTheme(nextTheme);
    setStoredTheme(nextTheme);
  }

  function renderCurrentView() {
    if (currentPath === "/accept-invitation") {
      return <AcceptInvitationPage theme={theme} onSetTheme={setAdminTheme} />;
    }

    if (currentPath === "/reset-password") {
      return <ResetPasswordPage />;
    }

    if (authStatus === "checking") {
      return <SessionRestorePage />;
    }

    if (authStatus === "logged_out") {
      return (
        <AdminAuthFlow
          theme={theme}
          onSetTheme={setAdminTheme}
          onAuthenticated={handleAuthenticated}
        />
      );
    }

    const role = getAdminRole();

    if (role === "platform_admin") {
      return (
        <PlatformAdminDashboard
          theme={theme}
          onSetTheme={setAdminTheme}
          onAdminUpdated={handleAdminUpdated}
          onLogout={handleLogout}
        />
      );
    }

    if (role === "isp_admin") {
      return (
        <ISPAdminDashboard
          theme={theme}
          onSetTheme={setAdminTheme}
          onAdminUpdated={handleAdminUpdated}
          onLogout={handleLogout}
        />
      );
    }

    clearSession();
    return (
      <AdminAuthFlow
        theme={theme}
        onSetTheme={setAdminTheme}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <div className="pf-real-app" data-theme={theme}>
      {renderCurrentView()}
    </div>
  );
}

function setStoredTheme(theme: AdminTheme) {
  try {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  } catch {
    // Theme still updates for the current session if storage is unavailable.
  }
}

function isAdminRole(role: string | null): role is "platform_admin" | "isp_admin" {
  return role === "platform_admin" || role === "isp_admin";
}

function ResetPasswordPage() {
  const [token] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") ?? "";
  });

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, "", "/reset-password");
    }
  }, []);

  return (
    <main className="pf-auth-page">
      <div className="pf-auth-wrap">
        <section className="pf-login-card">
          <div className="pf-auth-heading">
            <h1>Reset Password</h1>
            <p>Choose a new admin password from your email reset link.</p>
          </div>

          {token ? (
            <AdminPasswordResetFlow initialToken={token} />
          ) : (
            <div className="pf-error-box">
              This reset link is missing a token. Request a new password reset
              email from the login screen.
            </div>
          )}
        </section>
      </div>
    </main>
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
