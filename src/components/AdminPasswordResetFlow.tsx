import { useState } from "react";
import type { FormEvent } from "react";
import {
  requestAdminPasswordReset,
  resetAdminPassword,
} from "../api/adminAuth";
import { getErrorMessage } from "../api/errors";

export function AdminPasswordResetFlow({
  initialIdentifier = "",
  initialToken = "",
  onDone,
}: {
  initialIdentifier?: string;
  initialToken?: string;
  onDone?: () => void;
}) {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isResetLinkMode = Boolean(initialToken);

  async function handleRequestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setDevResetUrl(null);
    setIsRequesting(true);

    try {
      const response = await requestAdminPasswordReset(identifier.trim());
      setSuccessMessage(response.message);

      if (response.dev_reset_url) {
        setDevResetUrl(response.dev_reset_url);
      }
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not request password reset.")
      );
    } finally {
      setIsRequesting(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    setIsResetting(true);

    try {
      const response = await resetAdminPassword(initialToken.trim(), newPassword);
      setSuccessMessage(response.message);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not reset password."));
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="pf-password-reset-flow">
      {!isResetLinkMode && (
        <form className="pf-password-reset-form" onSubmit={handleRequestReset}>
          <div>
            <h4>Email reset link</h4>
            <p>
              Enter the admin email or username. PulseFi sends a reset link by
              email when backend email delivery is configured.
            </p>
          </div>

          <label>
            Admin email or username
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="admin@pulsefi.com"
              autoComplete="username"
              required
            />
          </label>

          <button className="pf-primary-button" type="submit" disabled={isRequesting}>
            {isRequesting ? "Sending email..." : "Send reset email"}
          </button>
        </form>
      )}

      {isResetLinkMode && (
        <form className="pf-password-reset-form" onSubmit={handleResetPassword}>
          <div>
            <h4>Set new password</h4>
            <p>Choose a new admin password from the reset link you opened.</p>
          </div>

          <label>
            New password
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label>
            Confirm new password
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              placeholder="Repeat new password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <button
            className="pf-primary-button"
            type="submit"
            disabled={isResetting}
          >
            {isResetting ? "Resetting..." : "Reset password"}
          </button>
        </form>
      )}

      {devResetUrl && (
        <div className="pf-dev-box">
          <strong>Local DEBUG reset link</strong>
          <a href={devResetUrl}>{devResetUrl}</a>
          <small>
            Production sends this link by email. This local link is only shown
            when the backend returns it in DEBUG mode.
          </small>
        </div>
      )}

      {errorMessage && <div className="pf-error-box">{errorMessage}</div>}
      {successMessage && <div className="pf-success-box">{successMessage}</div>}

      {onDone && (
        <button className="pf-secondary-button" type="button" onClick={onDone}>
          Back to login
        </button>
      )}
    </div>
  );
}
