import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getErrorMessage } from "../api/errors";
import {
  createISP,
  createISPAdminInvitation,
  getPlatformAdminSummary,
  listISPs,
  updateISP,
} from "../api/platformAdmin";
import type {
  CreateISPRequest,
  ISP,
  ISPAdminInvitation,
  ISPStatus,
  PlatformAdminSummary,
  UpdateISPRequest,
} from "../api/platformAdmin";
import { clearSession, getAdminName } from "../auth/session";

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
    let isCancelled = false;

    async function loadInitialISPs() {
      try {
        const data = await listISPs();

        if (!isCancelled) {
          setIsps(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error, "Could not load ISPs."));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadInitialISPs();

    return () => {
      isCancelled = true;
    };
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
            This creates the company/ISP container. Admin login is created by
            invitation.
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
            The invited admin accepts the link and creates their login
            information.
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
                In production, this is sent by email. Locally, use this token
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
                  onChange={(event) =>
                    setEditStatus(event.target.value as ISPStatus)
                  }
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
                  <td>{isp.contact_email ?? "-"}</td>
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

export default function PlatformAdminDashboard({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [summary, setSummary] = useState<PlatformAdminSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const adminName = getAdminName("Admin");

  async function loadSummary() {
    try {
      const data = await getPlatformAdminSummary();
      setSummary(data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load summary."));
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialSummary() {
      try {
        const data = await getPlatformAdminSummary();

        if (!isCancelled) {
          setSummary(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error, "Could not load summary."));
        }
      }
    }

    loadInitialSummary();

    return () => {
      isCancelled = true;
    };
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
