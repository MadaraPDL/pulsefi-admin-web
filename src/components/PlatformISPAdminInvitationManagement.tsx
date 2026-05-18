import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/errors";
import {
  listISPAdminInvitations,
  revokeISPAdminInvitation,
} from "../api/platformAdmin";
import type {
  ISP,
  ISPAdminInvitation,
  ISPAdminInvitationFilter,
  ISPAdminInvitationStatus,
} from "../api/platformAdmin";

const invitationFilters: { label: string; value: ISPAdminInvitationFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Revoked", value: "revoked" },
  { label: "Expired", value: "expired" },
];

function getApiStatusFilter(
  filter: ISPAdminInvitationFilter
): ISPAdminInvitationStatus | null {
  return filter === "all" ? null : filter;
}

function getInvitationStatus(
  invitation: ISPAdminInvitation
): ISPAdminInvitationStatus {
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

export function PlatformISPAdminInvitationManagement({
  selectedISP,
}: {
  selectedISP: ISP | null;
}) {
  const [statusFilter, setStatusFilter] =
    useState<ISPAdminInvitationFilter>("pending");
  const [invitations, setInvitations] = useState<ISPAdminInvitation[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [revokingInvitationId, setRevokingInvitationId] = useState<string | null>(
    null
  );

  async function loadInvitations() {
    if (!selectedISP) {
      setInvitations([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await listISPAdminInvitations(
        selectedISP.id,
        getApiStatusFilter(statusFilter)
      );
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
      if (!selectedISP) {
        setInvitations([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listISPAdminInvitations(
          selectedISP.id,
          getApiStatusFilter(statusFilter)
        );

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
  }, [selectedISP, statusFilter]);

  async function handleRevokeInvitation(invitation: ISPAdminInvitation) {
    if (!selectedISP) {
      setErrorMessage("Select an ISP first.");
      return;
    }

    if (getInvitationStatus(invitation) !== "pending") {
      setErrorMessage("Only pending ISP Admin invitations can be revoked.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setRevokingInvitationId(invitation.id);

    try {
      const response = await revokeISPAdminInvitation(
        selectedISP.id,
        invitation.id
      );
      setSuccessMessage(response.message);
      await loadInvitations();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not revoke ISP Admin invitation.")
      );
    } finally {
      setRevokingInvitationId(null);
    }
  }

  return (
    <section className="stitch-platform-invitation-panel">
      <div className="stitch-panel-title-row">
        <div>
          <h2>ISP Admin Invitations</h2>
          <p>
            List and revoke pending ISP Admin invitations for the selected ISP.
          </p>
        </div>

        <button
          className="stitch-view-link"
          type="button"
          onClick={loadInvitations}
          disabled={!selectedISP || isLoading}
        >
          Refresh
        </button>
      </div>

      {!selectedISP && (
        <div className="stitch-selected-strip">
          Select an ISP from the table before reviewing ISP Admin invitations.
        </div>
      )}

      {selectedISP && (
        <>
          <div className="stitch-selected-strip">
            <strong>Invitation scope:</strong> {selectedISP.name}
          </div>

          <div className="filter-bar stitch-platform-invitation-filters">
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

          {errorMessage && <div className="stitch-error-box">{errorMessage}</div>}

          {successMessage && (
            <div className="stitch-success-box">{successMessage}</div>
          )}

          {isLoading && (
            <p className="stitch-loading-text">
              Loading ISP Admin invitations...
            </p>
          )}

          {!isLoading && (
            <div className="stitch-table-wrap">
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
                      <td colSpan={6}>No ISP Admin invitations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
