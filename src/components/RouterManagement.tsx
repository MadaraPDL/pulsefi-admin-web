import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getErrorMessage } from "../api/errors";
import {
  createRouter,
  getRouter,
  listISPAdminAppUsers,
  listRouters,
  listSubscriptionPlans,
  listUserSubscriptions,
  runFullSimulatorIngestionForRouter,
  updateRouter,
} from "../api/ispAdmin";
import type {
  AppUser,
  ISPAdminRouter,
  RouterFilter,
  RouterStatus,
  SubscriptionPlan,
  UserSubscription,
} from "../api/ispAdmin";

const routerFilters: { label: string; value: RouterFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Maintenance", value: "maintenance" },
];

const routerStatuses: RouterStatus[] = ["active", "inactive", "maintenance"];

function getApiStatusFilter(filter: RouterFilter): RouterStatus | null {
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

function optionalText(value: string) {
  return value.trim() || null;
}

export function RouterManagement() {
  const [statusFilter, setStatusFilter] = useState<RouterFilter>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");

  const [routers, setRouters] = useState<ISPAdminRouter[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedRouter, setSelectedRouter] = useState<ISPAdminRouter | null>(
    null
  );

  const [createSubscriptionId, setCreateSubscriptionId] = useState("");
  const [createName, setCreateName] = useState("");
  const [createModel, setCreateModel] = useState("");
  const [createIp, setCreateIp] = useState("");
  const [createMac, setCreateMac] = useState("");
  const [createApiEndpoint, setCreateApiEndpoint] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createStatus, setCreateStatus] = useState<RouterStatus>("active");

  const [editSubscriptionId, setEditSubscriptionId] = useState("");
  const [editName, setEditName] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editIp, setEditIp] = useState("");
  const [editMac, setEditMac] = useState("");
  const [editApiEndpoint, setEditApiEndpoint] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editStatus, setEditStatus] = useState<RouterStatus>("active");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectingRouterId, setSelectingRouterId] = useState<string | null>(
    null
  );
  const [simulatorRunningRouterId, setSimulatorRunningRouterId] = useState<
    string | null
  >(null);

  const userNameById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user.full_name]));
  }, [users]);

  const planNameById = useMemo(() => {
    return new Map(plans.map((plan) => [plan.id, plan.plan_name]));
  }, [plans]);

  const subscriptionLabelById = useMemo(() => {
    return new Map(
      subscriptions.map((subscription) => {
        const userName = userNameById.get(subscription.user_id) ?? "Unknown user";
        const planName = planNameById.get(subscription.plan_id) ?? "Unknown plan";
        const label = subscription.subscription_label
          ? ` - ${subscription.subscription_label}`
          : "";

        return [
          subscription.id,
          `${userName} / ${planName}${label} (${subscription.status})`,
        ];
      })
    );
  }, [subscriptions, userNameById, planNameById]);

  function setEditableFields(router: ISPAdminRouter) {
    setEditSubscriptionId(router.user_subscription_id ?? "");
    setEditName(router.router_name ?? "");
    setEditModel(router.router_model ?? "");
    setEditIp(router.router_ip ?? "");
    setEditMac(router.mac_address ?? "");
    setEditApiEndpoint(router.api_endpoint ?? "");
    setEditUsername(router.username ?? "");
    setEditStatus(router.status);
  }

  async function loadRouters() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await listRouters(
        getApiStatusFilter(statusFilter),
        subscriptionFilter === "all" ? null : subscriptionFilter
      );
      setRouters(data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load routers."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialOptions() {
      try {
        const [subscriptionData, userData, planData] = await Promise.all([
          listUserSubscriptions(null),
          listISPAdminAppUsers(null),
          listSubscriptionPlans(null),
        ]);

        if (!isCancelled) {
          setSubscriptions(subscriptionData);
          setUsers(userData);
          setPlans(planData);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            getErrorMessage(error, "Could not load router form options.")
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

    async function loadFilteredRouters() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listRouters(
          getApiStatusFilter(statusFilter),
          subscriptionFilter === "all" ? null : subscriptionFilter
        );

        if (!isCancelled) {
          setRouters(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error, "Could not load routers."));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadFilteredRouters();

    return () => {
      isCancelled = true;
    };
  }, [statusFilter, subscriptionFilter]);

  async function chooseRouter(router: ISPAdminRouter) {
    setSelectingRouterId(router.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const details = await getRouter(router.id);
      setSelectedRouter(details);
      setEditableFields(details);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load router."));
    } finally {
      setSelectingRouterId(null);
    }
  }

  function validateRouterForm(subscriptionId: string, routerName: string) {
    if (!subscriptionId) {
      return "Select a user subscription.";
    }

    if (routerName.trim() && routerName.trim().length < 2) {
      return "Router name must be at least 2 characters.";
    }

    return "";
  }

  async function handleCreateRouter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateRouterForm(
      createSubscriptionId,
      createName
    );

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsCreating(true);

    try {
      const createdRouter = await createRouter({
        user_subscription_id: createSubscriptionId,
        router_name: optionalText(createName),
        router_model: optionalText(createModel),
        router_ip: optionalText(createIp),
        mac_address: optionalText(createMac),
        api_endpoint: optionalText(createApiEndpoint),
        username: optionalText(createUsername),
        status: createStatus,
      });

      const apiStatusFilter = getApiStatusFilter(statusFilter);
      const matchesStatus =
        apiStatusFilter === null || createdRouter.status === apiStatusFilter;
      const matchesSubscription =
        subscriptionFilter === "all" ||
        createdRouter.user_subscription_id === subscriptionFilter;

      if (matchesStatus && matchesSubscription) {
        setRouters((current) => [createdRouter, ...current]);
      }

      setSelectedRouter(createdRouter);
      setEditableFields(createdRouter);

      setCreateSubscriptionId("");
      setCreateName("");
      setCreateModel("");
      setCreateIp("");
      setCreateMac("");
      setCreateApiEndpoint("");
      setCreateUsername("");
      setCreateStatus("active");

      setSuccessMessage("Router created successfully.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not create router."));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateRouter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedRouter) {
      setErrorMessage("Select a router first.");
      return;
    }

    const validationError = validateRouterForm(editSubscriptionId, editName);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsUpdating(true);

    try {
      const updatedRouter = await updateRouter(selectedRouter.id, {
        user_subscription_id: editSubscriptionId,
        router_name: optionalText(editName),
        router_model: optionalText(editModel),
        router_ip: optionalText(editIp),
        mac_address: optionalText(editMac),
        api_endpoint: optionalText(editApiEndpoint),
        username: optionalText(editUsername),
        status: editStatus,
      });

      const apiStatusFilter = getApiStatusFilter(statusFilter);

      setSelectedRouter(updatedRouter);
      setEditableFields(updatedRouter);
      setRouters((current) =>
        current
          .map((router) =>
            router.id === updatedRouter.id ? updatedRouter : router
          )
          .filter(
            (router) =>
              (apiStatusFilter === null || router.status === apiStatusFilter) &&
              (subscriptionFilter === "all" ||
                router.user_subscription_id === subscriptionFilter)
          )
      );

      setSuccessMessage("Router updated successfully.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not update router."));
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRunFullSimulator(router: ISPAdminRouter) {
    setSimulatorRunningRouterId(router.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await runFullSimulatorIngestionForRouter(router.id);

      await loadRouters();

      setSuccessMessage(
        `Full simulator completed: ${result.device_ingestion.devices_seen} devices seen, ${result.usage_ingestion.records_created} usage records created, ${result.alerts_created} alerts created.`
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not run full simulator ingestion.")
      );
    } finally {
      setSimulatorRunningRouterId(null);
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Router Records</p>
          <h2>Router Management</h2>
          <p className="muted">
            Link routers to user subscriptions. Passwords are not collected here.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button pf-refresh-button"
          onClick={loadRouters}
        >
          Refresh
        </button>
      </div>

      <div className="management-grid routers-management-grid">
        <form className="create-form" onSubmit={handleCreateRouter}>
          <h3>Add router</h3>

          <label>
            User subscription
            <select
              value={createSubscriptionId}
              onChange={(event) => setCreateSubscriptionId(event.target.value)}
              required
              disabled={isLoadingOptions}
            >
              <option value="">Select subscription</option>
              {subscriptions.map((subscription) => (
                <option key={subscription.id} value={subscription.id}>
                  {subscriptionLabelById.get(subscription.id) ?? subscription.id}
                </option>
              ))}
            </select>
          </label>

          <label>
            Router name
            <input
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              minLength={2}
              placeholder="Home router"
            />
          </label>

          <label>
            Router model
            <input
              value={createModel}
              onChange={(event) => setCreateModel(event.target.value)}
              maxLength={120}
              placeholder="Tenda, TP-Link, MikroTik..."
            />
          </label>

          <label>
            Router IP
            <input
              value={createIp}
              onChange={(event) => setCreateIp(event.target.value)}
              placeholder="192.168.1.1"
            />
          </label>

          <label>
            MAC address
            <input
              value={createMac}
              onChange={(event) => setCreateMac(event.target.value)}
              maxLength={50}
              placeholder="Optional"
            />
          </label>

          <label>
            API endpoint
            <input
              value={createApiEndpoint}
              onChange={(event) => setCreateApiEndpoint(event.target.value)}
              maxLength={1000}
              placeholder="Optional"
            />
          </label>

          <label>
            Router username
            <input
              value={createUsername}
              onChange={(event) => setCreateUsername(event.target.value)}
              maxLength={120}
              placeholder="Optional"
            />
          </label>

          <label>
            Status
            <select
              value={createStatus}
              onChange={(event) =>
                setCreateStatus(event.target.value as RouterStatus)
              }
            >
              {routerStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <button disabled={isCreating || isLoadingOptions}>
            {isCreating ? "Creating..." : "Add router"}
          </button>
        </form>

        <form className="create-form" onSubmit={handleUpdateRouter}>
          <h3>Selected router</h3>

          {!selectedRouter && (
            <p className="muted">Select a router from the table to view it.</p>
          )}

          {selectedRouter && (
            <>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Subscription</span>
                  <strong>
                    {selectedRouter.user_subscription_id
                      ? subscriptionLabelById.get(
                          selectedRouter.user_subscription_id
                        ) ?? selectedRouter.user_subscription_id
                      : "-"}
                  </strong>
                </div>
                <div className="detail-item">
                  <span>Created</span>
                  <strong>{formatDateTime(selectedRouter.created_at)}</strong>
                </div>
              </div>

              <label>
                User subscription
                <select
                  value={editSubscriptionId}
                  onChange={(event) => setEditSubscriptionId(event.target.value)}
                  required
                >
                  <option value="">Select subscription</option>
                  {subscriptions.map((subscription) => (
                    <option key={subscription.id} value={subscription.id}>
                      {subscriptionLabelById.get(subscription.id) ??
                        subscription.id}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Router name
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  minLength={2}
                />
              </label>

              <label>
                Router model
                <input
                  value={editModel}
                  onChange={(event) => setEditModel(event.target.value)}
                  maxLength={120}
                />
              </label>

              <label>
                Router IP
                <input
                  value={editIp}
                  onChange={(event) => setEditIp(event.target.value)}
                />
              </label>

              <label>
                MAC address
                <input
                  value={editMac}
                  onChange={(event) => setEditMac(event.target.value)}
                  maxLength={50}
                />
              </label>

              <label>
                API endpoint
                <input
                  value={editApiEndpoint}
                  onChange={(event) => setEditApiEndpoint(event.target.value)}
                  maxLength={1000}
                />
              </label>

              <label>
                Router username
                <input
                  value={editUsername}
                  onChange={(event) => setEditUsername(event.target.value)}
                  maxLength={120}
                />
              </label>

              <label>
                Status
                <select
                  value={editStatus}
                  onChange={(event) =>
                    setEditStatus(event.target.value as RouterStatus)
                  }
                >
                  {routerStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <button disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update router"}
              </button>
            </>
          )}
        </form>
      </div>

      <div className="filter-bar" aria-label="Router filters">
        {routerFilters.map((filter) => (
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
          value={subscriptionFilter}
          onChange={(event) => setSubscriptionFilter(event.target.value)}
        >
          <option value="all">All subscriptions</option>
          {subscriptions.map((subscription) => (
            <option key={subscription.id} value={subscription.id}>
              {subscriptionLabelById.get(subscription.id) ?? subscription.id}
            </option>
          ))}
        </select>
      </div>

      {errorMessage && <div className="error-box">{errorMessage}</div>}
      {successMessage && <div className="success-box">{successMessage}</div>}

      {isLoading && <p>Loading routers...</p>}

      {!isLoading && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Subscription</th>
                <th>Model</th>
                <th>IP</th>
                <th>MAC</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {routers.map((router) => (
                <tr
                  key={router.id}
                  className={
                    selectedRouter?.id === router.id
                      ? "selected-row"
                      : "clickable-row"
                  }
                  onClick={() => chooseRouter(router)}
                >
                  <td>{router.router_name ?? "-"}</td>
                  <td>
                    {router.user_subscription_id
                      ? subscriptionLabelById.get(router.user_subscription_id) ??
                        router.user_subscription_id
                      : "-"}
                  </td>
                  <td>{router.router_model ?? "-"}</td>
                  <td>{router.router_ip ?? "-"}</td>
                  <td>{router.mac_address ?? "-"}</td>
                  <td>
                    <span className={`status-pill status-${router.status}`}>
                      {router.status}
                    </span>
                  </td>
                  <td>{formatDateTime(router.created_at)}</td>
                  <td className="router-action-cell">
                    <button
                      className="small-button"
                      type="button"
                      disabled={selectingRouterId === router.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        chooseRouter(router);
                      }}
                    >
                      {selectingRouterId === router.id ? "Loading..." : "View"}
                    </button>
                    <button
                      className="small-button"
                      type="button"
                      disabled={simulatorRunningRouterId === router.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleRunFullSimulator(router);
                      }}
                    >
                      {simulatorRunningRouterId === router.id
                        ? "Running..."
                        : "Run full simulator"}
                    </button>
                  </td>
                </tr>
              ))}

              {routers.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    No routers match this filter. Assign a subscription first,
                    then add a router record without collecting passwords.
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
