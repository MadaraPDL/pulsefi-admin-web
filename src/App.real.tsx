import { useState } from "react";
import type { FormEvent } from "react";
import PulseFiPlatformAdminWhitePreview from "./PulseFiPlatformAdminWhitePreview";
import PulseFiWhiteDesignPreview from "./PulseFiWhiteDesignPreview";
import { loginAdmin } from "./api/adminAuth";
import type { AdminRole } from "./api/adminAuth";
import "./pulsefi-white-design.css";

type AuthState =
  | {
      status: "logged_out";
    }
  | {
      status: "mfa_required";
      method?: string;
      expiresAt?: string;
      challengeToken?: string;
    }
  | {
      status: "authenticated";
      role: AdminRole;
      identifier: string;
      accessToken: string;
    };

export default function RealApp() {
  const [authState, setAuthState] = useState<AuthState>({ status: "logged_out" });

  if (authState.status === "authenticated" && authState.role === "platform_admin") {
    return (
      <RealAdminFrame
        roleLabel="Platform Admin"
        accountLabel={authState.identifier}
        onLogout={() => setAuthState({ status: "logged_out" })}
      >
        <PulseFiPlatformAdminWhitePreview />
      </RealAdminFrame>
    );
  }

  if (authState.status === "authenticated" && authState.role === "isp_admin") {
    return (
      <RealAdminFrame
        roleLabel="ISP Admin"
        accountLabel={authState.identifier}
        onLogout={() => setAuthState({ status: "logged_out" })}
      >
        <PulseFiWhiteDesignPreview />
      </RealAdminFrame>
    );
  }

  if (authState.status === "mfa_required") {
    return (
      <MfaPlaceholder
        method={authState.method}
        expiresAt={authState.expiresAt}
        onBack={() => setAuthState({ status: "logged_out" })}
      />
    );
  }

  return <AdminLoginPage onAuthStateChange={setAuthState} />;
}

function AdminLoginPage({
  onAuthStateChange,
}: {
  onAuthStateChange: (state: AuthState) => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    try {
      const result = await loginAdmin(identifier, password);

      if (result.kind === "mfa_required") {
        onAuthStateChange({
          status: "mfa_required",
          method: result.method,
          expiresAt: result.expiresAt,
          challengeToken: result.challengeToken,
        });
        return;
      }

      onAuthStateChange({
        status: "authenticated",
        role: result.role,
        identifier: result.identifier,
        accessToken: result.accessToken,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="pf-real-login-page">
      <section className="pf-real-login-card">
        <div className="pf-auth-brand">
          <div className="pf-brand-mark">P</div>
          <div>
            <div className="pf-brand-title">PulseFi</div>
            <div className="pf-brand-subtitle">Admin Web App</div>
          </div>
        </div>

        <div className="pf-auth-form">
          <div>
            <h2>Sign in to PulseFi</h2>
            <p>Use the admin account provided by your administrator.</p>
          </div>

          <form className="pf-form-grid" onSubmit={handleLogin}>
            <label className="pf-field">
              Email or username
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="admin@example.com"
                autoComplete="username"
              />
            </label>

            <label className="pf-field">
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </label>

            <button className="pf-button primary pf-full-button" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <button className="pf-small-link pf-auth-link">Forgot password?</button>

          {errorMessage ? <div className="pf-auth-error">{errorMessage}</div> : null}

          <div className="pf-auth-helper">
            Real backend login is now used. The backend token decides whether the admin opens
            Platform Admin or ISP Admin.
          </div>
        </div>
      </section>
    </main>
  );
}

function MfaPlaceholder({
  method,
  expiresAt,
  onBack,
}: {
  method?: string;
  expiresAt?: string;
  onBack: () => void;
}) {
  return (
    <main className="pf-real-login-page">
      <section className="pf-real-login-card">
        <div className="pf-auth-brand">
          <div className="pf-brand-mark">P</div>
          <div>
            <div className="pf-brand-title">PulseFi</div>
            <div className="pf-brand-subtitle">MFA required</div>
          </div>
        </div>

        <div className="pf-auth-form">
          <div>
            <h2>Verify your sign in</h2>
            <p>
              The backend requires MFA for this account. The full MFA verification step will be
              connected next.
            </p>
          </div>

          <div className="pf-auth-warning">
            Method: {method || "Unknown"}
            {expiresAt ? ` · Expires at: ${expiresAt}` : ""}
          </div>

          <button className="pf-button" onClick={onBack}>
            Back to login
          </button>
        </div>
      </section>
    </main>
  );
}

function RealAdminFrame({
  roleLabel,
  accountLabel,
  onLogout,
  children,
}: {
  roleLabel: string;
  accountLabel: string;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pf-real-admin-shell">
      <div className="pf-real-admin-bar">
        <div>
          <strong>{roleLabel}</strong>
          <span>{accountLabel}</span>
        </div>

        <button className="pf-button" onClick={onLogout}>
          Logout
        </button>
      </div>

      {children}
    </div>
  );
}
