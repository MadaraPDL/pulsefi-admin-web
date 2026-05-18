import { useState } from "react";
import type { FormEvent } from "react";
import {
  confirmAdminMFASetup,
  loginAdmin,
  verifyAdminMFA,
} from "../api/adminAuth";
import type {
  AdminAuthenticatedResult,
  AdminLoginResult,
} from "../api/adminAuth";
import type {
  MFARequiredResponse,
  MFASetupRequiredResponse,
} from "../api/auth";
import { getErrorMessage } from "../api/errors";

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

function PulseFiLogo() {
  return (
    <div className="stitch-logo" aria-label="PulseFi">
      <div className="stitch-logo-mark">
        <span className="stitch-logo-pulse">P</span>
        <span>PulseFi</span>
      </div>
    </div>
  );
}

function getMFAInstruction(method: string) {
  if (method === "email") {
    return "Enter the code sent to your admin email address.";
  }

  return "Enter the 6-digit code from your authenticator app.";
}

export function AdminAuthFlow({
  onAuthenticated,
}: {
  onAuthenticated: (result: AdminAuthenticatedResult) => void;
}) {
  const [step, setStep] = useState<AuthStep>({ kind: "login" });

  function handleLoginResult(result: AdminLoginResult) {
    if (result.kind === "mfa_required") {
      setStep({
        kind: "mfa_required",
        challenge: result.challenge,
        identifier: result.identifier,
      });
      return;
    }

    if (result.kind === "mfa_setup_required") {
      setStep({
        kind: "mfa_setup_required",
        setup: result.setup,
        identifier: result.identifier,
      });
      return;
    }

    onAuthenticated(result);
  }

  if (step.kind === "mfa_required") {
    return (
      <MFAVerifyPage
        challenge={step.challenge}
        identifier={step.identifier}
        onBack={() => setStep({ kind: "login" })}
        onAuthenticated={onAuthenticated}
      />
    );
  }

  if (step.kind === "mfa_setup_required") {
    return (
      <MFASetupPage
        setup={step.setup}
        identifier={step.identifier}
        onBack={() => setStep({ kind: "login" })}
        onAuthenticated={onAuthenticated}
      />
    );
  }

  return <AdminLoginPage onLoginResult={handleLoginResult} />;
}

