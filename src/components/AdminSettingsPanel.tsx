import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { AdminTheme } from "../App.real";
import {
  disableAdminAuthenticatorMFA,
  disableAdminEmailMFA,
  enableAdminEmailMFA,
  getAdminMFAStatus,
  requestAdminIdentityVerification,
  setAdminPreferredMFAMethod,
  updateAdminIdentity,
} from "../api/adminAuth";
import type {
  CurrentAdminResponse,
  MFAMethod,
  MFAStatusResponse,
  ProfileUpdateChallengeResponse,
} from "../api/adminAuth";
import { getErrorMessage } from "../api/errors";
import { AdminPasswordResetFlow } from "./AdminPasswordResetFlow";

type SettingsShortcut<TSection extends string> = {
  label: string;
  section: TSection;
};

function formatMfaMethod(method: MFAMethod | null) {
  if (method === "email") {
    return "Email code";
  }

  if (method === "authenticator") {
    return "Authenticator app";
  }

  return "Not set";
}

function StatusPill({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <span className={`status-pill ${active ? "status-active" : "status-inactive"}`}>
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export function AdminSettingsPanel<TSection extends string>({
  adminName,
  adminEmail,
  adminUsername,
  roleLabel,
  activeSectionLabel,
  theme,
  shortcuts,
  onSetTheme,
  onNavigate,
  onAdminUpdated,
  onLogout,
}: {
  adminName: string;
  adminEmail: string;
  adminUsername: string;
  roleLabel: string;
  activeSectionLabel: string;
  theme: AdminTheme;
  shortcuts: SettingsShortcut<TSection>[];
  onSetTheme: (theme: AdminTheme) => void;
  onNavigate: (section: TSection) => void;
  onAdminUpdated: (admin: CurrentAdminResponse) => void;
  onLogout: () => void;
}) {
  const [email, setEmail] = useState(adminEmail);
  const [username, setUsername] = useState(adminUsername);
  const [mfaCode, setMfaCode] = useState("");
  const [challenge, setChallenge] =
    useState<ProfileUpdateChallengeResponse | null>(null);
  const [identitySuccess, setIdentitySuccess] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [isRequestingChallenge, setIsRequestingChallenge] = useState(false);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);

  const [mfaStatus, setMfaStatus] = useState<MFAStatusResponse | null>(null);
  const [mfaStatusMessage, setMfaStatusMessage] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaAction, setMfaAction] = useState<string | null>(null);
  useEffect(() => {
    void loadMFAStatus();
  }, []);

  async function loadMFAStatus() {
    setMfaError("");

    try {
      const status = await getAdminMFAStatus();
      setMfaStatus(status);
    } catch (error) {
      setMfaError(getErrorMessage(error, "Could not load MFA status."));
    }
  }

  async function runMfaAction(
    actionName: string,
    action: () => Promise<MFAStatusResponse>,
    successMessage: string
  ) {
    setMfaError("");
    setMfaStatusMessage("");
    setMfaAction(actionName);

    try {
      const status = await action();
      setMfaStatus(status);
      setMfaStatusMessage(successMessage);
    } catch (error) {
      setMfaError(getErrorMessage(error, "Could not update MFA settings."));
    } finally {
      setMfaAction(null);
    }
  }

  async function handleRequestIdentityChallenge() {
    setIdentityError("");
    setIdentitySuccess("");
    setChallenge(null);
    setMfaCode("");
    setIsRequestingChallenge(true);

    try {
      const response = await requestAdminIdentityVerification();
      setChallenge(response);
      setIdentitySuccess(response.message);
    } catch (error) {
      setIdentityError(
        getErrorMessage(error, "Could not start 2FA verification.")
      );
    } finally {
      setIsRequestingChallenge(false);
    }
  }

  async function handleSaveIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIdentityError("");
    setIdentitySuccess("");

    if (!challenge) {
      setIdentityError("Start 2FA verification before saving changes.");
      return;
    }

    setIsSavingIdentity(true);

    try {
      const updatedAdmin = await updateAdminIdentity({
        email: email.trim(),
        username: username.trim(),
        mfa_challenge_token: challenge.challenge_token,
        mfa_code: mfaCode.trim(),
      });

      onAdminUpdated(updatedAdmin);
      setEmail(updatedAdmin.email);
      setUsername(updatedAdmin.username ?? "");
      setChallenge(null);
      setMfaCode("");
      setIdentitySuccess("Account identity updated.");
    } catch (error) {
      setIdentityError(getErrorMessage(error, "Could not update account identity."));
    } finally {
      setIsSavingIdentity(false);
    }
  }

  const emailMfaActive = mfaStatus?.email_mfa_enabled ?? false;
  const authenticatorMfaActive = mfaStatus?.authenticator_mfa_enabled ?? false;
  const preferredMethod = mfaStatus?.preferred_mfa_method ?? null;

  return (
    <section className="pf-content-card pf-settings-page" aria-label="Admin settings">
      <div className="pf-panel-title-row pf-settings-header-row">
        <div>
          <h2>Settings</h2>
          <p>{roleLabel} settings, appearance, account identity, and recovery.</p>
        </div>

        <div className="pf-settings-theme-control" aria-label="Theme">
          <span className="pf-settings-label">Appearance</span>
          <div className="pf-segmented-control">
            {(["dark", "light"] as const).map((mode) => (
              <button
                key={mode}
                className={theme === mode ? "active-filter" : ""}
                type="button"
                onClick={() => onSetTheme(mode)}
                aria-pressed={theme === mode}
              >
                <span className="material-symbols-outlined">
                  {mode === "dark" ? "dark_mode" : "light_mode"}
                </span>
                {mode === "dark" ? "Dark" : "Light"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pf-settings-page-grid">
        <article className="pf-settings-section pf-settings-section-wide pf-settings-account">
          <span className="pf-settings-label">Session</span>
          <dl>
            <div>
              <dt>Signed in</dt>
              <dd>{adminName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{adminEmail || "Restored after next session refresh"}</dd>
            </div>
            <div>
              <dt>Username</dt>
              <dd>{adminUsername || "Not set"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{roleLabel}</dd>
            </div>
            <div>
              <dt>Current view</dt>
              <dd>{activeSectionLabel}</dd>
            </div>
          </dl>
        </article>

        <article className="pf-settings-section pf-settings-section-wide">
          <span className="pf-settings-label">Security / MFA</span>

          <div className="pf-settings-mfa-grid">
            <div className="pf-settings-mfa-card">
              <div>
                <h3>Email MFA</h3>
                <p>Receive a one-time login code by email.</p>
              </div>
              <StatusPill active={emailMfaActive} />
            </div>

            <div className="pf-settings-mfa-card">
              <div>
                <h3>Authenticator MFA</h3>
                <p>Use a time-based code from an authenticator app.</p>
              </div>
              <StatusPill active={authenticatorMfaActive} />
            </div>

            <div className="pf-settings-mfa-card">
              <div>
                <h3>Preferred login method</h3>
                <p>{formatMfaMethod(preferredMethod)}</p>
              </div>
              <StatusPill
                active={Boolean(preferredMethod)}
                activeLabel="Configured"
                inactiveLabel="Not set"
              />
            </div>
          </div>

          <div className="pf-settings-action-row">
            <button
              className="pf-secondary-button"
              type="button"
              disabled={mfaAction !== null || emailMfaActive}
              onClick={() =>
                void runMfaAction(
                  "enable-email",
                  enableAdminEmailMFA,
                  "Email MFA enabled."
                )
              }
            >
              {mfaAction === "enable-email" ? "Enabling..." : "Enable Email MFA"}
            </button>

            <button
              className="pf-secondary-button"
              type="button"
              disabled={
                mfaAction !== null ||
                !emailMfaActive ||
                mfaStatus?.can_disable_email_mfa === false
              }
              onClick={() =>
                void runMfaAction(
                  "disable-email",
                  disableAdminEmailMFA,
                  "Email MFA disabled."
                )
              }
            >
              {mfaAction === "disable-email" ? "Disabling..." : "Disable Email MFA"}
            </button>

            <button
              className="pf-secondary-button"
              type="button"
              disabled={
                mfaAction !== null ||
                !authenticatorMfaActive ||
                mfaStatus?.can_disable_authenticator_mfa === false
              }
              onClick={() =>
                void runMfaAction(
                  "disable-authenticator",
                  disableAdminAuthenticatorMFA,
                  "Authenticator MFA disabled."
                )
              }
            >
              {mfaAction === "disable-authenticator"
                ? "Disabling..."
                : "Disable Authenticator"}
            </button>
          </div>

          <div className="pf-settings-action-row">
            <button
              className="pf-secondary-button"
              type="button"
              disabled={
                mfaAction !== null || !emailMfaActive || preferredMethod === "email"
              }
              onClick={() =>
                void runMfaAction(
                  "prefer-email",
                  () => setAdminPreferredMFAMethod("email"),
                  "Email MFA set as preferred login method."
                )
              }
            >
              {mfaAction === "prefer-email" ? "Saving..." : "Prefer Email"}
            </button>

            <button
              className="pf-secondary-button"
              type="button"
              disabled={
                mfaAction !== null ||
                !authenticatorMfaActive ||
                preferredMethod === "authenticator"
              }
              onClick={() =>
                void runMfaAction(
                  "prefer-authenticator",
                  () => setAdminPreferredMFAMethod("authenticator"),
                  "Authenticator MFA set as preferred login method."
                )
              }
            >
              {mfaAction === "prefer-authenticator"
                ? "Saving..."
                : "Prefer Authenticator"}
            </button>

            <button
              className="pf-secondary-button"
              type="button"
              disabled={mfaAction !== null}
              onClick={() => void loadMFAStatus()}
            >
              Refresh MFA status
            </button>
          </div>

          {mfaStatus?.mfa_required && (
            <p className="pf-settings-help-text">
              MFA is required for this account. You cannot disable the last active
              MFA method.
            </p>
          )}

          {mfaError && <div className="pf-error-box">{mfaError}</div>}
          {mfaStatusMessage && (
            <div className="pf-success-box">{mfaStatusMessage}</div>
          )}
        </article>

        <article className="pf-settings-section pf-settings-section-wide">
          <span className="pf-settings-label">Account identity</span>
          <form className="pf-settings-identity-form" onSubmit={handleSaveIdentity}>
            <div className="pf-settings-form-grid">
              <label>
                Admin email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Username
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  minLength={3}
                  maxLength={50}
                  pattern="[A-Za-z0-9_.-]+"
                  required
                />
              </label>
            </div>

            <div className="pf-settings-verification-row">
              <button
                className="pf-secondary-button"
                type="button"
                onClick={() => void handleRequestIdentityChallenge()}
                disabled={isRequestingChallenge}
              >
                {isRequestingChallenge ? "Starting 2FA..." : "Start 2FA verification"}
              </button>

              <label>
                Verification code
                <input
                  value={mfaCode}
                  onChange={(event) => setMfaCode(event.target.value)}
                  placeholder={
                    challenge?.method === "email"
                      ? "Email code"
                      : "Authenticator code"
                  }
                  autoComplete="one-time-code"
                  required
                  disabled={!challenge}
                />
              </label>
            </div>

            {challenge?.dev_email_code && (
              <div className="pf-dev-box">
                <strong>Local DEBUG settings code</strong>
                <code>{challenge.dev_email_code}</code>
                <small>
                  Production sends this code by email. It is shown here only
                  when the backend returns it in DEBUG mode.
                </small>
              </div>
            )}

            {identityError && <div className="pf-error-box">{identityError}</div>}
            {identitySuccess && (
              <div className="pf-success-box">{identitySuccess}</div>
            )}

            <button
              className="pf-primary-button"
              type="submit"
              disabled={!challenge || isSavingIdentity}
            >
              {isSavingIdentity ? "Saving identity..." : "Save email and username"}
            </button>
          </form>
        </article>

        <article className="pf-settings-section pf-settings-section-wide">
          <span className="pf-settings-label">Password reset</span>
          <AdminPasswordResetFlow initialIdentifier={adminEmail} />
        </article>

        <article className="pf-settings-section pf-settings-section-wide">
          <span className="pf-settings-label">Dashboard shortcuts</span>
          <div className="pf-settings-shortcuts">
            {shortcuts.map((shortcut) => (
              <button
                key={shortcut.label}
                type="button"
                onClick={() => onNavigate(shortcut.section)}
              >
                {shortcut.label}
              </button>
            ))}
          </div>
        </article>
      </div>

      <div className="pf-settings-page-footer">
        <button className="pf-danger-outline-button" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </section>
  );
}

