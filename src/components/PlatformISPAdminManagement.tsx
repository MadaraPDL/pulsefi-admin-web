import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getErrorMessage } from "../api/errors";
import {
  getISPAdmin,
  listISPAdmins,
  updateISPAdmin,
} from "../api/platformAdmin";
import type {
  ISP,
  ISPAdmin,
  ISPAdminFilter,
  ISPAdminStatus,
  UpdateISPAdminRequest,
} from "../api/platformAdmin";

const adminFilters: { label: string; value: ISPAdminFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

function getApiStatusFilter(filter: ISPAdminFilter): ISPAdminStatus | null {
  return filter === "all" ? null : filter;
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

export function PlatformISPAdminManagement({
  selectedISP,
}: {
  selectedISP: ISP | null;
}) {
  const [statusFilter, setStatusFilter] = useState<ISPAdminFilter>("all");
  const [admins, setAdmins] = useState<ISPAdmin[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<ISPAdmin | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [adminStatus, setAdminStatus] = useState<ISPAdminStatus>("active");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectingAdminId, setSelectingAdminId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  function setEditableFields(admin: ISPAdmin) {
    setFullName(admin.full_name);
    setPhoneNumber(admin.phone_number ?? "");
    setAdminStatus(admin.status);
  }

  async function loadAdmins() {
    if (!selectedISP) {
      setAdmins([]);
      setSelectedAdmin(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await listISPAdmins(
        selectedISP.id,
        getApiStatusFilter(statusFilter)
      );

      setAdmins(data);

      if (
        selectedAdmin &&
        !data.some((admin) => admin.id === selectedAdmin.id)
      ) {
        setSelectedAdmin(null);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load ISP Admins."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadFilteredAdmins() {
      if (!selectedISP) {
        setAdmins([]);
        setSelectedAdmin(null);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listISPAdmins(
          selectedISP.id,
          getApiStatusFilter(statusFilter)
        );

        if (!isCancelled) {
          setAdmins(data);
          setSelectedAdmin((current) =>
            current && data.some((admin) => admin.id === current.id)
              ? current
              : null
          );
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error, "Could not load ISP Admins."));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadFilteredAdmins();

    return () => {
      isCancelled = true;
    };
  }, [selectedISP, statusFilter]);

  async function chooseAdmin(admin: ISPAdmin) {
    if (!selectedISP) {
      return;
    }

    setSelectingAdminId(admin.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const adminDetails = await getISPAdmin(selectedISP.id, admin.id);
      setSelectedAdmin(adminDetails);
      setEditableFields(adminDetails);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load ISP Admin."));
    } finally {
      setSelectingAdminId(null);
    }
  }

  async function applyAdminUpdate(
    payload: UpdateISPAdminRequest,
    successText: (updatedAdmin: ISPAdmin) => string
  ) {
    if (!selectedISP || !selectedAdmin) {
      setErrorMessage("Select an ISP Admin first.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsUpdating(true);

    try {
      const updatedAdmin = await updateISPAdmin(
        selectedISP.id,
        selectedAdmin.id,
        payload
      );
      const apiStatusFilter = getApiStatusFilter(statusFilter);

      setSelectedAdmin(updatedAdmin);
      setEditableFields(updatedAdmin);
      setAdmins((current) =>
        current
          .map((admin) =>
            admin.id === updatedAdmin.id ? updatedAdmin : admin
          )
          .filter(
            (admin) => apiStatusFilter === null || admin.status === apiStatusFilter
          )
      );
      setSuccessMessage(successText(updatedAdmin));
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not update ISP Admin."));
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleUpdateAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedFullName = fullName.trim();

    if (trimmedFullName.length < 2) {
      setErrorMessage("Full name must be at least 2 characters.");
      return;
    }

    await applyAdminUpdate(
      {
        full_name: trimmedFullName,
        phone_number: phoneNumber.trim() || null,
        status: adminStatus,
      },
      (updatedAdmin) => `Updated ISP Admin: ${updatedAdmin.full_name}.`
    );
  }

  async function handleSetAdminStatus(status: ISPAdminStatus) {
    const trimmedFullName = fullName.trim();

    if (trimmedFullName.length < 2) {
      setErrorMessage("Full name must be at least 2 characters.");
      return;
    }

    await applyAdminUpdate(
      {
        full_name: trimmedFullName,
        phone_number: phoneNumber.trim() || null,
        status,
      },
      (updatedAdmin) =>
        `Set ${updatedAdmin.full_name} to ${updatedAdmin.status}.`
    );
  }

  return (
    <section className="pf-content-card">
      <div className="pf-panel-title-row">
        <div>
          <h2>ISP Admin Accounts</h2>
          <p>Review and update backend-backed ISP Admin accounts.</p>
        </div>

        <button
          className="pf-view-link pf-refresh-button"
          type="button"
          onClick={() => void loadAdmins()}
          disabled={!selectedISP || isLoading}
        >
          Refresh
        </button>
      </div>

      {!selectedISP && (
        <div className="pf-empty-state pf-platform-empty-state">
          <span className="material-symbols-outlined">
            admin_panel_settings
          </span>
          <h3>Select an ISP from ISP Management first</h3>
          <p>
            ISP Admin accounts are scoped to one ISP. Open ISP Management,
            select an ISP, then return here to review and update its admins.
          </p>
        </div>
      )}

      {selectedISP && (
        <div className="pf-selected-strip">
          <strong>Admin scope:</strong> {selectedISP.name}
        </div>
      )}

      {selectedISP && (
        <div className="pf-management-grid">
          <div className="pf-management-form">
            <h3>Admin status</h3>
            <p>Filter the selected ISP's admin accounts by backend status.</p>

            <div className="filter-bar" aria-label="ISP Admin status filter">
              {adminFilters.map((filter) => (
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

          <form className="pf-management-form" onSubmit={handleUpdateAdmin}>
            <h3>Selected ISP Admin</h3>

            {!selectedAdmin && (
              <p>Select an ISP Admin from the table to view it.</p>
            )}

            {selectedAdmin && (
              <>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span>Email</span>
                    <strong>{selectedAdmin.email}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Username</span>
                    <strong>{selectedAdmin.username ?? "-"}</strong>
                  </div>
                  <div className="detail-item">
                    <span>MFA</span>
                    <strong>
                      {selectedAdmin.mfa_enabled ? "enabled" : "disabled"}
                    </strong>
                  </div>
                  <div className="detail-item">
                    <span>Created</span>
                    <strong>{formatDate(selectedAdmin.created_at)}</strong>
                  </div>
                </div>

                <label>
                  Full name
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    minLength={2}
                    required
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
                  Status
                  <select
                    value={adminStatus}
                    onChange={(event) =>
                      setAdminStatus(event.target.value as ISPAdminStatus)
                    }
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="suspended">suspended</option>
                  </select>
                </label>

                <div className="pf-lifecycle-actions">
                  <button
                    className="pf-action-button"
                    disabled={isUpdating}
                    type="submit"
                  >
                    {isUpdating ? "Updating..." : "Update ISP Admin"}
                  </button>

                  <button
                    className="pf-secondary-button"
                    disabled={isUpdating || selectedAdmin.status === "active"}
                    type="button"
                    onClick={() => void handleSetAdminStatus("active")}
                  >
                    Reactivate Admin
                  </button>

                  <button
                    className="pf-secondary-button"
                    disabled={isUpdating || selectedAdmin.status === "inactive"}
                    type="button"
                    onClick={() => void handleSetAdminStatus("inactive")}
                  >
                    Set inactive
                  </button>

                  <button
                    className="pf-danger-outline-button"
                    disabled={isUpdating || selectedAdmin.status === "suspended"}
                    type="button"
                    onClick={() => void handleSetAdminStatus("suspended")}
                  >
                    Suspend Admin
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {errorMessage && <div className="pf-error-box">{errorMessage}</div>}
      {successMessage && <div className="pf-success-box">{successMessage}</div>}

      {isLoading && <p className="pf-loading-text">Loading ISP Admins...</p>}

      {selectedISP && !isLoading && (
        <div className="pf-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Status</th>
                <th>MFA</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {admins.map((admin) => (
                <tr
                  key={admin.id}
                  className={
                    selectedAdmin?.id === admin.id
                      ? "selected-row"
                      : "clickable-row"
                  }
                  onClick={() => void chooseAdmin(admin)}
                >
                  <td>{admin.full_name}</td>
                  <td>{admin.email}</td>
                  <td>{admin.username ?? "-"}</td>
                  <td>
                    <span className={`status-pill status-${admin.status}`}>
                      {admin.status}
                    </span>
                  </td>
                  <td>{admin.mfa_enabled ? "Enabled" : "Disabled"}</td>
                  <td>{formatDate(admin.created_at)}</td>
                  <td>
                    <button
                      className="small-button"
                      type="button"
                      disabled={selectingAdminId === admin.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        void chooseAdmin(admin);
                      }}
                    >
                      {selectingAdminId === admin.id ? "Loading..." : "View"}
                    </button>
                  </td>
                </tr>
              ))}

              {admins.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    No ISP Admin accounts match this filter. Accepted ISP Admin
                    invitations appear here.
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
