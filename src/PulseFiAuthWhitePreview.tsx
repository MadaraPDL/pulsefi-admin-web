import { useState } from "react";
import "./pulsefi-white-design.css";

const authScreens = [
  "Login",
  "MFA",
  "Forgot Password",
  "Reset Password",
  "Accept Invitation",
  "Session Expired",
];

function StatusBadge({
  label,
  type,
}: {
  label: string;
  type: "success" | "warning" | "error";
}) {
  return <span className={`pf-status ${type}`}>{label}</span>;
}

function AuthShell({
  activeScreen,
  setActiveScreen,
  children,
}: {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pf-auth-page">
      <section className="pf-auth-card">
        <div className="pf-auth-brand">
          <div className="pf-brand-mark">P</div>
          <div>
            <div className="pf-brand-title">PulseFi</div>
            <div className="pf-brand-subtitle">Secure access</div>
          </div>
        </div>

        <div className="pf-auth-tabs">
          {authScreens.map((screen) => (
            <button
              key={screen}
              type="button"
              className={screen === activeScreen ? "active" : ""}
              onClick={() => setActiveScreen(screen)}
            >
              {screen}
            </button>
          ))}
        </div>

        {children}
      </section>

      <aside className="pf-auth-side-panel">
        <div>
          <div className="pf-eyebrow">Design preview</div>
          <h1 className="pf-title">PulseFi authentication flow</h1>
          <p className="pf-description">
            Shared login, MFA, password reset, and invitation screens for Platform Admin,
            ISP Admin, and App User accounts.
          </p>
        </div>

        <div className="pf-auth-feature-list">
          <div>
            <strong>Role-aware access</strong>
            <span>Platform Admin, ISP Admin, and App User routes after login.</span>
          </div>
          <div>
            <strong>MFA ready</strong>
            <span>Supports verification codes and backup-code recovery.</span>
          </div>
          <div>
            <strong>Invitation setup</strong>
            <span>Invited users complete account setup before using PulseFi.</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function LoginScreen({ goTo }: { goTo: (screen: string) => void }) {
  return (
    <div className="pf-auth-form">
      <div>
        <h2>Sign in to PulseFi</h2>
        <p>Use the account provided by your administrator or ISP.</p>
      </div>

      <label className="pf-field">
        Email or username
        <input placeholder="admin@example.com" />
      </label>

      <label className="pf-field">
        Password
        <input placeholder="Enter your password" type="password" />
      </label>

      <button className="pf-button primary pf-full-button" onClick={() => goTo("MFA")}>
        Sign in
      </button>

      <button className="pf-small-link pf-auth-link" onClick={() => goTo("Forgot Password")}>
        Forgot password?
      </button>

      <div className="pf-auth-error">
        Wrong email, username, or password. Please check your details and try again.
      </div>
    </div>
  );
}

function MFAScreen() {
  return (
    <div className="pf-auth-form">
      <div>
        <h2>Verify your sign in</h2>
        <p>Enter the verification code from your authenticator app or email.</p>
      </div>

      <label className="pf-field">
        Verification code
        <input className="pf-mono" placeholder="123456" />
      </label>

      <button className="pf-button primary pf-full-button">Verify</button>

      <div className="pf-auth-inline-actions">
        <button className="pf-small-link">Resend code</button>
        <button className="pf-small-link">Use backup code</button>
      </div>

      <div className="pf-auth-warning">
        This code is invalid or expired. Request a new code or use a backup code.
      </div>
    </div>
  );
}

function ForgotPasswordScreen({ goTo }: { goTo: (screen: string) => void }) {
  return (
    <div className="pf-auth-form">
      <div>
        <h2>Reset your password</h2>
        <p>Enter your email or username. If the account exists, reset instructions will be sent.</p>
      </div>

      <label className="pf-field">
        Email or username
        <input placeholder="admin@example.com" />
      </label>

      <button className="pf-button primary pf-full-button">Send reset link</button>

      <div className="pf-auth-success">
        Reset instructions were sent if an account exists for this email or username.
      </div>

      <button className="pf-small-link pf-auth-link" onClick={() => goTo("Login")}>
        Back to login
      </button>
    </div>
  );
}

function ResetPasswordScreen({ goTo }: { goTo: (screen: string) => void }) {
  return (
    <div className="pf-auth-form">
      <div>
        <h2>Create a new password</h2>
        <p>Use a strong password that you do not use on other accounts.</p>
      </div>

      <label className="pf-field">
        New password
        <input type="password" placeholder="Enter new password" />
      </label>

      <label className="pf-field">
        Confirm password
        <input type="password" placeholder="Confirm new password" />
      </label>

      <div className="pf-auth-helper">
        Password should be at least 8 characters and include letters, numbers, and a symbol.
      </div>

      <button className="pf-button primary pf-full-button" onClick={() => goTo("Login")}>
        Reset password
      </button>

      <div className="pf-auth-success">Password changed successfully. You can now sign in.</div>
    </div>
  );
}

function AcceptInvitationScreen({ goTo }: { goTo: (screen: string) => void }) {
  return (
    <div className="pf-auth-form">
      <div>
        <h2>Accept invitation</h2>
        <p>Complete your PulseFi account setup before signing in.</p>
      </div>

      <div className="pf-auth-invite-status">
        <StatusBadge label="Pending invitation" type="warning" />
        <span>Invitation expires in 6 days.</span>
      </div>

      <label className="pf-field">
        Full name
        <input placeholder="Example: Ali Hassan" />
      </label>

      <label className="pf-field">
        Username
        <input placeholder="alihassan" />
      </label>

      <label className="pf-field">
        Password
        <input type="password" placeholder="Create password" />
      </label>

      <label className="pf-field">
        Confirm password
        <input type="password" placeholder="Confirm password" />
      </label>

      <button className="pf-button primary pf-full-button" onClick={() => goTo("Login")}>
        Accept invitation
      </button>

      <div className="pf-auth-warning">
        Expired invitation state: this invitation can no longer be used.
      </div>

      <div className="pf-auth-success">
        Already accepted state: this invitation was already used to create an account.
      </div>
    </div>
  );
}

function SessionExpiredScreen({ goTo }: { goTo: (screen: string) => void }) {
  return (
    <div className="pf-auth-form">
      <div>
        <h2>Session expired</h2>
        <p>Your session ended for security. Sign in again to continue using PulseFi.</p>
      </div>

      <div className="pf-auth-warning">
        You were signed out because your login session is no longer valid.
      </div>

      <button className="pf-button primary pf-full-button" onClick={() => goTo("Login")}>
        Back to login
      </button>
    </div>
  );
}

export default function PulseFiAuthWhitePreview() {
  const [activeScreen, setActiveScreen] = useState("Login");

  function renderScreen() {
    if (activeScreen === "Login") return <LoginScreen goTo={setActiveScreen} />;
    if (activeScreen === "MFA") return <MFAScreen />;
    if (activeScreen === "Forgot Password") return <ForgotPasswordScreen goTo={setActiveScreen} />;
    if (activeScreen === "Reset Password") return <ResetPasswordScreen goTo={setActiveScreen} />;
    if (activeScreen === "Accept Invitation") return <AcceptInvitationScreen goTo={setActiveScreen} />;
    if (activeScreen === "Session Expired") return <SessionExpiredScreen goTo={setActiveScreen} />;

    return <LoginScreen goTo={setActiveScreen} />;
  }

  return (
    <AuthShell activeScreen={activeScreen} setActiveScreen={setActiveScreen}>
      {renderScreen()}
    </AuthShell>
  );
}
