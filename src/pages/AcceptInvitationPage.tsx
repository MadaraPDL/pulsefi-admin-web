import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { acceptInvitation } from "../api/auth";
import type { MFAMethod } from "../api/auth";
import { getErrorMessage } from "../api/errors";

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

export default function AcceptInvitationPage() {
  const [token, setToken] = useState(getInvitationTokenFromUrl);
  const [tokenWasInUrl] = useState(() => Boolean(getInvitationTokenFromUrl()));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [preferredMfaMethod, setPreferredMfaMethod] =
    useState<MFAMethod>("authenticator");
  const [errorMessage, setErrorMessage] = useState("");
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
    setIsSubmitting(true);

    try {
      await acceptInvitation({
        token,
        username,
        password,
        preferred_mfa_method: preferredMfaMethod,
      });

      setPassword("");
      goToLogin();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not accept invitation."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="pf-auth-page">
      <div className="pf-auth-wrap pf-auth-wrap-wide">
        <PulseFiLogo />

        <section className="pf-login-card">
          <div className="pf-auth-heading">
            <h1>Accept Invitation</h1>
            <p>Create your ISP Admin login and secure the account with MFA.</p>
          </div>

          <form onSubmit={handleAcceptInvitation} className="pf-auth-form">
            {!tokenWasInUrl && (
              <div className="pf-field">
                <label className="pf-label" htmlFor="invitation-token">
                  Invitation Token
                </label>

                <textarea
                  id="invitation-token"
                  className="pf-input pf-input-no-icon pf-token-area"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Invitation token from email"
                  required
                />
              </div>
            )}

            {tokenWasInUrl && (
              <div className="pf-dev-box pf-token-note">
                <strong>Invitation token loaded</strong>
                <small>
                  The token was removed from the URL for safer local testing.
                </small>
              </div>
            )}

            <div className="pf-two-column-form">
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
                <label className="pf-label" htmlFor="preferred-mfa-method">
                  MFA Method
                </label>

                <div className="pf-input-shell">
                  <span className="pf-input-icon" aria-hidden="true">
                    <span className="material-symbols-outlined">security</span>
                  </span>

                  <select
                    id="preferred-mfa-method"
                    className="pf-input"
                    value={preferredMfaMethod}
                    onChange={(event) =>
                      setPreferredMfaMethod(event.target.value as MFAMethod)
                    }
                  >
                    <option value="authenticator">Authenticator app</option>
                    <option value="email">Email code</option>
                  </select>
                </div>
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

            {errorMessage && (
              <div className="pf-error-box">{errorMessage}</div>
            )}

            <button className="pf-primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Accepting..." : "Accept invitation"}
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
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
