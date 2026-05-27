import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getErrorMessage } from "../api/errors";
import {
  createRouter,
  createUserSubscription,
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
  SimulatorScenario,
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

const simulatorScenarios: { label: string; value: SimulatorScenario }[] = [
  { label: "Normal usage", value: "normal_usage" },
  { label: "High usage", value: "high_usage" },
  { label: "Near plan limit", value: "near_plan_limit" },
  { label: "Exceeded plan", value: "exceeded_plan" },
  { label: "New device", value: "new_device" },
  { label: "Policy failure", value: "policy_failure" },
  { label: "Heavy device usage", value: "heavy_device_usage" },
];

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

function formatScenarioLabel(value: SimulatorScenario) {
  return value.replaceAll("_", " ");
}

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
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

  const [createUserId, setCreateUserId] = useState("");
  const [createPlanId, setCreatePlanId] = useState("");
  const [createServiceLabel, setCreateServiceLabel] = useState("");
  const [createStartDate, setCreateStartDate] = useState(todayDateInputValue);
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
  const [simulatorScenario, setSimulatorScenario] =
    useState<SimulatorScenario>("normal_usage");

  const userNameById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user.full_name]));
  }, [users]);


  const planNameById = useMemo(() => {
    return new Map(plans.map((plan) => [plan.id, plan.plan_name]));
  }, [plans]);

  const activePlans = useMemo(() => {
    return plans.filter((plan) => plan.is_active);
  }, [plans]);


  const routerCountByServiceLineId = useMemo(() => {
    const counts = new Map<string, number>();

    for (const router of routers) {
      if (!router.user_subscription_id) {
        continue;
      }

      counts.set(
        router.user_subscription_id,
        (counts.get(router.user_subscription_id) ?? 0) + 1
      );
    }

    return counts;
  }, [routers]);

  const subscriptionLabelById = useMemo(() => {
    return new Map(
      subscriptions.map((subscription) => [
        subscription.id,
        getServiceLineLabel(subscription),
      ])
    );
    // getServiceLineLabel depends on these maps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions, userNameById, planNameById, routerCountByServiceLineId]);

  function getServiceLineLabel(subscription: UserSubscription) {
    const userName = userNameById.get(subscription.user_id) ?? "Unknown user";
    const planName = planNameById.get(subscription.plan_id) ?? "Unknown package";
    const serviceLabel = subscription.subscription_label
      ? ` / ${subscription.subscription_label}`
      : "";
    const routerCount = routerCountByServiceLineId.get(subscription.id) ?? 0;
    const routerText =
      routerCount === 0
        ? "no router"
        : routerCount === 1
          ? "1 router"
          : `${routerCount} routers`;

    return `${userName}${serviceLabel} / ${planName} (${subscription.status}, ${routerText})`;
  }

  function serviceLineHasOtherRouter(
    serviceLineId: string,
    currentRouterId: string | null = null
  ) {
    return routers.some(
      (router) =>
        router.user_subscription_id === serviceLineId &&
        router.id !== currentRouterId
    );
  }

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

  async function loadOptions() {
    setIsLoadingOptions(true);

    try {
      const [subscriptionData, userData, planData, routerData] =
        await Promise.all([
          listUserSubscriptions(null, null, 100),
          listISPAdminAppUsers(null, 100),
          listSubscriptionPlans(null, 100),
          listRouters(null, null, 100),
        ]);

      setSubscriptions(subscriptionData);
      setUsers(userData);
      setPlans(planData);
      setRouters(routerData);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load router form options.")
      );
    } finally {
      setIsLoadingOptions(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialOptions() {
      try {
        const [subscriptionData, userData, planData, routerData] =
          await Promise.all([
            listUserSubscriptions(null, null, 100),
            listISPAdminAppUsers(null, 100),
            listSubscriptionPlans(null, 100),
            listRouters(null, null, 100),
          ]);

        if (!isCancelled) {
          setSubscriptions(subscriptionData);
          setUsers(userData);
          setPlans(planData);
          setRouters(routerData);
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

  function validateRouterFields(routerName: string) {
    if (routerName.trim() && routerName.trim().length < 2) {
      return "Router name must be at least 2 characters.";
    }

    return "";
  }

  async function handleCreateRouter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateRouterFields(createName);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!createMac.trim()) {
      setErrorMessage("Enter the router MAC address.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsCreating(true);

    try {
      if (!createUserId) {
        setErrorMessage("Select an App User.");
        return;
      }

      if (!createPlanId) {
        setErrorMessage("Select a package/plan.");
        return;
      }

      const createdSubscription = await createUserSubscription({
        user_id: createUserId,
        plan_id: createPlanId,
        subscription_label: optionalText(createServiceLabel),
        start_date: createStartDate,
        end_date: null,
        status: "active",
        auto_renew: true,
      });

      const serviceLineId = createdSubscription.id;
      setSubscriptions((current) => [createdSubscription, ...current]);

      const createdRouter = await createRouter({
        user_subscription_id: serviceLineId,
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

      setCreateUserId("");
      setCreatePlanId("");
      setCreateServiceLabel("");
      setCreateStartDate(todayDateInputValue());
      setCreateName("");
      setCreateModel("");
      setCreateIp("");
      setCreateMac("");
      setCreateApiEndpoint("");
      setCreateUsername("");
      setCreateStatus("active");

      await loadOptions();

      setSuccessMessage(
        "Router created successfully. PulseFi created a linked subscription for this router."
      );
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

    const validationError = validateRouterFields(editName);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!editMac.trim()) {
      setErrorMessage("Enter the router MAC address.");
      return;
    }

    if (!editSubscriptionId) {
      setErrorMessage("Select an assigned subscription.");
      return;
    }

    if (serviceLineHasOtherRouter(editSubscriptionId, selectedRouter.id)) {
      setErrorMessage(
        "This subscription is already assigned to another router. Choose another subscription."
      );
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

      await loadOptions();

      setSuccessMessage("Router updated successfully.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not update router."));
    } finally {
      setIsUpdating(false);
    }
  }

  function getRouterServiceLine(router: ISPAdminRouter) {
    if (!router.user_subscription_id) {
      return null;
    }

    return (
      subscriptions.find(
        (subscription) => subscription.id === router.user_subscription_id
      ) ?? null
    );
  }

  async function handleRunFullSimulator(router: ISPAdminRouter) {
    const serviceLine = getRouterServiceLine(router);

    if (!serviceLine || serviceLine.status !== "active") {
      setErrorMessage(
        "This router's assigned subscription is not active. Use an active subscription before running simulator data."
      );
      return;
    }

    setSimulatorRunningRouterId(router.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await runFullSimulatorIngestionForRouter(router.id, {
        scenario: simulatorScenario,
      });

      await loadRouters();

      setSuccessMessage(
        `Full simulator completed (${formatScenarioLabel(
          result.scenario
        )}): ${result.device_ingestion.devices_seen} devices seen, ${result.usage_ingestion.records_created} usage records created, ${result.alerts_created} alerts created.`
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
            Create customer routers and assign each router to its own subscription/package for accurate usage and alerts.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button pf-refresh-button"
          onClick={() => {
            void loadOptions();
            void loadRouters();
          }}
        >
          Refresh
        </button>
      </div>

      <div className="management-grid routers-management-grid">
        <form className="create-form" onSubmit={handleCreateRouter}>
          <h3>Add router</h3>
          <p className="muted">
            Create a router and assign its customer package. PulseFi will create
            a subscription for this router so usage, devices, alerts, and plan
            limits stay separate.
          </p>

          <label>
            App User
            <select
              value={createUserId}
              onChange={(event) => setCreateUserId(event.target.value)}
              required
              disabled={isLoadingOptions}
            >
              <option value="">Select App User</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} / {user.email}
                </option>
              ))}
            </select>
          </label>

          <label>
            Package / plan
            <select
              value={createPlanId}
              onChange={(event) => setCreatePlanId(event.target.value)}
              required
              disabled={isLoadingOptions}
            >
              <option value="">Select package</option>
              {activePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.plan_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Subscription label
            <input
              value={createServiceLabel}
              onChange={(event) => setCreateServiceLabel(event.target.value)}
              placeholder="Home internet, Office internet, Gaming router..."
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
              placeholder="AA:BB:CC:DD:EE:FF"
              required
            />
          </label>

          <label>
            API endpoint
            <input
              value={createApiEndpoint}
              onChange={(event) => setCreateApiEndpoint(event.target.value)}
              maxLength={1000}
              placeholder="Optional, e.g. http://192.168.1.1/api"
            />
          </label>

          <label>
            Router username
            <input
              value={createUsername}
              onChange={(event) => setCreateUsername(event.target.value)}
              maxLength={120}
              placeholder="Optional API username"
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

          <button
            className="pf-action-button"
            disabled={isCreating || isLoadingOptions}
          >
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
                  <span>Assigned subscription</span>
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
                Assigned subscription
                <select
                  value={editSubscriptionId}
                  onChange={(event) => setEditSubscriptionId(event.target.value)}
                  required
                >
                  <option value="">Select assigned subscription</option>
                  {subscriptions
                    .filter(
                      (subscription) =>
                        subscription.status === "active" ||
                        subscription.id === selectedRouter.user_subscription_id
                    )
                    .map((subscription) => {
                    const hasOtherRouter = serviceLineHasOtherRouter(
                      subscription.id,
                      selectedRouter.id
                    );

                    return (
                      <option
                        key={subscription.id}
                        value={subscription.id}
                        disabled={hasOtherRouter}
                      >
                        {subscriptionLabelById.get(subscription.id) ??
                          subscription.id}
                        {subscription.status !== "active" ? " / NOT ACTIVE" : ""}
                      </option>
                    );
                  })}
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
                  placeholder="AA:BB:CC:DD:EE:FF"
                  required
                />
              </label>

              <label>
                API endpoint
                <input
                  value={editApiEndpoint}
                  onChange={(event) => setEditApiEndpoint(event.target.value)}
                  maxLength={1000}
                  placeholder="Optional, e.g. http://192.168.1.1/api"
                />
              </label>

              <label>
                Router username
                <input
                  value={editUsername}
                  onChange={(event) => setEditUsername(event.target.value)}
                  maxLength={120}
                  placeholder="Optional API username"
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

              <button className="pf-action-button" disabled={isUpdating}>
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
          <option value="all">All assigned subscriptions</option>
          {subscriptions.map((subscription) => (
            <option key={subscription.id} value={subscription.id}>
              {subscriptionLabelById.get(subscription.id) ?? subscription.id}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={simulatorScenario}
          onChange={(event) =>
            setSimulatorScenario(event.target.value as SimulatorScenario)
          }
          aria-label="Full simulator scenario"
        >
          {simulatorScenarios.map((scenario) => (
            <option key={scenario.value} value={scenario.value}>
              {scenario.label}
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
                <th>Assigned subscription</th>
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
                      className="small-button pf-simulator-action-button"
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
                    No routers match this filter. Create an independent service
                    line first, then attach a router without collecting passwords.
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
