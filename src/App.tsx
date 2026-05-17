import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import { ApiError } from "./api/client";
import { acceptInvitation, confirmMFASetup, loginAsAdmin } from "./api/auth";
import type {
  AcceptInvitationResponse,
  AuthTokenResponse,
  MFASetupRequiredResponse,
  MFAMethod,
} from "./api/auth";
import {
  createISP,
  createISPAdminInvitation,
  getPlatformAdminSummary,
  listISPs,
  updateISP,
} from "./api/platformAdmin";
import type {
  CreateISPRequest,
  ISP,
  ISPAdminInvitation,
  ISPStatus,
  PlatformAdminSummary,
  UpdateISPRequest,
} from "./api/platformAdmin";
import { getISPAdminSummary } from "./api/ispAdmin";
import type { ISPAdminSummary } from "./api/ispAdmin";

function saveSession(session: AuthTokenResponse) {
  localStorage.setItem("pulsefi_access_token", session.access_token);
  localStorage.setItem("pulsefi_admin_name", session.full_name);
  localStorage.setItem("pulsefi_admin_role", session.role ?? "");
}

function clearSession() {
  localStorage.removeItem("pulsefi_access_token");
  localStorage.removeItem("pulsefi_admin_name");
  localStorage.removeItem("pulsefi_admin_role");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const details =
      typeof error.body.details === "string"
        ? error.body.details
        : JSON.stringify(error.body.details ?? "");

    return [
      error.body.message,
      details,
      error.body.error ? `Error code: ${error.body.error}` : "",
      `HTTP status: ${error.status}`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return fallback;
}

function isMFASetupRequiredResponse(
  response: unknown
): response is MFASetupRequiredResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "mfa_setup_required" in response
  );
}

function MFASetupPage({
  setup,
  onComplete,
}: {
  setup: MFASetupRequiredResponse;
  onComplete: () => void;
}) {
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirmSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const session = await confirmMFASetup({
        mfa_setup_token: setup.mfa_setup_token,
        code,
      });

      if (session.role !== "platform_admin" && session.role !== "isp_admin") {
        clearSession();
        setErrorMessage("This dashboard is only for admin accounts.");
        return;
      }

      saveSession(session);
      onComplete();
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
          Your ISP Admin account requires authenticator MFA before login can finish.
        </p>

        <div className="dev-token-box">
          <strong>Manual authenticator secret</strong>
          <code>{setup.authenticator_secret}</code>
          <small>
            Open Google Authenticator, Microsoft Authenticator, or another TOTP app.
            Choose manual setup, enter this secret, then type the 6-digit code below.
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
              required
            />
          </label>

          {errorMessage && <div className="error-box">{errorMessage}</div>}

          <button disabled={isSubmitting}>
            {isSubmitting ? "Confirming..." : "Confirm MFA setup"}
          </button>
        </form>
      </section>
    </main>
  );
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [mfaSetup, setMfaSetup] = useState<MFASetupRequiredResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const session = await loginAsAdmin(identifier, password);

      if (isMFASetupRequiredResponse(session)) {
        setMfaSetup(session);
        return;
      }

      if (session.role !== "platform_admin" && session.role !== "isp_admin") {
        clearSession();
        setErrorMessage("This dashboard is only for admin accounts.");
        return;
      }

      saveSession(session);
      onLogin();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not connect to the backend."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (mfaSetup) {
    return <MFASetupPage setup={mfaSetup} onComplete={onLogin} />;
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">PulseFi Admin</p>
        <h1>Admin Login</h1>
        <p className="muted">
          Sign in to access the Platform Admin or ISP Admin dashboard.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
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

function AcceptInvitationPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [token, setToken] = useState(tokenFromUrl);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [preferredMfaMethod, setPreferredMfaMethod] =
    useState<MFAMethod>("authenticator");
  const [acceptedInvitation, setAcceptedInvitation] =
    useState<AcceptInvitationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAcceptInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setAcceptedInvitation(null);
    setIsSubmitting(true);

    try {
      const response = await acceptInvitation({
        token,
        username,
        password,
        preferred_mfa_method: preferredMfaMethod,
      });

      setAcceptedInvitation(response);
      setPassword("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not accept invitation."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function goToLogin() {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <main className="auth-page">
      <section className="auth-card wide-auth-card">
        <p className="eyebrow">PulseFi Invitation</p>
        <h1>Accept ISP Admin Invitation</h1>
        <p className="muted">
          Create your username and password to activate your ISP Admin account.
        </p>

        {acceptedInvitation ? (
          <div className="success-panel">
            <h2>Invitation accepted</h2>
            <p>{acceptedInvitation.message}</p>
            <p>
              Account email: <strong>{acceptedInvitation.email}</strong>
            </p>
            <button onClick={goToLogin}>Go to login</button>
          </div>
        ) : (
          <form onSubmit={handleAcceptInvitation} className="auth-form">
            <label>
              Invitation token
              <textarea
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Invitation token from email"
                required
              />
            </label>

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

            <button
              className="secondary-button"
              type="button"
              onClick={goToLogin}
            >
              Back to login
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function SummaryCards({ summary }: { summary: PlatformAdminSummary }) {
  return (
    <section className="summary-grid">
      <article className="summary-card">
        <span>Total ISPs</span>
        <strong>{summary.total_isps}</strong>
        <small>{summary.active_isps} active</small>
      </article>

      <article className="summary-card">
        <span>ISP Admins</span>
        <strong>{summary.total_isp_admins}</strong>
        <small>{summary.active_isp_admins} active</small>
      </article>

      <article className="summary-card">
        <span>App Users</span>
        <strong>{summary.total_app_users}</strong>
        <small>{summary.active_app_users} active</small>
      </article>
    </section>
  );
}

function ISPManagement({ onDataChanged }: { onDataChanged: () => Promise<void> }) {
  const [isps, setIsps] = useState<ISP[]>([]);
  const [selectedISP, setSelectedISP] = useState<ISP | null>(null);

  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  const [editName, setEditName] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStatus, setEditStatus] = useState<ISPStatus>("active");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteDays, setInviteDays] = useState(7);
  const [latestInvitation, setLatestInvitation] =
    useState<ISPAdminInvitation | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  async function loadISPs() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await listISPs();
      setIsps(data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load ISPs."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadISPs();
  }, []);

  function chooseISP(isp: ISP) {
    setSelectedISP(isp);
    setEditName(isp.name);
    setEditContactEmail(isp.contact_email ?? "");
    setEditPhoneNumber(isp.phone_number ?? "");
    setEditAddress(isp.address ?? "");
    setEditStatus(isp.status);
    setLatestInvitation(null);
    setErrorMessage("");
    setSuccessMessage(`Selected ISP: ${isp.name}`);
  }

  async function handleCreateISP(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreating(true);

    const payload: CreateISPRequest = {
      name,
      contact_email: contactEmail || null,
      phone_number: phoneNumber || null,
      address: address || null,
    };

    try {
      const created = await createISP(payload);
      setIsps((current) => [created, ...current]);
      setName("");
      setContactEmail("");
      setPhoneNumber("");
      setAddress("");
      chooseISP(created);
      setSuccessMessage(
        `Created ISP record: ${created.name}. You can now invite its ISP Admin.`
      );
      await onDataChanged();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not create ISP."));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateISP(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedISP) {
      setErrorMessage("Select an ISP first.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsUpdating(true);

    const payload: UpdateISPRequest = {
      name: editName,
      contact_email: editContactEmail || null,
      phone_number: editPhoneNumber || null,
      address: editAddress || null,
      status: editStatus,
    };

    try {
      const updated = await updateISP(selectedISP.id, payload);
      setIsps((current) =>
        current.map((isp) => (isp.id === updated.id ? updated : isp))
      );
      chooseISP(updated);
      setSuccessMessage(`Updated ISP: ${updated.name}`);
      await onDataChanged();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not update ISP."));
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleInviteISPAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedISP) {
      setErrorMessage("Select an ISP before sending an ISP Admin invitation.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setLatestInvitation(null);
    setIsInviting(true);

    try {
      const invitation = await createISPAdminInvitation(selectedISP.id, {
        email: inviteEmail,
        full_name: inviteFullName || null,
        expires_in_days: inviteDays,
      });

      setLatestInvitation(invitation);
      setInviteEmail("");
      setInviteFullName("");
      setInviteDays(7);
      setSuccessMessage(`Invitation created for ${invitation.email}.`);
      await onDataChanged();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not create ISP Admin invitation.")
      );
    } finally {
      setIsInviting(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Platform Management</p>
          <h2>ISPs and ISP Admin Invitations</h2>
          <p className="muted">
            Create the ISP record first, then invite the ISP Admin by email.
          </p>
        </div>
        <button className="secondary-button" onClick={loadISPs}>
          Refresh
        </button>
      </div>

      <div className="selected-strip">
        <strong>Selected ISP:</strong>{" "}
        {selectedISP ? selectedISP.name : "None selected yet"}
      </div>

      <div className="management-grid">
        <form className="create-form" onSubmit={handleCreateISP}>
          <h3>Create ISP record</h3>
          <p className="muted">
            This creates the company/ISP container. The admin login is created by invitation.
          </p>

          <label>
            ISP name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example ISP"
              required
            />
          </label>

          <label>
            Contact email
            <input
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="contact@example.com"
              type="email"
            />
          </label>

          <label>
            Phone number
            <input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="+961..."
            />
          </label>

          <label>
            Address
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Lebanon"
            />
          </label>

          <button disabled={isCreating}>
            {isCreating ? "Creating..." : "Create ISP record"}
          </button>
        </form>

        <form className="create-form" onSubmit={handleInviteISPAdmin}>
          <h3>Invite ISP Admin</h3>
          <p className="muted">
            The invited admin accepts the link and creates their login information.
          </p>

          {!selectedISP && (
            <p className="warning-text">Select an ISP from the table first.</p>
          )}

          <label>
            ISP Admin email
            <input
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="admin@example.com"
              type="email"
              required
              disabled={!selectedISP}
            />
          </label>

          <label>
            Full name
            <input
              value={inviteFullName}
              onChange={(event) => setInviteFullName(event.target.value)}
              placeholder="Admin full name"
              disabled={!selectedISP}
            />
          </label>

          <label>
            Expires in days
            <input
              value={inviteDays}
              onChange={(event) => setInviteDays(Number(event.target.value))}
              type="number"
              min={1}
              max={30}
              disabled={!selectedISP}
            />
          </label>

          <button disabled={!selectedISP || isInviting}>
            {isInviting ? "Creating invitation..." : "Create ISP Admin invitation"}
          </button>

          {latestInvitation?.dev_invitation_token && (
            <div className="dev-token-box">
              <strong>Local DEBUG invitation token:</strong>
              <code>{latestInvitation.dev_invitation_token}</code>
              <small>
                In production, this should be sent by email. Locally, use this token
                with the invitation accept screen/API.
              </small>
            </div>
          )}
        </form>

        <form className="create-form" onSubmit={handleUpdateISP}>
          <h3>Edit selected ISP</h3>

          {!selectedISP && (
            <p className="muted">Select an ISP from the table to edit it.</p>
          )}

          {selectedISP && (
            <>
              <label>
                ISP name
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  required
                />
              </label>

              <label>
                Contact email
                <input
                  value={editContactEmail}
                  onChange={(event) => setEditContactEmail(event.target.value)}
                  type="email"
                />
              </label>

              <label>
                Phone number
                <input
                  value={editPhoneNumber}
                  onChange={(event) => setEditPhoneNumber(event.target.value)}
                />
              </label>

              <label>
                Address
                <input
                  value={editAddress}
                  onChange={(event) => setEditAddress(event.target.value)}
                />
              </label>

              <label>
                Status
                <select
                  value={editStatus}
                  onChange={(event) => setEditStatus(event.target.value as ISPStatus)}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="suspended">suspended</option>
                </select>
              </label>

              <button disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update ISP"}
              </button>
            </>
          )}
        </form>
      </div>

      {errorMessage && <div className="error-box">{errorMessage}</div>}
      {successMessage && <div className="success-box">{successMessage}</div>}

      {isLoading && <p>Loading ISPs...</p>}

      {!isLoading && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isps.map((isp) => (
                <tr
                  key={isp.id}
                  className={
                    selectedISP?.id === isp.id ? "selected-row" : "clickable-row"
                  }
                  onClick={() => chooseISP(isp)}
                >
                  <td>{isp.name}</td>
                  <td>{isp.contact_email ?? "—"}</td>
                  <td>
                    <span className={`status-pill status-${isp.status}`}>
                      {isp.status}
                    </span>
                  </td>
                  <td>{new Date(isp.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="small-button"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        chooseISP(isp);
                      }}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}

              {isps.length === 0 && (
                <tr>
                  <td colSpan={5}>No ISPs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ISPAdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [summary, setSummary] = useState<ISPAdminSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const adminName = localStorage.getItem("pulsefi_admin_name") ?? "ISP Admin";

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await getISPAdminSummary();
        setSummary(data);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, "Could not load ISP Admin summary."));
      }
    }

    loadSummary();
  }, []);

  function handleLogout() {
    clearSession();
    onLogout();
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">PulseFi ISP Admin</p>
          <h1>Welcome, {adminName}</h1>
          <p className="muted">ISP Admin dashboard foundation.</p>
        </div>

        <button className="secondary-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {errorMessage && <div className="error-box">{errorMessage}</div>}

      {!summary && !errorMessage && <p>Loading ISP summary...</p>}

      {summary && (
        <>
          <div className="selected-strip">
            <strong>ISP ID:</strong> {summary.isp_id}
          </div>

          <section className="summary-grid">
            <article className="summary-card">
              <span>Users</span>
              <strong>{summary.users.total}</strong>
              <small>{summary.users.active} active</small>
            </article>

            <article className="summary-card">
              <span>Plans</span>
              <strong>{summary.plans.total}</strong>
              <small>{summary.plans.active} active</small>
            </article>

            <article className="summary-card">
              <span>Subscriptions</span>
              <strong>{summary.subscriptions.total}</strong>
              <small>{summary.subscriptions.active} active</small>
            </article>

            <article className="summary-card">
              <span>Routers</span>
              <strong>{summary.routers.total}</strong>
              <small>{summary.routers.active} active</small>
            </article>
          </section>
        </>
      )}
    </main>
  );
}

function PlatformAdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [summary, setSummary] = useState<PlatformAdminSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const adminName = localStorage.getItem("pulsefi_admin_name") ?? "Admin";

  async function loadSummary() {
    try {
      const data = await getPlatformAdminSummary();
      setSummary(data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load summary."));
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  function handleLogout() {
    clearSession();
    onLogout();
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">PulseFi Platform</p>
          <h1>Welcome, {adminName}</h1>
          <p className="muted">Platform Admin dashboard foundation.</p>
        </div>

        <button className="secondary-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {errorMessage && <div className="error-box">{errorMessage}</div>}

      {!summary && !errorMessage && <p>Loading summary...</p>}

      {summary && <SummaryCards summary={summary} />}

      <ISPManagement onDataChanged={loadSummary} />
    </main>
  );
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("pulsefi_access_token"))
  );

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (currentPath === "/accept-invitation") {
    return <AcceptInvitationPage />;
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  const role = localStorage.getItem("pulsefi_admin_role");

  if (role === "isp_admin") {
    return <ISPAdminDashboard onLogout={() => setIsLoggedIn(false)} />;
  }

  return <PlatformAdminDashboard onLogout={() => setIsLoggedIn(false)} />;
}
