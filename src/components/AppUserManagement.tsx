import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { getErrorMessage } from "../api/errors";
import { AdminTablePagination } from "./AdminTablePagination";
import { paginateRows } from "./adminPaginationUtils";
import {
  getISPAdminAppUser,
  listISPAdminAppUsers,
  listRouters,
  listUserSubscriptions,
  updateISPAdminAppUser,
} from "../api/ispAdmin";
import type {
  AppUser,
  AppUserFilter,
  AppUserStatus,
  ISPAdminRouter,
  UpdateAppUserRequest,
  UsageConsumptionSummary,
  UserSubscription,
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


function formatNumber(value: string | number | null | undefined, suffix = "") {
  if (value === null || value === undefined) {
    return "-";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return `${value}${suffix}`;
  }

  return `${numericValue.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}${suffix}`;
}

function formatUsagePercent(user: AppUser) {
  const usage = user.usage_summary;

  if (!usage || usage.usage_percent === null || usage.usage_percent === undefined) {
    return "-";
  }

  return `${formatNumber(usage.usage_percent, "%")}`;
}



function getUserUsageSummaries(user: AppUser): UsageConsumptionSummary[] {
  if (user.usage_summaries?.length) {
    return user.usage_summaries;
  }

  if (user.usage_summary) {
    return [user.usage_summary];
  }

  return [];
}

function getUsagePercentValue(summary: UsageConsumptionSummary) {
  if (summary.is_unlimited || summary.usage_percent === null) {
    return 0;
  }

  const percent = Number(summary.usage_percent);

  if (Number.isNaN(percent)) {
    return 0;
  }

  return Math.min(Math.max(percent, 0), 100);
}

function getUsageDonutStyle(summary: UsageConsumptionSummary): CSSProperties {
  return {
    "--usage-progress": `${getUsagePercentValue(summary)}%`,
  } as CSSProperties;
}

function formatSubscriptionTitle(summary: UsageConsumptionSummary, index: number) {
  return summary.subscription_label || summary.plan_name || `Subscription ${index + 1}`;
}

function formatLimitText(summary: UsageConsumptionSummary) {
  if (summary.is_unlimited) {
    return "Unlimited plan";
  }

  return `${formatNumber(summary.current_cycle_usage_gb, " GB")} / ${formatNumber(
    summary.plan_limit_gb,
    " GB"
  )}`;
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
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [routers, setRouters] = useState<ISPAdminRouter[]>([]);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userStatus, setUserStatus] = useState<AppUserStatus>("active");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectingUserId, setSelectingUserId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [usersPage, setUsersPage] = useState(1);

  const serviceLineCountByUserId = useMemo(() => {
    const counts = new Map<string, number>();

    for (const subscription of subscriptions) {
      counts.set(subscription.user_id, (counts.get(subscription.user_id) ?? 0) + 1);
    }

    return counts;
  }, [subscriptions]);

  const routerCountByUserId = useMemo(() => {
    const serviceLineUserIdById = new Map(
      subscriptions.map((subscription) => [subscription.id, subscription.user_id])
    );
    const counts = new Map<string, number>();

    for (const router of routers) {
      if (!router.user_subscription_id) {
        continue;
      }

      const userId = serviceLineUserIdById.get(router.user_subscription_id);

      if (!userId) {
        continue;
      }

      counts.set(userId, (counts.get(userId) ?? 0) + 1);
    }

    return counts;
  }, [routers, subscriptions]);

  const usersPagination = paginateRows(users, usersPage);

  function setEditableFields(user: AppUser) {
    setFullName(user.full_name);
    setPhoneNumber(user.phone_number ?? "");
    setUserStatus(user.status);
  }

  async function loadUsers() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [userData, subscriptionData, routerData] = await Promise.all([
        listISPAdminAppUsers(getApiStatusFilter(statusFilter)),
        listUserSubscriptions(null, null, 100),
        listRouters(null, null, 100),
      ]);

      setUsers(userData);
      setSubscriptions(subscriptionData);
      setRouters(routerData);
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
        const [userData, subscriptionData, routerData] = await Promise.all([
          listISPAdminAppUsers(getApiStatusFilter(statusFilter)),
          listUserSubscriptions(null, null, 100),
          listRouters(null, null, 100),
        ]);

        if (!isCancelled) {
          setUsers(userData);
          setSubscriptions(subscriptionData);
          setRouters(routerData);
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
        <button
          type="button"
          className="secondary-button pf-refresh-button"
          onClick={loadUsers}
        >
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
                onClick={() => {
                  setUsersPage(1);
                  setStatusFilter(filter.value);
                }}
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

              <div className="pf-selected-usage-section">
                <div>
                  <h4>Plan usage</h4>
                  <p className="muted">
                    Each service line is shown separately with usage against its own plan limit.
                  </p>
                </div>

                {getUserUsageSummaries(selectedUser).length === 0 && (
                  <div className="pf-empty-state pf-selected-usage-empty">
                    <span className="material-symbols-outlined">data_usage</span>
                    <p>No active or historical subscriptions found for this user.</p>
                  </div>
                )}

                <div className="pf-subscription-usage-grid">
                  {getUserUsageSummaries(selectedUser).map((summary, index) => (
                    <article
                      className="pf-subscription-usage-card"
                      key={summary.subscription_id ?? `${selectedUser.id}-${index}`}
                    >
                      <div
                        className="pf-usage-donut"
                        style={getUsageDonutStyle(summary)}
                        aria-label={`Usage ${formatUsagePercent({ ...selectedUser, usage_summary: summary })}`}
                      >
                        <div>
                          <strong>
                            {summary.is_unlimited
                              ? "?"
                              : formatNumber(summary.usage_percent, "%")}
                          </strong>
                          <span>{summary.is_unlimited ? "used" : "of plan"}</span>
                        </div>
                      </div>

                      <div className="pf-subscription-usage-copy">
                        <div>
                          <h5>{formatSubscriptionTitle(summary, index)}</h5>
                          <p>{summary.plan_name ?? "No plan name"}</p>
                        </div>

                        <strong>{formatLimitText(summary)}</strong>

                        <dl>
                          <div>
                            <dt>Remaining</dt>
                            <dd>
                              {summary.is_unlimited
                                ? "Unlimited"
                                : formatNumber(summary.remaining_gb, " GB")}
                            </dd>
                          </div>
                          <div>
                            <dt>Today</dt>
                            <dd>{formatNumber(summary.today_usage_gb, " GB")}</dd>
                          </div>
                          <div>
                            <dt>This month</dt>
                            <dd>{formatNumber(summary.monthly_usage_gb, " GB")}</dd>
                          </div>
                          <div>
                            <dt>Total</dt>
                            <dd>{formatNumber(summary.total_usage_gb, " GB")}</dd>
                          </div>
                        </dl>
                      </div>
                    </article>
                  ))}
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

              <button className="pf-action-button" disabled={isUpdating}>
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
        <div className="table-card pf-app-users-table-card">
          <table>
            <thead>
              <tr>
                <th>Full name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Phone</th>
                <th>Service lines</th>
                <th>Routers</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {usersPagination.pageRows.map((user) => (
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
                  <td>{serviceLineCountByUserId.get(user.id) ?? 0}</td>
                  <td>{routerCountByUserId.get(user.id) ?? 0}</td>
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
                  <td colSpan={9}>
                    No App Users match this filter. Create an App User
                    invitation first, then accepted accounts appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <AdminTablePagination
            page={usersPagination.safePage}
            pageCount={usersPagination.pageCount}
            onPageChange={setUsersPage}
          />
        </div>
      )}
    </section>
  );
}
