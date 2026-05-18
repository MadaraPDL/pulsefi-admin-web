import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getErrorMessage } from "../api/errors";
import {
  getISPAdminAppUser,
  listISPAdminAppUsers,
  updateISPAdminAppUser,
} from "../api/ispAdmin";
import type {
  AppUser,
  AppUserFilter,
  AppUserStatus,
  UpdateAppUserRequest,
} from "../api/ispAdmin";

const appUserFilters: { label: string; value: AppUserFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

function getApiStatusFilter(filter: AppUserFilter): AppUserStatus | null {
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

export function AppUserManagement() {
  const [statusFilter, setStatusFilter] = useState<AppUserFilter>("all");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userStatus, setUserStatus] = useState<AppUserStatus>("active");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectingUserId, setSelectingUserId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  function setEditableFields(user: AppUser) {
    setFullName(user.full_name);
    setPhoneNumber(user.phone_number ?? "");
    setUserStatus(user.status);
  }

  async function loadUsers() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await listISPAdminAppUsers(
        getApiStatusFilter(statusFilter)
      );
      setUsers(data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load App Users."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadFilteredUsers() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listISPAdminAppUsers(
          getApiStatusFilter(statusFilter)
        );

        if (!isCancelled) {
          setUsers(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error, "Could not load App Users."));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadFilteredUsers();

    return () => {
      isCancelled = true;
    };
  }, [statusFilter]);

  async function chooseUser(user: AppUser) {
    setSelectingUserId(user.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const userDetails = await getISPAdminAppUser(user.id);
      setSelectedUser(userDetails);
      setEditableFields(userDetails);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load App User."));
    } finally {
      setSelectingUserId(null);
    }
  }

  async function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUser) {
      setErrorMessage("Select an App User first.");
      return;
    }

    const trimmedFullName = fullName.trim();

    if (trimmedFullName.length < 2) {
      setErrorMessage("Full name must be at least 2 characters.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsUpdating(true);

    const payload: UpdateAppUserRequest = {
      full_name: trimmedFullName,
      phone_number: phoneNumber.trim() || null,
      status: userStatus,
    };

    try {
      const updatedUser = await updateISPAdminAppUser(selectedUser.id, payload);
      const apiStatusFilter = getApiStatusFilter(statusFilter);

      setSelectedUser(updatedUser);
      setEditableFields(updatedUser);
      setUsers((current) =>
        current
          .map((user) => (user.id === updatedUser.id ? updatedUser : user))
          .filter(
            (user) => apiStatusFilter === null || user.status === apiStatusFilter
          )
      );
      setSuccessMessage(`Updated App User: ${updatedUser.full_name}.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not update App User."));
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">App User Accounts</p>
          <h2>App User Management</h2>
          <p className="muted">
            View ISP-scoped App Users and update support-managed account fields.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={loadUsers}>
          Refresh
        </button>
      </div>

      <div className="management-grid app-user-management-grid">
        <div className="create-form">
          <h3>User status</h3>
          <p className="muted">Filter by backend-supported App User status.</p>

          <div className="filter-bar" aria-label="App User status filter">
            {appUserFilters.map((filter) => (
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

        <form className="create-form" onSubmit={handleUpdateUser}>
          <h3>Selected App User</h3>

          {!selectedUser && (
            <p className="muted">Select an App User from the table to view it.</p>
          )}

          {selectedUser && (
            <>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Email</span>
                  <strong>{selectedUser.email}</strong>
                </div>
                <div className="detail-item">
                  <span>Username</span>
                  <strong>{selectedUser.username ?? "-"}</strong>
                </div>
                <div className="detail-item">
                  <span>Created</span>
                  <strong>{formatDate(selectedUser.created_at)}</strong>
                </div>
                <div className="detail-item">
                  <span>MFA</span>
                  <strong>{selectedUser.mfa_enabled ? "enabled" : "disabled"}</strong>
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
                  value={userStatus}
                  onChange={(event) =>
                    setUserStatus(event.target.value as AppUserStatus)
                  }
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="suspended">suspended</option>
                </select>
              </label>

              <button disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update App User"}
              </button>
            </>
          )}
        </form>
      </div>

      {errorMessage && <div className="error-box">{errorMessage}</div>}
      {successMessage && <div className="success-box">{successMessage}</div>}

      {isLoading && <p>Loading App Users...</p>}

      {!isLoading && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Full name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={
                    selectedUser?.id === user.id
                      ? "selected-row"
                      : "clickable-row"
                  }
                  onClick={() => chooseUser(user)}
                >
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.username ?? "-"}</td>
                  <td>{user.phone_number ?? "-"}</td>
                  <td>
                    <span className={`status-pill status-${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <button
                      className="small-button"
                      type="button"
                      disabled={selectingUserId === user.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        chooseUser(user);
                      }}
                    >
                      {selectingUserId === user.id ? "Loading..." : "View"}
                    </button>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    No App Users match this filter. Create an App User
                    invitation first, then accepted accounts appear here.
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
