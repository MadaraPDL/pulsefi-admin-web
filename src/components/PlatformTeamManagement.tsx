import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getErrorMessage } from "../api/errors";
import {
  createPlatformAdminInvitation,
  listPlatformAdminInvitations,
  listPlatformAdmins,
  revokePlatformAdminInvitation,
} from "../api/platformAdmin";
import type {
  PlatformAdminAccount,
  PlatformAdminInvitation,
  PlatformAdminInvitationFilter,
  PlatformAdminInvitationStatus,
} from "../api/platformAdmin";

const invitationFilters: { label: string; value: PlatformAdminInvitationFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Revoked", value: "revoked" },
  { label: "Expired", value: "expired" },
];

function getApiStatusFilter(
  filter: PlatformAdminInvitationFilter
): PlatformAdminInvitationStatus | null {
  return filter === "all" ? null : filter;
}

function getInvitationStatus(
  invitation: PlatformAdminInvitation
): PlatformAdminInvitationStatus {
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

function buildAcceptInvitationLink(token: string) {
  return `${window.location.origin}/accept-invitation?token=${encodeURIComponent(
    token
  )}&account_type=admin`;
}

export function PlatformTeamManagement() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);

  const [statusFilter, setStatusFilter] =
    useState<PlatformAdminInvitationFilter>("pending");
  const [invitations, setInvitations] = useState<PlatformAdminInvitation[]>([]);
  const [platformAdmins, setPlatformAdmins] = useState<PlatformAdminAccount[]>(
    []
  );
  const [latestInvitation, setLatestInvitation] =
    useState<PlatformAdminInvitation | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [revokingInvitationId, setRevokingInvitationId] = useState<string | null>(
    null
  );

  async function loadInvitations() {
    setIsLoadingInvitations(true);
    setErrorMessage("");

    try {
      const data = await listPlatformAdminInvitations(
        getApiStatusFilter(statusFilter)
      );
      setInvitations(data);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load Platform Admin invitations.")
      );
    } finally {
      setIsLoadingInvitations(false);
    }
  }

  async function loadPlatformAdmins() {
    setIsLoadingAdmins(true);
    setErrorMessage("");

    try {
      const data = await listPlatformAdmins();
      setPlatformAdmins(data);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load Platform Admin accounts.")
      );
    } finally {
      setIsLoadingAdmins(false);
    }
  }

  async function refreshAll() {
    await Promise.all([loadInvitations(), loadPlatformAdmins()]);
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialData() {
      setIsLoadingInvitations(true);
      setIsLoadingAdmins(true);
      setErrorMessage("");

      try {
        const [invitationData, adminData] = await Promise.all([
          listPlatformAdminInvitations(getApiStatusFilter(statusFilter)),
          listPlatformAdmins(),
        ]);

        if (!isCancelled) {
          setInvitations(invitationData);
          setPlatformAdmins(adminData);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            getErrorMessage(error, "Could not load Platform Team data.")
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingInvitations(false);
          setIsLoadingAdmins(false);
        }
      }
    }

    loadInitialData();

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

    try {
      const invitation = await createPlatformAdminInvitation({
        email,
        full_name: fullName || null,
        expires_in_days: expiresInDays,
      });

      setEmail("");
      setFullName("");
      setExpiresInDays(7);
      setLatestInvitation(invitation);
      setSuccessMessage(`Platform Admin invitation created for ${invitation.email}.`);
      await refreshAll();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not create Platform Admin invitation.")
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevokeInvitation(invitation: PlatformAdminInvitation) {
    if (getInvitationStatus(invitation) !== "pending") {
      setErrorMessage("Only pending Platform Admin invitations can be revoked.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setRevokingInvitationId(invitation.id);

    try {
      const response = await revokePlatformAdminInvitation(invitation.id);
      setSuccessMessage(response.message);
      await loadInvitations();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not revoke Platform Admin invitation.")
      );
    } finally {
      setRevokingInvitationId(null);
    }
  }

  const latestToken = latestInvitation?.dev_invitation_token;
  const latestAcceptLink = latestToken ? buildAcceptInvitationLink(latestToken) : "";

  return (
    <section className="pf-content-card pf-platform-team-panel">
      <div className="pf-panel-title-row">
        <div>
          <h2>Platform Team</h2>
          <p>
            Invite additional Platform Admins and review platform-level admin
            accounts.
          </p>
        </div>

        <button
          className="pf-view-link pf-refresh-button"
          type="button"
          onClick={() => void refreshAll()}
          disabled={isLoadingInvitations || isLoadingAdmins}
        >
          Refresh
        </button>
      </div>

      <div className="pf-selected-strip">
        <strong>Security model:</strong> first Platform Admin is deployment
        bootstrap; additional Platform Admins are invited by an existing
        Platform Admin.
      </div>

      {errorMessage && <div className="pf-error-box">{errorMessage}</div>}
      {successMessage && <div className="pf-success-box">{successMessage}</div>}

      {latestAcceptLink && (
        <div className="pf-success-box">
          <strong>Demo invitation link:</strong>
          <input value={latestAcceptLink} readOnly />
          <small>
            This appears only when the backend returns dev_invitation_token in
            DEBUG mode.
          </small>
        </div>
      )}

      <div className="pf-management-grid pf-platform-isp-form-grid">
        <form className="pf-management-form" onSubmit={handleCreateInvitation}>
          <h3>Invite Platform Admin</h3>
          <p>The invited admin accepts the link and creates their login.</p>

          <label>
            Platform Admin email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="platform.admin@example.com"
              type="email"
              required
            />
          </label>

          <label>
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Admin full name"
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
            />
          </label>

          <button className="pf-action-button" disabled={isCreating}>
            {isCreating ? "Creating invitation..." : "Create invitation"}
          </button>
        </form>

        <div className="pf-management-form">
          <h3>Platform Admin Accounts</h3>
          <p>Backend-backed list of platform-level admin accounts.</p>

          {isLoadingAdmins && (
            <p className="pf-loading-text">Loading Platform Admins...</p>
          )}

          {!isLoadingAdmins && (
            <div className="pf-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>MFA</th>
                  </tr>
                </thead>

                <tbody>
                  {platformAdmins.map((admin) => (
                    <tr key={admin.id}>
                      <td>{admin.full_name}</td>
                      <td>{admin.email}</td>
                      <td>
                        <span className={`status-pill status-${admin.status}`}>
                          {admin.status}
                        </span>
                      </td>
                      <td>{admin.mfa_enabled ? "Enabled" : "Required setup"}</td>
                    </tr>
                  ))}

                  {platformAdmins.length === 0 && (
                    <tr>
                      <td colSpan={4}>No Platform Admin accounts returned.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="pf-panel-title-row">
        <div>
          <h3>Platform Admin Invitations</h3>
          <p>Filter and revoke pending Platform Admin invitations.</p>
        </div>
      </div>

      <div className="filter-bar pf-platform-invitation-filters">
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

      {isLoadingInvitations && (
        <p className="pf-loading-text">Loading Platform Admin invitations...</p>
      )}

      {!isLoadingInvitations && (
        <div className="pf-table-wrap">
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
                          onClick={() => void handleRevokeInvitation(invitation)}
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
                  <td colSpan={6}>
                    No Platform Admin invitations match this filter.
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
