import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { AdminTheme } from "../App.real";
import {
  applyAdminMFASettingsAction,
  createAdminMFASettingsChallenge,
  getAdminMFABackupCodeStatus,
  getAdminMFAStatus,
  regenerateAdminMFABackupCodes,
  requestAdminIdentityVerification,
  updateAdminIdentity,
} from "../api/adminAuth";
import type {
  CurrentAdminResponse,
  MFABackupCodeStatusResponse,
  MFAMethod,
  MFASettingsAction,
  MFASettingsChallengeResponse,
  MFAStatusResponse,
  ProfileUpdateChallengeResponse,
} from "../api/adminAuth";
import { getErrorMessage } from "../api/errors";
import { AdminPasswordResetFlow } from "./AdminPasswordResetFlow";

type SettingsShortcut<TSection extends string> = {
  label: string;
  section: TSection;
};

type PendingMFAAction = {
  action: MFASettingsAction;
  label: string;
  description: string;
};

const MFA_ACTIONS: Record<MFASettingsAction, PendingMFAAction> = {
  enable_email: {
    action: "enable_email",
    label: "Enable Email MFA",
    description: "Enable email one-time codes as an active MFA method.",
  },
  disable_email: {
    action: "disable_email",
    label: "Disable Email MFA",
    description: "Turn off email one-time codes for this account.",
  },
  disable_authenticator: {
    action: "disable_authenticator",
    label: "Disable Authenticator",
    description: "Turn off authenticator app MFA for this account.",
  },
  prefer_email: {
    action: "prefer_email",
    label: "Prefer Email",
    description: "Use email codes as the default MFA login method.",
  },
  prefer_authenticator: {
    action: "prefer_authenticator",
    label: "Prefer Authenticator",
    description: "Use authenticator app codes as the default MFA login method.",
  },
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
  const [pendingMFAAction, setPendingMFAAction] =
    useState<PendingMFAAction | null>(null);
  const [settingsChallenge, setSettingsChallenge] =
    useState<MFASettingsChallengeResponse | null>(null);
  const [settingsCode, setSettingsCode] = useState("");
  const [settingsMethod, setSettingsMethod] = useState<MFAMethod>("authenticator");

  const [backupCodeStatus, setBackupCodeStatus] =
    useState<MFABackupCodeStatusResponse | null>(null);
  const [backupCodeMessage, setBackupCodeMessage] = useState("");
  const [backupCodeError, setBackupCodeError] = useState("");
  const [backupCodeAction, setBackupCodeAction] = useState<string | null>(null);
  const [isBackupCodeFlowOpen, setIsBackupCodeFlowOpen] = useState(false);
  const [backupCodeChallenge, setBackupCodeChallenge] =
    useState<MFASettingsChallengeResponse | null>(null);
  const [backupCodeVerificationMethod, setBackupCodeVerificationMethod] =
    useState<MFAMethod>("authenticator");
  const [backupCodeVerificationCode, setBackupCodeVerificationCode] = useState("");
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    void loadMFAStatus();
    void loadBackupCodeStatus();
  }, []);

  async function loadMFAStatus() {
    setMfaError("");

    try {
      const status = await getAdminMFAStatus();
      setMfaStatus(status);
      setSettingsMethod(status.preferred_mfa_method ?? "authenticator");
    } catch (error) {
      setMfaError(getErrorMessage(error, "Could not load MFA status."));
    }
  }

  function startMFAAction(action: MFASettingsAction) {
    setMfaError("");
    setMfaStatusMessage("");
    setPendingMFAAction(MFA_ACTIONS[action]);
    setSettingsChallenge(null);
    setSettingsCode("");
    setSettingsMethod(mfaStatus?.preferred_mfa_method ?? "authenticator");
  }

  async function handleSendEmailSettingsCode() {
    if (!pendingMFAAction) {
      return;
    }

    setMfaError("");
    setMfaStatusMessage("");
    setSettingsChallenge(null);
    setSettingsCode("");
    setMfaAction("settings-challenge");

    try {
      const response = await createAdminMFASettingsChallenge("email");
      setSettingsChallenge(response);
      setMfaStatusMessage(response.message);
    } catch (error) {
      setMfaError(getErrorMessage(error, "Could not send email verification code."));
    } finally {
      setMfaAction(null);
    }
  }

  async function getAuthenticatorSettingsChallenge() {
    if (settingsChallenge?.method === "authenticator") {
      return settingsChallenge;
    }

    const response = await createAdminMFASettingsChallenge("authenticator");
    setSettingsChallenge(response);
    return response;
  }

  async function handleApplySettingsAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pendingMFAAction) {
      setMfaError("Choose an MFA action before confirming.");
      return;
    }

    if (!settingsCode.trim()) {
      setMfaError("Enter the verification code before confirming.");
      return;
    }

    setMfaError("");
    setMfaStatusMessage("");
    setMfaAction("settings-action");

    try {
      const challengeToUse =
        settingsMethod === "authenticator"
          ? await getAuthenticatorSettingsChallenge()
          : settingsChallenge;

      if (!challengeToUse) {
        throw new Error("Send the email verification code first.");
      }

      const status = await applyAdminMFASettingsAction({
        action: pendingMFAAction.action,
        challenge_token: challengeToUse.challenge_token,
        code: settingsCode.trim(),
      });

      setMfaStatus(status);
      setMfaStatusMessage(`${pendingMFAAction.label} completed.`);
      setPendingMFAAction(null);
      setSettingsChallenge(null);
      setSettingsCode("");
      setSettingsMethod(status.preferred_mfa_method ?? "authenticator");
    } catch (error) {
      setMfaError(getErrorMessage(error, "Could not apply MFA settings action."));
    } finally {
      setMfaAction(null);
    }
  }

  async function loadBackupCodeStatus() {
    setBackupCodeError("");

    try {
      const status = await getAdminMFABackupCodeStatus();
      setBackupCodeStatus(status);
    } catch (error) {
      setBackupCodeError(
        getErrorMessage(error, "Could not load backup-code status.")
      );
    }
  }

  function startBackupCodeRegeneration() {
    setBackupCodeError("");
    setBackupCodeMessage("");
    setGeneratedBackupCodes([]);
    setIsBackupCodeFlowOpen(true);
    setBackupCodeChallenge(null);
    setBackupCodeVerificationCode("");
    setBackupCodeVerificationMethod(
      mfaStatus?.preferred_mfa_method ?? "authenticator"
    );
  }

  async function handleSendBackupEmailCode() {
    setBackupCodeError("");
    setBackupCodeMessage("");
    setBackupCodeChallenge(null);
    setBackupCodeVerificationCode("");
    setBackupCodeAction("backup-settings-challenge");

    try {
      const response = await createAdminMFASettingsChallenge("email");
      setBackupCodeChallenge(response);
      setBackupCodeMessage(response.message);
    } catch (error) {
      setBackupCodeError(
        getErrorMessage(error, "Could not send email verification code.")
      );
    } finally {
      setBackupCodeAction(null);
    }
  }

  async function getAuthenticatorBackupChallenge() {
    if (backupCodeChallenge?.method === "authenticator") {
      return backupCodeChallenge;
    }

    const response = await createAdminMFASettingsChallenge("authenticator");
    setBackupCodeChallenge(response);
    return response;
  }

  async function handleRegenerateBackupCodes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!backupCodeVerificationCode.trim()) {
      setBackupCodeError("Enter the verification code before regenerating backup codes.");
      return;
    }

    setBackupCodeError("");
    setBackupCodeMessage("");
    setBackupCodeAction("backup-codes-regenerate");

    try {
      const challengeToUse =
        backupCodeVerificationMethod === "authenticator"
          ? await getAuthenticatorBackupChallenge()
          : backupCodeChallenge;

      if (!challengeToUse) {
        throw new Error("Send the email verification code first.");
      }

      const response = await regenerateAdminMFABackupCodes({
        challenge_token: challengeToUse.challenge_token,
        code: backupCodeVerificationCode.trim(),
      });

      setBackupCodeStatus({
        account_type: response.account_type,
        backup_codes_available: response.backup_codes_available,
        available_backup_code_count: response.available_backup_code_count,
      });
      setGeneratedBackupCodes(response.backup_codes);
      setBackupCodeMessage(response.message);
      setIsBackupCodeFlowOpen(false);
      setBackupCodeChallenge(null);
      setBackupCodeVerificationCode("");
    } catch (error) {
      setBackupCodeError(
        getErrorMessage(error, "Could not regenerate backup codes.")
      );
    } finally {
      setBackupCodeAction(null);
    }
  }

  async function handleCopyBackupCodes() {
    setBackupCodeError("");

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable.");
      }

      await navigator.clipboard.writeText(generatedBackupCodes.join("\n"));
      setBackupCodeMessage("Backup codes copied. Store them somewhere safe now.");
    } catch {
      setBackupCodeError("Could not copy automatically. Select and copy the codes manually.");
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
  const canVerifyWithEmail = emailMfaActive || pendingMFAAction?.action === "enable_email";
  const canVerifyWithAuthenticator = authenticatorMfaActive;
  const canTypeSettingsCode =
    settingsMethod === "authenticator" || Boolean(settingsChallenge);

  const backupCodesAvailable = backupCodeStatus?.backup_codes_available ?? false;
  const backupCodeCount = backupCodeStatus?.available_backup_code_count ?? 0;
  const canVerifyBackupWithEmail = emailMfaActive;
  const canVerifyBackupWithAuthenticator = authenticatorMfaActive;
  const canTypeBackupVerificationCode =
    backupCodeVerificationMethod === "authenticator" || Boolean(backupCodeChallenge);

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
              className="pf-secondary-button pf-settings-action-button"
              type="button"
              disabled={mfaAction !== null || emailMfaActive}
              onClick={() => startMFAAction("enable_email")}
            >
              Enable Email MFA
            </button>

            <button
              className="pf-secondary-button pf-settings-action-button pf-settings-danger-action"
              type="button"
              disabled={
                mfaAction !== null ||
                !emailMfaActive ||
                mfaStatus?.can_disable_email_mfa === false
              }
              onClick={() => startMFAAction("disable_email")}
            >
              Disable Email MFA
            </button>

            <button
              className="pf-secondary-button pf-settings-action-button pf-settings-danger-action"
              type="button"
              disabled={
                mfaAction !== null ||
                !authenticatorMfaActive ||
                mfaStatus?.can_disable_authenticator_mfa === false
              }
              onClick={() => startMFAAction("disable_authenticator")}
            >
              Disable Authenticator
            </button>
          </div>

          <div className="pf-settings-action-row">
            <button
              className="pf-secondary-button pf-settings-action-button"
              type="button"
              disabled={
                mfaAction !== null || !emailMfaActive || preferredMethod === "email"
              }
              onClick={() => startMFAAction("prefer_email")}
            >
              Prefer Email
            </button>

            <button
              className="pf-secondary-button pf-settings-action-button"
              type="button"
              disabled={
                mfaAction !== null ||
                !authenticatorMfaActive ||
                preferredMethod === "authenticator"
              }
              onClick={() => startMFAAction("prefer_authenticator")}
            >
              Prefer Authenticator
            </button>

            <button
              className="pf-secondary-button pf-settings-action-button"
              type="button"
              disabled={mfaAction !== null}
              onClick={() => void loadMFAStatus()}
            >
              Refresh MFA status
            </button>
          </div>

          {pendingMFAAction && (
            <form className="pf-settings-mfa-verification" onSubmit={handleApplySettingsAction}>
              <div>
                <h3>{pendingMFAAction.label}</h3>
                <p>{pendingMFAAction.description}</p>
              </div>

              <div className="pf-settings-verification-row">
                <label>
                  Verify with
                  <select
                    value={settingsMethod}
                    onChange={(event) => {
                      setSettingsMethod(event.target.value as MFAMethod);
                      setSettingsChallenge(null);
                      setSettingsCode("");
                      setMfaStatusMessage("");
                      setMfaError("");
                    }}
                  >
                    <option value="email" disabled={!canVerifyWithEmail}>
                      Email code
                    </option>
                    <option
                      value="authenticator"
                      disabled={!canVerifyWithAuthenticator}
                    >
                      Authenticator app
                    </option>
                  </select>
                </label>

                {settingsMethod === "email" && (
                  <button
                    className="pf-secondary-button pf-settings-action-button"
                    type="button"
                    disabled={mfaAction !== null}
                    onClick={() => void handleSendEmailSettingsCode()}
                  >
                    {mfaAction === "settings-challenge"
                      ? "Sending..."
                      : settingsChallenge
                        ? "Resend email code"
                        : "Send verification code"}
                  </button>
                )}

                <label>
                  Verification code
                  <input
                    value={settingsCode}
                    onChange={(event) => setSettingsCode(event.target.value)}
                    placeholder={
                      settingsMethod === "email"
                        ? "Email code"
                        : "Authenticator code"
                    }
                    autoComplete="one-time-code"
                    disabled={!canTypeSettingsCode}
                    required
                  />
                </label>
              </div>

              <div className="pf-settings-action-row">
                <button
                  className="pf-primary-button pf-settings-confirm-button"
                  type="submit"
                  disabled={
                    !settingsCode.trim() ||
                    mfaAction !== null ||
                    (settingsMethod === "email" && !settingsChallenge)
                  }
                >
                  {mfaAction === "settings-action"
                    ? "Applying..."
                    : `Confirm ${pendingMFAAction.label}`}
                </button>

                <button
                  className="pf-secondary-button pf-settings-action-button"
                  type="button"
                  disabled={mfaAction !== null}
                  onClick={() => {
                    setPendingMFAAction(null);
                    setSettingsChallenge(null);
                    setSettingsCode("");
                    setMfaStatusMessage("");
                    setMfaError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

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
          <span className="pf-settings-label">Recovery backup codes</span>

          <div className="pf-settings-recovery-header">
            <div>
              <h3>Backup recovery codes</h3>
              <p>
                Use these one-time codes only when your normal MFA method is
                unavailable. New codes are shown once, then only hashes are stored.
              </p>
            </div>

            <StatusPill
              active={backupCodesAvailable}
              activeLabel={`${backupCodeCount} available`}
              inactiveLabel="Not generated"
            />
          </div>

          <div className="pf-settings-action-row">
            <button
              className="pf-secondary-button pf-settings-action-button"
              type="button"
              disabled={backupCodeAction !== null}
              onClick={() => void loadBackupCodeStatus()}
            >
              Refresh backup-code status
            </button>

            <button
              className="pf-secondary-button pf-settings-action-button"
              type="button"
              disabled={
                backupCodeAction !== null ||
                (!canVerifyBackupWithEmail && !canVerifyBackupWithAuthenticator)
              }
              onClick={startBackupCodeRegeneration}
            >
              {backupCodesAvailable ? "Regenerate backup codes" : "Generate backup codes"}
            </button>
          </div>

          {isBackupCodeFlowOpen && (
            <form
              className="pf-settings-mfa-verification"
              onSubmit={handleRegenerateBackupCodes}
            >
              <div>
                <h3>
                  {backupCodesAvailable
                    ? "Regenerate backup codes"
                    : "Generate backup codes"}
                </h3>
                <p>
                  This will revoke old unused backup codes and create a fresh set.
                  You must verify with an active MFA method first.
                </p>
              </div>

              <div className="pf-settings-verification-row">
                <label>
                  Verify with
                  <select
                    value={backupCodeVerificationMethod}
                    onChange={(event) => {
                      setBackupCodeVerificationMethod(
                        event.target.value as MFAMethod
                      );
                      setBackupCodeChallenge(null);
                      setBackupCodeVerificationCode("");
                      setBackupCodeMessage("");
                      setBackupCodeError("");
                    }}
                  >
                    <option value="email" disabled={!canVerifyBackupWithEmail}>
                      Email code
                    </option>
                    <option
                      value="authenticator"
                      disabled={!canVerifyBackupWithAuthenticator}
                    >
                      Authenticator app
                    </option>
                  </select>
                </label>

                {backupCodeVerificationMethod === "email" && (
                  <button
                    className="pf-secondary-button pf-settings-action-button"
                    type="button"
                    disabled={backupCodeAction !== null}
                    onClick={() => void handleSendBackupEmailCode()}
                  >
                    {backupCodeAction === "backup-settings-challenge"
                      ? "Sending..."
                      : backupCodeChallenge
                        ? "Resend email code"
                        : "Send verification code"}
                  </button>
                )}

                <label>
                  Verification code
                  <input
                    value={backupCodeVerificationCode}
                    onChange={(event) =>
                      setBackupCodeVerificationCode(event.target.value)
                    }
                    placeholder={
                      backupCodeVerificationMethod === "email"
                        ? "Email code"
                        : "Authenticator code"
                    }
                    autoComplete="one-time-code"
                    disabled={!canTypeBackupVerificationCode}
                    required
                  />
                </label>
              </div>

              <div className="pf-settings-action-row">
                <button
                  className="pf-primary-button pf-settings-confirm-button"
                  type="submit"
                  disabled={
                    !backupCodeVerificationCode.trim() ||
                    backupCodeAction !== null ||
                    (backupCodeVerificationMethod === "email" &&
                      !backupCodeChallenge)
                  }
                >
                  {backupCodeAction === "backup-codes-regenerate"
                    ? "Generating..."
                    : "Confirm and show backup codes"}
                </button>

                <button
                  className="pf-secondary-button pf-settings-action-button"
                  type="button"
                  disabled={backupCodeAction !== null}
                  onClick={() => {
                    setIsBackupCodeFlowOpen(false);
                    setBackupCodeChallenge(null);
                    setBackupCodeVerificationCode("");
                    setBackupCodeMessage("");
                    setBackupCodeError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {generatedBackupCodes.length > 0 && (
            <div className="pf-backup-codes-result">
              <div>
                <strong>Save these backup codes now</strong>
                <p>
                  PulseFi will not show these codes again. Each code can be used
                  once during MFA verification.
                </p>
              </div>

              <div className="pf-backup-codes-grid" aria-label="Generated backup codes">
                {generatedBackupCodes.map((backupCode) => (
                  <code key={backupCode}>{backupCode}</code>
                ))}
              </div>

              <button
                className="pf-secondary-button pf-settings-action-button"
                type="button"
                onClick={() => void handleCopyBackupCodes()}
              >
                Copy all backup codes
              </button>
            </div>
          )}

          {backupCodeError && <div className="pf-error-box">{backupCodeError}</div>}
          {backupCodeMessage && (
            <div className="pf-success-box">{backupCodeMessage}</div>
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
                className="pf-secondary-button pf-settings-action-button"
                type="button"
                onClick={() => void handleRequestIdentityChallenge()}
                disabled={isRequestingChallenge}
              >
                {isRequestingChallenge
                  ? "Sending..."
                  : challenge?.method === "email"
                    ? "Resend email code"
                    : challenge
                      ? "Restart 2FA verification"
                      : "Start 2FA verification"}
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

            {identityError && <div className="pf-error-box">{identityError}</div>}
            {identitySuccess && (
              <div className="pf-success-box">{identitySuccess}</div>
            )}

            <button
              className="pf-primary-button pf-settings-confirm-button"
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
                className="pf-settings-shortcut-button"
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
