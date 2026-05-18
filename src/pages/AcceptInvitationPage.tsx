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

export default function AcceptInvitationPage() {
  const [token, setToken] = useState(getInvitationTokenFromUrl);
  const [tokenWasInUrl] = useState(() => Boolean(getInvitationTokenFromUrl()));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="auth-page">
      <section className="auth-card wide-auth-card">
        <p className="eyebrow">PulseFi Invitation</p>
        <h1>Accept ISP Admin Invitation</h1>
        <p className="muted">
          Create your username and password to activate your ISP Admin account.
        </p>

        <form onSubmit={handleAcceptInvitation} className="auth-form">
          {!tokenWasInUrl && (
            <label>
              Invitation token
              <textarea
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Invitation token from email"
                required
              />
            </label>
          )}

          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Choose a username"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />
          </label>

          <label>
            Preferred MFA method
            <select
              value={preferredMfaMethod}
              onChange={(event) =>
                setPreferredMfaMethod(event.target.value as MFAMethod)
              }
            >
              <option value="authenticator">Authenticator app</option>
              <option value="email">Email code</option>
            </select>
          </label>

          {errorMessage && <div className="error-box">{errorMessage}</div>}

          <button disabled={isSubmitting}>
            {isSubmitting ? "Accepting..." : "Accept invitation"}
          </button>

          <button className="secondary-button" type="button" onClick={goToLogin}>
            Back to login
          </button>
        </form>
      </section>
    </main>
  );
}
