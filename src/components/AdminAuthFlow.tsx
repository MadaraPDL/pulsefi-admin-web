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
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">PulseFi Admin</p>
        <h1>Admin Login</h1>
        <p className="muted">
          Sign in to access the Platform Admin or ISP Admin dashboard.
        </p>

        <form onSubmit={handleLogin} className="auth-form">
          <label>
            Email or username
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="platform.demo@pulsefi-demo.com"
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
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage && <div className="error-box">{errorMessage}</div>}

          <button disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
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
        code,
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
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">PulseFi Security</p>
        <h1>MFA Verification</h1>
        <p className="muted">{getMFAInstruction(challenge.method)}</p>

        <form onSubmit={handleVerifyMFA} className="auth-form">
          <label>
            MFA code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </label>

          {import.meta.env.DEV && challenge.dev_email_code ? (
            <div className="dev-token-box">
              <strong>Development email MFA code</strong>
              <code>{challenge.dev_email_code}</code>
            </div>
          ) : null}

          {errorMessage && <div className="error-box">{errorMessage}</div>}

          <button disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify MFA"}
          </button>

          <button className="secondary-button" type="button" onClick={onBack}>
            Back to login
          </button>
        </form>
      </section>
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

  async function handleConfirmSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await confirmAdminMFASetup(
        setup.mfa_setup_token,
        code,
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
    <main className="auth-page">
      <section className="auth-card wide-auth-card">
        <p className="eyebrow">PulseFi Security</p>
        <h1>Set up MFA</h1>
        <p className="muted">
          This admin account requires MFA before a login token can be issued.
        </p>

        <div className="dev-token-box">
          <strong>Manual authenticator secret</strong>
          <code>{setup.authenticator_secret}</code>
          <small>
            Add this secret to an authenticator app, then enter the generated
            code below.
          </small>
        </div>

        <form onSubmit={handleConfirmSetup} className="auth-form">
          <label>
            Authenticator code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </label>

          {errorMessage && <div className="error-box">{errorMessage}</div>}

          <button disabled={isSubmitting}>
            {isSubmitting ? "Confirming..." : "Confirm MFA setup"}
          </button>

          <button className="secondary-button" type="button" onClick={onBack}>
            Back to login
          </button>
        </form>
      </section>
    </main>
  );
}