function AdminLoginPage({
  onLoginResult,
}: {
  onLoginResult: (result: AdminLoginResult) => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await loginAdmin(identifier, password);
      onLoginResult(result);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not sign in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="stitch-auth-page">
      <div className="stitch-auth-wrap">
        <PulseFiLogo />

        <section className="stitch-login-card">
          <div className="stitch-auth-heading">
            <h1>Admin Login</h1>
            <p>Sign in to access the control panel</p>
          </div>

          <form onSubmit={handleLogin} className="stitch-auth-form">
            <div className="stitch-field">
              <label className="stitch-label" htmlFor="admin-identifier">
                Email Address
              </label>

              <div className="stitch-input-shell">
                <span className="stitch-input-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">mail</span>
                </span>

                <input
                  id="admin-identifier"
                  className="stitch-input"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="admin@pulsefi.com"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="stitch-field">
              <div className="stitch-label-row">
                <label className="stitch-label" htmlFor="admin-password">
                  Password
                </label>

                <button className="stitch-link-button" type="button">
                  Forgot password?
                </button>
              </div>

              <div className="stitch-input-shell">
                <span className="stitch-input-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">lock</span>
                </span>

                <input
                  id="admin-password"
                  className="stitch-input stitch-input-with-action"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />

                <button
                  className="stitch-password-toggle"
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
              <div className="stitch-error-box">{errorMessage}</div>
            )}

            <div className="stitch-submit-row">
              <button className="stitch-primary-button" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Login"}
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </button>
            </div>
          </form>

          <div className="stitch-auth-footer">
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
  onBack,
  onAuthenticated,
}: {
  challenge: MFARequiredResponse;
  identifier: string;
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
      const result = await verifyAdminMFA(
        challenge.challenge_token,
        code.trim().replace(/\s/g, ""),
        identifier
      );
      onAuthenticated(result);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not verify MFA code."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="stitch-auth-page">
      <div className="stitch-auth-wrap">
        <PulseFiLogo />

        <section className="stitch-login-card">
          <div className="stitch-auth-heading">
            <h1>MFA Verification</h1>
            <p>{getMFAInstruction(challenge.method)}</p>
          </div>

          <form onSubmit={handleVerifyMFA} className="stitch-auth-form">
            <div className="stitch-field">
              <label className="stitch-label" htmlFor="mfa-code">
                Verification Code
              </label>

              <div className="stitch-input-shell">
                <input
                  id="mfa-code"
                  className="stitch-input stitch-input-no-icon stitch-mfa-code"
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
              <div className="stitch-dev-box">
                <strong>Development email MFA code</strong>
                <code>{challenge.dev_email_code}</code>
              </div>
            ) : null}

            {errorMessage && (
              <div className="stitch-error-box">{errorMessage}</div>
            )}

            <button className="stitch-primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify MFA"}
              <span className="material-symbols-outlined" aria-hidden="true">
                verified_user
              </span>
            </button>

            <button
              className="stitch-secondary-button"
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
  onBack,
  onAuthenticated,
}: {
  setup: MFASetupRequiredResponse;
  identifier: string;
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
      const result = await confirmAdminMFASetup(
        setup.mfa_setup_token,
        code.trim().replace(/\s/g, ""),
        identifier
      );
      onAuthenticated(result);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not confirm MFA setup."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="stitch-auth-page">
      <div className="stitch-auth-wrap stitch-auth-wrap-wide">
        <PulseFiLogo />

        <section className="stitch-login-card">
          <div className="stitch-auth-heading">
            <h1>Set up MFA</h1>
            <p>This admin account requires MFA before a login token is issued.</p>
          </div>

          <div className="stitch-mfa-setup-card">
            <div className="stitch-mfa-setup-header">
              <div className="stitch-mfa-step-badge">1</div>

              <div>
                <strong>Connect your authenticator app</strong>
                <p>
                  Add the newest PulseFi secret, then enter the fresh 6-digit
                  code generated by your app.
                </p>
              </div>
            </div>

            <div className="stitch-secret-box" aria-label="Authenticator secret">
              <span>Secret key</span>
              <code>{groupedAuthenticatorSecret}</code>
            </div>

            <div className="stitch-mfa-action-grid">
              <a
                className="stitch-authenticator-link stitch-authenticator-link-primary"
                href={setup.authenticator_uri}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  open_in_new
                </span>
                Open authenticator
              </a>

              <button
                className="stitch-copy-secret-button"
                type="button"
                onClick={() => void handleCopySecret()}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {hasCopiedSecret ? "done" : "content_copy"}
                </span>
                {hasCopiedSecret ? "Copied" : "Copy secret"}
              </button>
            </div>

            <p className="stitch-mfa-hint">
              If you logged in again, delete the old PulseFi entry from your
              authenticator app and use this newest secret.
            </p>
          </div>

          <form onSubmit={handleConfirmSetup} className="stitch-auth-form">
            <div className="stitch-field">
              <label className="stitch-label" htmlFor="mfa-setup-code">
                Authenticator Code
              </label>

              <input
                id="mfa-setup-code"
                className="stitch-input stitch-input-no-icon stitch-mfa-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </div>

            {errorMessage && (
              <div className="stitch-error-box">{errorMessage}</div>
            )}

            <button className="stitch-primary-button" disabled={isSubmitting}>
              {isSubmitting ? "Confirming..." : "Confirm MFA setup"}
              <span className="material-symbols-outlined" aria-hidden="true">
                security
              </span>
            </button>

            <button
              className="stitch-secondary-button"
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
