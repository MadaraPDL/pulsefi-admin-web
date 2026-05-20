import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  assertAdminSession,
  buildAdminAuthenticatedResult,
  confirmAdminMFASetup,
  isMFARequiredResponse,
  isMFASetupRequiredResponse,
  loginAsAdmin,
  verifyAdminMFA,
} from "../api/adminAuth";
import type {
  AdminAuthenticatedResult,
  AdminLoginResponse,
  MFARequiredResponse,
  MFASetupRequiredResponse,
} from "../api/adminAuth";
import { getErrorMessage } from "../api/errors";
import type { AdminTheme } from "../App.real";
import { AdminPasswordResetFlow } from "./AdminPasswordResetFlow";

type AuthStep =
  | { kind: "login" }
  | {
      kind: "mfa_required";
      challenge: MFARequiredResponse;
      identifier: string;
    }
  | {
      kind: "mfa_setup_required";
      setup: MFASetupRequiredResponse;
      identifier: string;
    };

function getMFAInstruction(method: string) {
  if (method === "email") {
    return "Enter the code sent to your admin email address.";
  }

  return "Enter the 6-digit code from your authenticator app.";
}


const ADMIN_AUTH_STEP_STORAGE_KEY = "pulsefi-admin-auth-step";

function getStoredAuthStep(): AuthStep {
  try {
    const rawStep = window.sessionStorage.getItem(ADMIN_AUTH_STEP_STORAGE_KEY);

    if (!rawStep) {
      return { kind: "login" };
    }

    const parsedStep = JSON.parse(rawStep) as Partial<AuthStep>;

    if (
      parsedStep.kind === "mfa_required" &&
      parsedStep.challenge?.challenge_token &&
      typeof parsedStep.identifier === "string"
    ) {
      return parsedStep as AuthStep;
    }

    if (
      parsedStep.kind === "mfa_setup_required" &&
      parsedStep.setup?.mfa_setup_token &&
      typeof parsedStep.identifier === "string"
    ) {
      return parsedStep as AuthStep;
    }
  } catch {
    // If stored data is invalid or unavailable, safely fall back to login.
  }

  return { kind: "login" };
}

