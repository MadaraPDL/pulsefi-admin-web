import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getErrorMessage } from "../api/errors";
import {
  createISPAdminInvitationForCurrentISP,
  listISPAdminInvitationsForCurrentISP,
  revokeISPAdminInvitationForCurrentISP,
} from "../api/ispAdmin";
import type {
  ISPAdminInvitation,
  ISPAdminInvitationStatus,
} from "../api/ispAdmin";

const invitationFilters: {
  label: string;
  value: ISPAdminInvitationStatus | "all";
}[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Revoked", value: "revoked" },
  { label: "Expired", value: "expired" },
];

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function getInvitationStatus(
  invitation: ISPAdminInvitation
): ISPAdminInvitationStatus {
  const now = new Date();

  if (invitation.accepted_at) {
    return "accepted";
  }

  if (invitation.revoked_at) {
    return "revoked";
  }

  if (new Date(invitation.expires_at) <= now) {
    return "expired";
  }

  return "pending";
}

export function ISPAdminInvitationManagement() {
  const [statusFilter, setStatusFilter] = useState<
    ISPAdminInvitationStatus | "all"
  >("pending");
  const [invitations, setInvitations] = useState<ISPAdminInvitation[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [devToken, setDevToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const apiStatusFilter = useMemo(() => {
    return statusFilter === "all" ? null : statusFilter;
  }, [statusFilter]);

  async function loadInvitations() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await listISPAdminInvitationsForCurrentISP(apiStatusFilter);
      setInvitations(data);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load ISP Admin invitations.")
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadFilteredInvitations() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listISPAdminInvitationsForCurrentISP(apiStatusFilter);

        if (!isCancelled) {
          setInvitations(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            getErrorMessage(error, "Could not load ISP Admin invitations.")
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
  }, [apiStatusFilter]);

  async function handleCreateInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedExpiresInDays = Number(expiresInDays);

    if (
      !Number.isInteger(parsedExpiresInDays) ||
      parsedExpiresInDays < 1 ||
      parsedExpiresInDays > 30
    ) {
      setErrorMessage("Expiration must be between 1 and 30 days.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setDevToken(null);
    setIsCreating(true);

    try {
      const createdInvitation = await createISPAdminInvitationForCurrentISP({
        email: email.trim(),
        full_name: fullName.trim() || null,
        expires_in_days: parsedExpiresInDays,
      });

      if (apiStatusFilter === null || apiStatusFilter === "pending") {
        setInvitations((current) => [createdInvitation, ...current]);
      }

      setEmail("");
      setFullName("");
      setExpiresInDays("7");
      setDevToken(createdInvitation.dev_invitation_token);
      setSuccessMessage("ISP Admin invitation created successfully.");
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not create ISP Admin invitation.")
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevokeInvitation(invitation: ISPAdminInvitation) {
    if (getInvitationStatus(invitation) !== "pending") {
      setErrorMessage("Only pending ISP Admin invitations can be revoked.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setRevokingId(invitation.id);

    try {
      const response = await revokeISPAdminInvitationForCurrentISP(
        invitation.id
      );

      setInvitations((current) =>
        current
          .map((item) =>
            item.id === invitation.id ? response.invitation : item
          )
          .filter((item) => {
            return (
              apiStatusFilter === null ||
              getInvitationStatus(item) === apiStatusFilter
            );
          })
      );

      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not revoke ISP Admin invitation.")
      );
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <section className="panel isp-admin-invitation-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">ISP Admin Access</p>
          <h2>ISP Admin Invitations</h2>
          <p className="muted">
            Invite another ISP Admin under your same ISP and track invitation
            status.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button pf-refresh-button"
          onClick={loadInvitations}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      <div className="management-grid">
        <form className="create-form" onSubmit={handleCreateInvitation}>
          <h3>Create ISP Admin invitation</h3>

          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="admin@example.com"
              required
            />
          </label>

          <label>
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              minLength={2}
              maxLength={150}
              placeholder="Optional"
            />
          </label>

          <label>
            Expires in days
            <input
              value={expiresInDays}
              onChange={(event) => setExpiresInDays(event.target.value)}
              type="number"
              min="1"
              max="30"
              required
            />
          </label>

          <button
            className="pf-action-button"
            type="submit"
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Create invitation"}
          </button>
        </form>

        <div className="create-form">
          <h3>Invitation notes</h3>
          <p className="muted">
            This creates an admin invitation for the same ISP only. The invited
            admin cannot choose a different ISP.
          </p>

          {devToken && (
            <div className="dev-token-box">
              <strong>Local DEBUG invitation token:</strong>
              <code>{devToken}</code>
              <small>
                This appears only when the backend is running with DEBUG=True.
              </small>
            </div>
          )}
        </div>
      </div>

      <div className="filter-bar" aria-label="ISP Admin invitation filters">
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

      {errorMessage && <div className="error-box">{errorMessage}</div>}
      {successMessage && <div className="success-box">{successMessage}</div>}

      {isLoading && (
        <p className="pf-loading-text">Loading ISP Admin invitations...</p>
      )}

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
                    <td>{formatDateTime(invitation.expires_at)}</td>
                    <td>{formatDateTime(invitation.created_at)}</td>
                    <td>
                      {canRevoke ? (
                        <button
                          type="button"
                          className="small-button danger-button"
                          disabled={revokingId === invitation.id}
                          onClick={() => handleRevokeInvitation(invitation)}
                        >
                          {revokingId === invitation.id
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
                  <td colSpan={6}>
                    No ISP Admin invitations found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
