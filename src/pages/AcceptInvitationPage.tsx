import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { acceptInvitation } from "../api/auth";
import { getErrorMessage } from "../api/errors";
import type { AdminTheme } from "../App.real";
import { ArrowRight } from "lucide-react";

function getInvitationTokenFromUrl() {
  return new URLSearchParams(window.location.search).get("token") ?? "";
}

function goToLogin() {
  window.history.replaceState({}, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function PulseFiLogo() {
  return (
    <div className="pf-logo" aria-label="PulseFi">
      <div className="pf-logo-mark">
        <span className="pf-logo-pulse">P</span>
        <span>PulseFi</span>
      </div>
    </div>
  );
}

function AuthThemeToggle({
  theme,
  onSetTheme,
}: {
  theme: AdminTheme;
  onSetTheme: (theme: AdminTheme) => void;
}) {
  return (
    <div className="pf-auth-theme-toggle" aria-label="Invitation page theme">
      {(["dark", "light"] as const).map((mode) => (
        <button
          key={mode}
          className={theme === mode ? "active-filter" : ""}
          type="button"
          onClick={() => onSetTheme(mode)}
          aria-pressed={theme === mode}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {mode === "dark" ? "dark_mode" : "light_mode"}
          </span>
          {mode === "dark" ? "Dark" : "Light"}
        </button>
      ))}
    </div>
  );
}

export default function AcceptInvitationPage({
  theme,
  onSetTheme,
}: {
  theme: AdminTheme;
  onSetTheme: (theme: AdminTheme) => void;
}) {
  const [token] = useState(getInvitationTokenFromUrl);
  const [tokenWasInUrl] = useState(() => Boolean(getInvitationTokenFromUrl()));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    if (!searchParams.has("token")) {
      return;
    }

    searchParams.delete("token");

    const cleanSearch = searchParams.toString();
    const cleanUrl = `${window.location.pathname}${
      cleanSearch ? `?${cleanSearch}` : ""
    }${window.location.hash}`;

    window.history.replaceState({}, "", cleanUrl);
  }, []);

  async function handleAcceptInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage(
        "This invitation link is missing required information. Request a new invitation email."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await acceptInvitation({
        token,
        username,
        password,
      });

      setPassword("");
      setSuccessMessage(
        "Invitation accepted. Sign in with your new account to complete MFA setup."
      );

      window.setTimeout(goToLogin, 1200);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not accept invitation."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="pf-auth-page">
      <AuthThemeToggle theme={theme} onSetTheme={onSetTheme} />

      <div className="pf-auth-wrap pf-auth-wrap-wide">
        <PulseFiLogo />

        <section className="pf-login-card">
          <div className="pf-auth-heading">
            <h1>Accept Invitation</h1>
            <p>Create your admin login. MFA setup will be required on first sign-in.</p>
          </div>

          <form onSubmit={handleAcceptInvitation} className="pf-auth-form">
            {!tokenWasInUrl && (
              <div className="pf-error-box">
                This invitation link is missing required information. Request a new invitation email.
              </div>
            )}

            <div className="pf-field">
              <label className="pf-label" htmlFor="invitation-username">
                Username
              </label>

              <div className="pf-input-shell">
                <span className="pf-input-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">person</span>
                </span>

                <input
                  id="invitation-username"
                  className="pf-input"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Choose a username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="pf-field">
              <label className="pf-label" htmlFor="invitation-password">
                Password
              </label>

              <div className="pf-input-shell">
                <span className="pf-input-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">lock</span>
                </span>

                <input
                  id="invitation-password"
                  className="pf-input pf-input-with-action"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  className="pf-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {errorMessage && <div className="pf-error-box">{errorMessage}</div>}
            {successMessage && <div className="pf-success-box">{successMessage}</div>}

            <button
              className="pf-primary-button"
              type="submit"
              disabled={isSubmitting || !token}
            >
              {isSubmitting ? "Accepting..." : "Accept invitation"}
              <ArrowRight size={18} aria-hidden="true" />
            </button>

            <button
              className="pf-secondary-button"
              type="button"
              onClick={goToLogin}
            >
              Back to login
            </button>
          </form>

          <div className="pf-auth-footer">
            <p>Invitation onboarding - Secure Connection Environment</p>
          </div>
        </section>
      </div>
    </main>
  );
}
