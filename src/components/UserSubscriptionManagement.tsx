import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getErrorMessage } from "../api/errors";
import {
  createUserSubscription,
  getUserSubscription,
  listISPAdminAppUsers,
  listSubscriptionPlans,
  listUserSubscriptions,
  updateUserSubscription,
} from "../api/ispAdmin";
import type {
  AppUser,
  SubscriptionPlan,
  UserSubscription,
  UserSubscriptionFilter,
  UserSubscriptionStatus,
} from "../api/ispAdmin";

const subscriptionFilters: { label: string; value: UserSubscriptionFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Expired", value: "expired" },
  { label: "Cancelled", value: "cancelled" },
];

const subscriptionStatuses: UserSubscriptionStatus[] = [
  "pending",
  "active",
  "suspended",
  "expired",
  "cancelled",
];

function getApiStatusFilter(
  filter: UserSubscriptionFilter
): UserSubscriptionStatus | null {
  return filter === "all" ? null : filter;
}

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

function formatDate(value: string | null) {
  return value || "-";
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function UserSubscriptionManagement() {
  const [statusFilter, setStatusFilter] =
    useState<UserSubscriptionFilter>("all");
  const [userFilter, setUserFilter] = useState("all");

  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedSubscription, setSelectedSubscription] =
    useState<UserSubscription | null>(null);

  const [createUserId, setCreateUserId] = useState("");
  const [createPlanId, setCreatePlanId] = useState("");
  const [createLabel, setCreateLabel] = useState("");
  const [createStartDate, setCreateStartDate] = useState(getTodayDate());
  const [createEndDate, setCreateEndDate] = useState("");
  const [createStatus, setCreateStatus] =
    useState<UserSubscriptionStatus>("active");
  const [createAutoRenew, setCreateAutoRenew] = useState(false);

  const [editPlanId, setEditPlanId] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editStatus, setEditStatus] =
    useState<UserSubscriptionStatus>("active");
  const [editAutoRenew, setEditAutoRenew] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectingSubscriptionId, setSelectingSubscriptionId] =
    useState<string | null>(null);

  const userNameById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user.full_name]));
  }, [users]);

  const planNameById = useMemo(() => {
    return new Map(plans.map((plan) => [plan.id, plan.plan_name]));
  }, [plans]);

  const activePlans = useMemo(() => {
    return plans.filter((plan) => plan.is_active);
  }, [plans]);

  function setEditableFields(subscription: UserSubscription) {
    setEditPlanId(subscription.plan_id);
    setEditLabel(subscription.subscription_label ?? "");
    setEditStartDate(subscription.start_date);
    setEditEndDate(subscription.end_date ?? "");
    setEditStatus(subscription.status);
    setEditAutoRenew(subscription.auto_renew);
  }


  async function loadSubscriptions() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await listUserSubscriptions(
        getApiStatusFilter(statusFilter),
        userFilter === "all" ? null : userFilter
      );
      setSubscriptions(data);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load subscriptions.")
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialOptions() {
      try {
        const [userData, planData] = await Promise.all([
          listISPAdminAppUsers(null),
          listSubscriptionPlans(null),
        ]);

        if (!isCancelled) {
          setUsers(userData);
          setPlans(planData);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            getErrorMessage(error, "Could not load users and plans.")
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingOptions(false);
        }
      }
    }

    loadInitialOptions();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadFilteredSubscriptions() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listUserSubscriptions(
          getApiStatusFilter(statusFilter),
          userFilter === "all" ? null : userFilter
        );

        if (!isCancelled) {
          setSubscriptions(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            getErrorMessage(error, "Could not load subscriptions.")
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadFilteredSubscriptions();

    return () => {
      isCancelled = true;
    };
  }, [statusFilter, userFilter]);

  async function chooseSubscription(subscription: UserSubscription) {
    setSelectingSubscriptionId(subscription.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const details = await getUserSubscription(subscription.id);
      setSelectedSubscription(details);
      setEditableFields(details);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load subscription.")
      );
    } finally {
      setSelectingSubscriptionId(null);
    }
  }

  function validateSubscriptionForm(
    userId: string | null,
    planId: string,
    startDate: string,
    endDate: string
  ) {
    if (userId !== null && !userId) {
      return "Select an App User.";
    }

    if (!planId) {
      return "Select a subscription plan.";
    }

    if (!startDate) {
      return "Start date is required.";
    }

    if (endDate && endDate < startDate) {
      return "End date cannot be before start date.";
    }

    return "";
  }

  async function handleCreateSubscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateSubscriptionForm(
      createUserId,
      createPlanId,
      createStartDate,
      createEndDate
    );

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsCreating(true);

    try {
      const createdSubscription = await createUserSubscription({
        user_id: createUserId,
        plan_id: createPlanId,
        subscription_label: createLabel.trim() || null,
        start_date: createStartDate,
        end_date: createEndDate || null,
        status: createStatus,
        auto_renew: createAutoRenew,
      });

      const apiStatusFilter = getApiStatusFilter(statusFilter);
      const matchesStatus =
        apiStatusFilter === null || createdSubscription.status === apiStatusFilter;
      const matchesUser =
        userFilter === "all" || createdSubscription.user_id === userFilter;

      if (matchesStatus && matchesUser) {
        setSubscriptions((current) => [createdSubscription, ...current]);
      }

      setSelectedSubscription(createdSubscription);
      setEditableFields(createdSubscription);

      setCreateUserId("");
      setCreatePlanId("");
      setCreateLabel("");
      setCreateStartDate(getTodayDate());
      setCreateEndDate("");
      setCreateStatus("active");
      setCreateAutoRenew(false);

      setSuccessMessage("Subscription assigned successfully.");
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not assign subscription.")
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateSubscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSubscription) {
      setErrorMessage("Select a subscription first.");
      return;
    }

    const validationError = validateSubscriptionForm(
      null,
      editPlanId,
      editStartDate,
      editEndDate
    );

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsUpdating(true);

    try {
      const updatedSubscription = await updateUserSubscription(
        selectedSubscription.id,
        {
          plan_id: editPlanId,
          subscription_label: editLabel.trim() || null,
          start_date: editStartDate,
          end_date: editEndDate || null,
          status: editStatus,
          auto_renew: editAutoRenew,
        }
      );

      const apiStatusFilter = getApiStatusFilter(statusFilter);

      setSelectedSubscription(updatedSubscription);
      setEditableFields(updatedSubscription);
      setSubscriptions((current) =>
        current
          .map((subscription) =>
            subscription.id === updatedSubscription.id
              ? updatedSubscription
              : subscription
          )
          .filter(
            (subscription) =>
              (apiStatusFilter === null ||
                subscription.status === apiStatusFilter) &&
              (userFilter === "all" || subscription.user_id === userFilter)
          )
      );

      setSuccessMessage("Subscription updated successfully.");
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not update subscription.")
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">User Subscriptions</p>
          <h2>Subscription Assignment</h2>
          <p className="muted">
            Assign plans to App Users and manage subscription status.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button pf-refresh-button"
          onClick={loadSubscriptions}
        >
          Refresh
        </button>
      </div>

      <div className="management-grid subscriptions-management-grid">
        <form className="create-form" onSubmit={handleCreateSubscription}>
          <h3>Assign subscription</h3>

          <label>
            App User
            <select
              value={createUserId}
              onChange={(event) => setCreateUserId(event.target.value)}
              required
              disabled={isLoadingOptions}
            >
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} - {user.email}
                </option>
              ))}
            </select>
          </label>

          <label>
            Plan
            <select
              value={createPlanId}
              onChange={(event) => setCreatePlanId(event.target.value)}
              required
              disabled={isLoadingOptions}
            >
              <option value="">Select plan</option>
              {activePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.plan_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Label
            <input
              value={createLabel}
              onChange={(event) => setCreateLabel(event.target.value)}
              maxLength={120}
              placeholder="Home internet, Office, etc."
            />
          </label>

          <label>
            Start date
            <input
              type="date"
              value={createStartDate}
              onChange={(event) => setCreateStartDate(event.target.value)}
              required
            />
          </label>

          <label>
            End date
            <input
              type="date"
              value={createEndDate}
              onChange={(event) => setCreateEndDate(event.target.value)}
            />
          </label>

          <label>
            Status
            <select
              value={createStatus}
              onChange={(event) =>
                setCreateStatus(event.target.value as UserSubscriptionStatus)
              }
            >
              {subscriptionStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={createAutoRenew}
              onChange={(event) => setCreateAutoRenew(event.target.checked)}
            />
            Auto-renew
          </label>

          <button
            className="pf-action-button"
            disabled={isCreating || isLoadingOptions}
          >
            {isCreating ? "Assigning..." : "Assign subscription"}
          </button>
        </form>

        <form className="create-form" onSubmit={handleUpdateSubscription}>
          <h3>Selected subscription</h3>

          {!selectedSubscription && (
            <p className="muted">
              Select a subscription from the table to view it.
            </p>
          )}

          {selectedSubscription && (
            <>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>User</span>
                  <strong>
                    {userNameById.get(selectedSubscription.user_id) ??
                      selectedSubscription.user_id}
                  </strong>
                </div>
                <div className="detail-item">
                  <span>Created</span>
                  <strong>{formatDateTime(selectedSubscription.created_at)}</strong>
                </div>
              </div>

              <label>
                Plan
                <select
                  value={editPlanId}
                  onChange={(event) => setEditPlanId(event.target.value)}
                  required
                >
                  <option value="">Select plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.plan_name}
                      {!plan.is_active ? " (inactive)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Label
                <input
                  value={editLabel}
                  onChange={(event) => setEditLabel(event.target.value)}
                  maxLength={120}
                />
              </label>

              <label>
                Start date
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(event) => setEditStartDate(event.target.value)}
                  required
                />
              </label>

              <label>
                End date
                <input
                  type="date"
                  value={editEndDate}
                  onChange={(event) => setEditEndDate(event.target.value)}
                />
              </label>

              <label>
                Status
                <select
                  value={editStatus}
                  onChange={(event) =>
                    setEditStatus(event.target.value as UserSubscriptionStatus)
                  }
                >
                  {subscriptionStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={editAutoRenew}
                  onChange={(event) => setEditAutoRenew(event.target.checked)}
                />
                Auto-renew
              </label>

              <button className="pf-action-button" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update subscription"}
              </button>
            </>
          )}
        </form>
      </div>

      <div className="filter-bar" aria-label="Subscription filters">
        {subscriptionFilters.map((filter) => (
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

        <select
          className="filter-select"
          value={userFilter}
          onChange={(event) => setUserFilter(event.target.value)}
        >
          <option value="all">All users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name}
            </option>
          ))}
        </select>
      </div>

      {errorMessage && <div className="error-box">{errorMessage}</div>}
      {successMessage && <div className="success-box">{successMessage}</div>}

      {isLoading && <p>Loading subscriptions...</p>}

      {!isLoading && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Label</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th>Auto-renew</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr
                  key={subscription.id}
                  className={
                    selectedSubscription?.id === subscription.id
                      ? "selected-row"
                      : "clickable-row"
                  }
                  onClick={() => chooseSubscription(subscription)}
                >
                  <td>
                    {userNameById.get(subscription.user_id) ??
                      subscription.user_id}
                  </td>
                  <td>
                    {planNameById.get(subscription.plan_id) ??
                      subscription.plan_id}
                  </td>
                  <td>{subscription.subscription_label ?? "-"}</td>
                  <td>
                    <span className={`status-pill status-${subscription.status}`}>
                      {subscription.status}
                    </span>
                  </td>
                  <td>{formatDate(subscription.start_date)}</td>
                  <td>{formatDate(subscription.end_date)}</td>
                  <td>{subscription.auto_renew ? "Yes" : "No"}</td>
                  <td>
                    <button
                      className="small-button"
                      type="button"
                      disabled={selectingSubscriptionId === subscription.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        chooseSubscription(subscription);
                      }}
                    >
                      {selectingSubscriptionId === subscription.id
                        ? "Loading..."
                        : "View"}
                    </button>
                  </td>
                </tr>
              ))}

              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    No subscriptions match this filter. Add App Users and plans,
                    then assign a subscription above.
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
