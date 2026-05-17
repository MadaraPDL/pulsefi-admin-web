import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getErrorMessage } from "../api/errors";
import {
  createAppUserInvitation,
  listAppUserInvitations,
  revokeAppUserInvitation,
} from "../api/ispAdmin";
import type {
  AppUserInvitation,
  AppUserInvitationFilter,
  AppUserInvitationStatus,
  CreateAppUserInvitationRequest,
} from "../api/ispAdmin";

const invitationFilters: { label: string; value: AppUserInvitationFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Revoked", value: "revoked" },
  { label: "Expired", value: "expired" },
];

function getApiStatusFilter(
  filter: AppUserInvitationFilter
): AppUserInvitationStatus | null {
  return filter === "all" ? null : filter;
}

function getInvitationStatus(
  invitation: AppUserInvitation
): AppUserInvitationStatus {
  if (invitation.accepted_at) {
    return "accepted";
  }

  if (invitation.revoked_at) {
    return "revoked";
  }

  const expiresAt = new Date(invitation.expires_at).getTime();

  if (!Number.isNaN(expiresAt) && expiresAt <= Date.now()) {
    return "expired";
  }

  return "pending";
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function AppUserInvitationManagement() {
  const [statusFilter, setStatusFilter] =
    useState<AppUserInvitationFilter>("pending");
  const [invitations, setInvitations] = useState<AppUserInvitation[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [latestInvitation, setLatestInvitation] =
    useState<AppUserInvitation | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingInvitationId, setRevokingInvitationId] = useState<string | null>(
    null
  );

  async function loadInvitations() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await listAppUserInvitations(
        getApiStatusFilter(statusFilter)
      );
      setInvitations(data);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load App User invitations.")
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadFilteredInvitations() {
      try {
        const data = await listAppUserInvitations(
          getApiStatusFilter(statusFilter)
        );

        if (!isCancelled) {
          setInvitations(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            getErrorMessage(error, "Could not load App User invitations.")
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadFilteredInvitations();

    return () => {
      isCancelled = true;
    };
  }, [statusFilter]);

  async function handleCreateInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLatestInvitation(null);
    setIsCreating(true);

    const payload: CreateAppUserInvitationRequest = {
      email: email.trim(),
      full_name: fullName.trim() || null,
      expires_in_days: expiresInDays,
    };

    try {
      const invitation = await createAppUserInvitation(payload);
      setLatestInvitation(invitation);
      setEmail("");
      setFullName("");
      setExpiresInDays(7);
      setSuccessMessage(`Invitation created for ${invitation.email}.`);
      await loadInvitations();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not create App User invitation.")
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevokeInvitation(invitation: AppUserInvitation) {
    if (getInvitationStatus(invitation) !== "pending") {
      setErrorMessage("Only pending App User invitations can be revoked.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setRevokingInvitationId(invitation.id);

    try {
      const response = await revokeAppUserInvitation(invitation.id);
      setSuccessMessage(response.message);
      await loadInvitations();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not revoke App User invitation.")
      );
    } finally {
      setRevokingInvitationId(null);
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">App User Access</p>
          <h2>App User Invitations</h2>
          <p className="muted">
            Invite customers to create App User accounts scoped to your ISP.
          </p>
        </div>
        <button className="secondary-button" onClick={loadInvitations}>
          Refresh
        </button>
      </div>

      <div className="management-grid app-user-invitation-grid">
        <form className="create-form" onSubmit={handleCreateInvitation}>
          <h3>Create App User invitation</h3>
          <p className="muted">
            The user receives an invitation and creates their own login.
          </p>

          <label>
            App User email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="customer@example.com"
              type="email"
              required
            />
          </label>

          <label>
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Customer full name"
            />
          </label>

          <label>
            Expires in days
            <input
              value={expiresInDays}
              onChange={(event) => setExpiresInDays(Number(event.target.value))}
              type="number"
              min={1}
              max={30}
              required
            />
          </label>

          <button disabled={isCreating}>
            {isCreating ? "Creating invitation..." : "Create App User invitation"}
          </button>

          {latestInvitation?.dev_invitation_token && (
            <div className="dev-token-box">
              <strong>Local DEBUG invitation token:</strong>
              <code>{latestInvitation.dev_invitation_token}</code>
              <small>
                Use this token on the invitation accept screen only in local
                development.
              </small>
            </div>
          )}
        </form>

        <div className="create-form">
          <h3>Invitation status</h3>
          <p className="muted">
            Filter the list by the backend-supported invitation states.
          </p>

          <div className="filter-bar" aria-label="Invitation status filter">
            {invitationFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`filter-chip ${
                  statusFilter === filter.value ? "active-filter" : ""
                }`}
                aria-pressed={statusFilter === filter.value}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMessage && <div className="error-box">{errorMessage}</div>}
      {successMessage && <div className="success-box">{successMessage}</div>}

      {isLoading && <p>Loading App User invitations...</p>}

      {!isLoading && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => {
                const status = getInvitationStatus(invitation);
                const canRevoke = status === "pending";

                return (
                  <tr key={invitation.id}>
                    <td>{invitation.email}</td>
                    <td>{invitation.full_name ?? "-"}</td>
                    <td>
                      <span className={`status-pill status-${status}`}>
                        {status}
                      </span>
                    </td>
                    <td>{formatDate(invitation.expires_at)}</td>
                    <td>{formatDate(invitation.created_at)}</td>
                    <td>
                      {canRevoke ? (
                        <button
                          className="small-button danger-button"
                          type="button"
                          disabled={revokingInvitationId === invitation.id}
                          onClick={() => handleRevokeInvitation(invitation)}
                        >
                          {revokingInvitationId === invitation.id
                            ? "Revoking..."
                            : "Revoke"}
                        </button>
                      ) : (
                        <span className="muted">No action</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {invitations.length === 0 && (
                <tr>
                  <td colSpan={6}>No App User invitations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