function storeAuthStep(step: AuthStep) {
  try {
    if (step.kind === "login") {
      window.sessionStorage.removeItem(ADMIN_AUTH_STEP_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(
      ADMIN_AUTH_STEP_STORAGE_KEY,
      JSON.stringify(step)
    );
  } catch {
    // Auth still works without storage.
  }
}

function clearStoredAuthStep() {
  try {
    window.sessionStorage.removeItem(ADMIN_AUTH_STEP_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function AdminAuthFlow({
  theme,
  onSetTheme,
  onAuthenticated,
}: {
  theme: AdminTheme;
  onSetTheme: (theme: AdminTheme) => void;
  onAuthenticated: (result: AdminAuthenticatedResult) => void;
}) {
  const [step, setStep] = useState<AuthStep>(getStoredAuthStep);

  useEffect(() => {
    storeAuthStep(step);
  }, [step]);

  function handleAuthenticated(result: AdminAuthenticatedResult) {
    clearStoredAuthStep();
    onAuthenticated(result);
  }

  function handleLoginResponse(response: AdminLoginResponse, identifier: string) {
    if (isMFARequiredResponse(response)) {
      setStep({
        kind: "mfa_required",
        challenge: response,
        identifier,
      });
      return;
    }

    if (isMFASetupRequiredResponse(response)) {
      setStep({
        kind: "mfa_setup_required",
        setup: response,
        identifier,
      });
      return;
    }

    const session = assertAdminSession(response);
    onAuthenticated(buildAdminAuthenticatedResult(session, identifier));
  }

  if (step.kind === "mfa_required") {
    return (
      <MFAVerifyPage
        challenge={step.challenge}
        identifier={step.identifier}
        theme={theme}
        onSetTheme={onSetTheme}
        onBack={() => setStep({ kind: "login" })}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  if (step.kind === "mfa_setup_required") {
    return (
      <MFASetupPage
        setup={step.setup}
        identifier={step.identifier}
        theme={theme}
        onSetTheme={onSetTheme}
        onBack={() => setStep({ kind: "login" })}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <AdminLoginPage
      theme={theme}
      onSetTheme={onSetTheme}
      onLoginResponse={handleLoginResponse}
    />
  );
}

function AdminLoginPage({
  theme,
  onSetTheme,
  onLoginResponse,
}: {
  theme: AdminTheme;
  onSetTheme: (theme: AdminTheme) => void;
  onLoginResponse: (response: AdminLoginResponse, identifier: string) => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await loginAsAdmin(identifier, password);
      onLoginResponse(response, identifier);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not sign in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="pf-auth-page">
      <AuthThemeToggle theme={theme} onSetTheme={onSetTheme} />

      <div className="pf-auth-wrap">
        <section className="pf-login-card">
          <div className="pf-auth-heading">
            <h1>{isResetMode ? "Reset Password" : "Admin Login"}</h1>
            <p>
              {isResetMode
                ? "Send a reset email, then set a new admin password."
                : "Sign in to access the control panel"}
            </p>
          </div>

          {isResetMode ? (
            <AdminPasswordResetFlow
              initialIdentifier={identifier}
              onDone={() => setIsResetMode(false)}
            />
          ) : (
            <form onSubmit={handleLogin} className="pf-auth-form">
              <div className="pf-field">
                <label className="pf-label" htmlFor="admin-identifier">
                  Email Address
                </label>

                <div className="pf-input-shell">
                  <span className="pf-input-icon" aria-hidden="true">
                    <span className="material-symbols-outlined">mail</span>
                  </span>

                  <input
                    id="admin-identifier"
                    className="pf-input"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="admin@pulsefi.com"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="pf-field">
                <label className="pf-label" htmlFor="admin-password">
                  Password
                </label>

                <div className="pf-input-shell">
                  <span className="pf-input-icon" aria-hidden="true">
                    <span className="material-symbols-outlined">lock</span>
                  </span>

                  <input
                    id="admin-password"
                    className="pf-input pf-input-with-action"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    autoComplete="current-password"
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

                <button
                  className="pf-link-button"
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setIsResetMode(true);
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {errorMessage && (
                <div className="pf-error-box">{errorMessage}</div>
              )}

              <div className="pf-submit-row">
                <button
                  className="pf-primary-button pf-login-submit-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Login"}
                  <span className="material-symbols-outlined" aria-hidden="true">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>
          )}

          <div className="pf-auth-footer">
            <p>Secure Connection Environment</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function MFAVerifyPage({
  challenge,
  identifier,
  theme,
  onSetTheme,
  onBack,
  onAuthenticated,
}: {
  challenge: MFARequiredResponse;
  identifier: string;
  theme: AdminTheme;
  onSetTheme: (theme: AdminTheme) => void;
  onBack: () => void;
  onAuthenticated: (result: AdminAuthenticatedResult) => void;
}) {
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVerifyMFA(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const session = await verifyAdminMFA({
        challenge_token: challenge.challenge_token,
        code: code.trim().replace(/\s/g, ""),
      });

      onAuthenticated(buildAdminAuthenticatedResult(session, identifier));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not verify MFA code."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="pf-auth-page">
      <AuthThemeToggle theme={theme} onSetTheme={onSetTheme} />

      <div className="pf-auth-wrap">
        <section className="pf-login-card pf-mfa-card">
          <div className="pf-auth-heading">
            <h1>MFA Verification</h1>
            <p>{getMFAInstruction(challenge.method)}</p>
          </div>

          <form onSubmit={handleVerifyMFA} className="pf-auth-form">
            <div className="pf-field pf-mfa-code-field">
              <label className="pf-label" htmlFor="mfa-code">
                Verification Code
              </label>

              <div className="pf-input-shell">
                <input
                  id="mfa-code"
                  className="pf-input pf-input-no-icon pf-mfa-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </div>
            </div>

            {import.meta.env.DEV && challenge.dev_email_code ? (
              <div className="pf-dev-box">
                <strong>Development email MFA code</strong>
                <code>{challenge.dev_email_code}</code>
              </div>
            ) : null}

            {errorMessage && (
              <div className="pf-error-box">{errorMessage}</div>
            )}

            <button
              className="pf-primary-button pf-mfa-action-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Verify MFA"}
              <span className="material-symbols-outlined" aria-hidden="true">
                verified_user
              </span>
            </button>

            <button
              className="pf-secondary-button pf-mfa-back-button"
              type="button"
              onClick={onBack}
            >
              Back to login
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function MFASetupPage({
  setup,
  identifier,
  theme,
  onSetTheme,
  onBack,
  onAuthenticated,
}: {
  setup: MFASetupRequiredResponse;
  identifier: string;
  theme: AdminTheme;
  onSetTheme: (theme: AdminTheme) => void;
  onBack: () => void;
  onAuthenticated: (result: AdminAuthenticatedResult) => void;
}) {
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCopiedSecret, setHasCopiedSecret] = useState(false);

  const groupedAuthenticatorSecret =
    setup.authenticator_secret.match(/.{1,4}/g)?.join(" ") ??
    setup.authenticator_secret;

  async function handleCopySecret() {
    setErrorMessage("");

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable.");
      }

      await navigator.clipboard.writeText(setup.authenticator_secret);
      setHasCopiedSecret(true);
    } catch {
      setErrorMessage(
        "Could not copy automatically. Long-press the secret key and copy it manually."
      );
    }
  }

  async function handleConfirmSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const session = await confirmAdminMFASetup({
        mfa_setup_token: setup.mfa_setup_token,
        code: code.trim().replace(/\s/g, ""),
      });

      onAuthenticated(buildAdminAuthenticatedResult(session, identifier));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not confirm MFA setup."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="pf-auth-page">
      <AuthThemeToggle theme={theme} onSetTheme={onSetTheme} />

      <div className="pf-auth-wrap pf-auth-wrap-wide">
        <section className="pf-login-card pf-mfa-card">
          <div className="pf-auth-heading">
            <h1>Set up MFA</h1>
            <p>This admin account requires MFA before a login token is issued.</p>
          </div>

          <div className="pf-mfa-setup-card">
            <div className="pf-mfa-setup-header">
              <div className="pf-mfa-step-badge">1</div>

              <div>
                <strong>Connect your authenticator app</strong>
                <p>
                  Add the newest PulseFi secret, then enter the fresh 6-digit
                  code generated by your app.
                </p>
              </div>
            </div>

            <div className="pf-secret-box" aria-label="Authenticator secret">
              <span>Secret key</span>
              <code>{groupedAuthenticatorSecret}</code>
            </div>

            <div className="pf-mfa-action-grid">
              <a
                className="pf-authenticator-link pf-authenticator-link-primary"
                href={setup.authenticator_uri}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  open_in_new
                </span>
                Open authenticator
              </a>

              <button
                className="pf-copy-secret-button"
                type="button"
                onClick={() => void handleCopySecret()}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {hasCopiedSecret ? "done" : "content_copy"}
                </span>
                {hasCopiedSecret ? "Copied" : "Copy secret"}
              </button>
            </div>

            <p className="pf-mfa-hint">
              If you logged in again, delete the old PulseFi entry from your
              authenticator app and use this newest secret.
            </p>
          </div>

          <form onSubmit={handleConfirmSetup} className="pf-auth-form">
            <div className="pf-field pf-mfa-code-field">
              <label className="pf-label" htmlFor="mfa-setup-code">
                Authenticator Code
              </label>

              <input
                id="mfa-setup-code"
                className="pf-input pf-input-no-icon pf-mfa-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </div>

            {errorMessage && (
              <div className="pf-error-box">{errorMessage}</div>
            )}

            <button
              className="pf-primary-button pf-mfa-action-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Confirming..." : "Confirm MFA setup"}
              <span className="material-symbols-outlined" aria-hidden="true">
                security
              </span>
            </button>

            <button
              className="pf-secondary-button pf-mfa-back-button"
              type="button"
              onClick={onBack}
            >
              Back to login
            </button>
          </form>
        </section>
      </div>
    </main>
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
    <div className="pf-auth-theme-toggle" aria-label="Login theme">
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



