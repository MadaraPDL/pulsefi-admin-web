import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../api/errors";
import {
  getISPAdminAlert,
  getISPAdminAnalyticsSummary,
  listISPAdminAlerts,
  listISPAdminAppUsers,
} from "../api/ispAdmin";
import type {
  AppUser,
  ISPAdminAlert,
  ISPAdminAlertListParams,
  ISPAdminAnalyticsSummary,
} from "../api/ispAdmin";

type MonitoringAlertFilter = "both" | "high_usage" | "plan_exceed_risk";

const monitoringAlertFilters: Array<{
  label: string;
  value: MonitoringAlertFilter;
}> = [
  { label: "High usage + limit reached", value: "both" },
  { label: "High usage only", value: "high_usage" },
  { label: "Limit reached only", value: "plan_exceed_risk" },
];

function formatNumber(value: number | string) {
  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat().format(numericValue);
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

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return value.replaceAll("_", " ");
}

function getAlertTone(severity: string) {
  const normalized = severity.toLowerCase();

  if (normalized.includes("critical") || normalized.includes("high")) {
    return "critical";
  }

  if (normalized.includes("warning") || normalized.includes("medium")) {
    return "warning";
  }

  return "info";
}

function DetailLine({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <small>
      <strong>{label}:</strong> {value ?? "-"}
    </small>
  );
}

function AnalyticsCards({ analytics }: { analytics: ISPAdminAnalyticsSummary }) {
  const cards = [
    {
      label: "Usage",
      value: `${formatNumber(analytics.total_usage_gb)} GB`,
      detail: `${formatNumber(analytics.total_usage_mb)} MB total`,
      icon: "monitoring",
      tone: "info",
    },
    {
      label: "Unread Alerts",
      value: analytics.unread_alerts,
      detail: `${analytics.critical_alerts} critical`,
      icon: "notifications_active",
      tone: analytics.critical_alerts > 0 ? "critical" : "info",
    },
    {
      label: "Plan Requests",
      value: analytics.pending_plan_change_requests,
      detail: `${analytics.approved_plan_change_requests} approved`,
      icon: "compare_arrows",
      tone: analytics.pending_plan_change_requests > 0 ? "warning" : "info",
    },
    {
      label: "Recommendations",
      value: analytics.total_recommendations,
      detail: `${analytics.new_recommendations} new`,
      icon: "tips_and_updates",
      tone: analytics.new_recommendations > 0 ? "warning" : "info",
    },
  ];

  return (
    <section className="pf-monitoring-card-grid">
      {cards.map((card) => (
        <article
          className={`pf-monitoring-card pf-monitoring-${card.tone}`}
          key={card.label}
        >
          <div>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.detail}</small>
          </div>

          <span className="material-symbols-outlined" aria-hidden="true">
            {card.icon}
          </span>
        </article>
      ))}
    </section>
  );
}

function AlertList({
  alerts,
  selectedAlert,
  loadingAlertId,
  selectedUserId,
  onViewDetail,
}: {
  alerts: ISPAdminAlert[];
  selectedAlert: ISPAdminAlert | null;
  loadingAlertId: string | null;
  selectedUserId: string;
  onViewDetail: (alertId: string) => void;
}) {
  if (!selectedUserId) {
    return (
      <div className="pf-empty-state">
        <span className="material-symbols-outlined">person_search</span>
        <h3>Select a user first</h3>
        <p>
          Alerts in Monitoring are user-specific. Select an App User to view
          only their high-usage and limit-reached alerts.
        </p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="pf-empty-state">
        <span className="material-symbols-outlined">notifications_off</span>
        <h3>No matching alerts found</h3>
        <p>
          This selected user has no high-usage or plan-limit alerts for the
          current filter.
        </p>
      </div>
    );
  }

  return (
    <div className="pf-monitoring-alert-scroll">
      <div className="pf-monitoring-alert-list">
        {alerts.map((alert) => {
          const tone = getAlertTone(alert.severity);
          const isSelected = selectedAlert?.id === alert.id;
          const isLoading = loadingAlertId === alert.id;
          const detail = isSelected ? selectedAlert : alert;

          return (
            <article
              className={`pf-alert-item pf-alert-${tone}`}
              key={alert.id}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {tone === "critical"
                  ? "error"
                  : tone === "warning"
                    ? "warning"
                    : "info"}
              </span>

              <div>
                <div className="pf-alert-title-row">
                  <h3>{alert.title}</h3>
                  <span className={`status-pill status-${tone}`}>
                    {formatLabel(alert.severity)}
                  </span>
                </div>

                <p>{alert.message}</p>

                <small>
                  {formatLabel(alert.alert_type)} - {formatLabel(alert.status)} -{" "}
                  {formatDateTime(alert.created_at)}
                </small>

                {isSelected && (
                  <div className="pf-inline-detail-panel">
                    <DetailLine label="Alert ID" value={detail.id} />
                    <DetailLine label="User ID" value={detail.user_id} />
                    <DetailLine
                      label="Subscription ID"
                      value={detail.user_subscription_id}
                    />
                    <DetailLine label="Device ID" value={detail.device_id} />
                    <DetailLine
                      label="Connection Log ID"
                      value={detail.connection_log_id}
                    />
                    <DetailLine label="Usage ID" value={detail.usage_id} />
                    <DetailLine label="Prediction ID" value={detail.prediction_id} />
                    <DetailLine
                      label="Read at"
                      value={formatDateTime(detail.read_at)}
                    />
                  </div>
                )}

                <button
                  className="small-button"
                  type="button"
                  disabled={isLoading}
                  onClick={() => onViewDetail(alert.id)}
                >
                  {isLoading
                    ? "Loading..."
                    : isSelected
                      ? "Hide details"
                      : "View details"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

async function listMonitoringAlertsForSelectedUser(
  userId: string,
  alertFilter: MonitoringAlertFilter
) {
  const baseFilters: ISPAdminAlertListParams = {
    user_id: userId,
    limit: 12,
  };

  if (alertFilter !== "both") {
    return listISPAdminAlerts({
      ...baseFilters,
      alert_type: alertFilter,
    });
  }

  const [highUsageAlerts, limitReachedAlerts] = await Promise.all([
    listISPAdminAlerts({
      ...baseFilters,
      alert_type: "high_usage",
      limit: 8,
    }),
    listISPAdminAlerts({
      ...baseFilters,
      alert_type: "plan_exceed_risk",
      limit: 8,
    }),
  ]);

  return [...highUsageAlerts, ...limitReachedAlerts]
    .sort(
      (first, second) =>
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime()
    )
    .slice(0, 12);
}

export function ISPAdminMonitoringCenter() {
  const [analytics, setAnalytics] = useState<ISPAdminAnalyticsSummary | null>(
    null
  );
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [alerts, setAlerts] = useState<ISPAdminAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<ISPAdminAlert | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingAlertId, setLoadingAlertId] = useState<string | null>(null);
  const [alertFilter, setAlertFilter] = useState<MonitoringAlertFilter>("both");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  const loadMonitoringData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [analyticsData, appUserData] = await Promise.all([
        getISPAdminAnalyticsSummary(),
        listISPAdminAppUsers(null, 100),
      ]);

      setAnalytics(analyticsData);
      setAppUsers(appUserData);

      if (
        selectedUserId &&
        !appUserData.some((appUser) => appUser.id === selectedUserId)
      ) {
        setSelectedUserId("");
        setAlerts([]);
        setSelectedAlert(null);
      }
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load ISP monitoring data.")
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId]);

  const loadSelectedUserAlerts = useCallback(
    async (userId: string, filter: MonitoringAlertFilter) => {
      if (!userId) {
        setAlerts([]);
        setSelectedAlert(null);
        return;
      }

      setIsLoadingAlerts(true);
      setErrorMessage("");

      try {
        const alertsData = await listMonitoringAlertsForSelectedUser(userId, filter);
        setAlerts(alertsData);
        setSelectedAlert(null);
      } catch (error) {
        setAlerts([]);
        setErrorMessage(
          getErrorMessage(error, "Could not load selected-user alerts.")
        );
      } finally {
        setIsLoadingAlerts(false);
      }
    },
    []
  );

  async function handleViewAlertDetail(alertId: string) {
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(null);
      return;
    }

    setLoadingAlertId(alertId);
    setErrorMessage("");

    try {
      const alert = await getISPAdminAlert(alertId);
      setSelectedAlert(alert);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load alert details."));
    } finally {
      setLoadingAlertId(null);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMonitoringData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadMonitoringData]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSelectedUserAlerts(selectedUserId, alertFilter);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [selectedUserId, alertFilter, loadSelectedUserAlerts]);

  const selectedUser = appUsers.find((appUser) => appUser.id === selectedUserId);

  return (
    <section className="pf-content-card pf-monitoring-center">
      <div className="pf-panel-title-row">
        <div>
          <h2>Monitoring Center</h2>
          <p>Analytics, usage totals, and selected-user usage alerts.</p>
        </div>

        <button
          className="pf-view-link pf-refresh-button"
          type="button"
          onClick={() => {
            void loadMonitoringData();
            void loadSelectedUserAlerts(selectedUserId, alertFilter);
          }}
          disabled={isLoading || isLoadingAlerts}
        >
          Refresh
        </button>
      </div>

      {errorMessage && <div className="pf-error-box">{errorMessage}</div>}

      {isLoading && (
        <p className="pf-loading-text">Loading monitoring data...</p>
      )}

      {!isLoading && analytics && (
        <>
          <div className="pf-monitoring-meta">
            <span>
              <strong>Generated:</strong> {formatDateTime(analytics.generated_at)}
            </span>
            <span>
              <strong>ISP ID:</strong> {analytics.isp_id}
            </span>
          </div>

          <AnalyticsCards analytics={analytics} />

          <section className="pf-monitoring-split">
            <div className="pf-monitoring-panel">
              <div className="pf-monitoring-panel-header">
                <h3>Operational Summary</h3>
              </div>

              <div className="pf-monitoring-stat-list">
                <div>
                  <span>Users</span>
                  <strong>
                    {analytics.active_users}/{analytics.total_users}
                  </strong>
                  <small>active</small>
                </div>

                <div>
                  <span>Subscriptions</span>
                  <strong>
                    {analytics.active_subscriptions}/
                    {analytics.total_subscriptions}
                  </strong>
                  <small>active</small>
                </div>

                <div>
                  <span>Routers</span>
                  <strong>
                    {analytics.active_routers}/{analytics.total_routers}
                  </strong>
                  <small>active</small>
                </div>

                <div>
                  <span>Rejected Requests</span>
                  <strong>{analytics.rejected_plan_change_requests}</strong>
                  <small>review history</small>
                </div>
              </div>
            </div>

            <div className="pf-monitoring-panel">
              <div className="pf-monitoring-panel-header pf-monitoring-alert-header">
                <div>
                  <h3>Selected User Alerts</h3>
                  <p>
                    Select a user to view only high-usage and limit-reached
                    alerts for that account.
                  </p>
                </div>
              </div>

              <div className="pf-monitoring-user-alert-controls">
                <label>
                  App User
                  <select
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                  >
                    <option value="">Select an App User</option>
                    {appUsers.map((appUser) => (
                      <option value={appUser.id} key={appUser.id}>
                        {appUser.full_name} - {appUser.email}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="filter-bar pf-monitoring-filter-bar">
                  {monitoringAlertFilters.map((filter) => (
                    <button
                      key={filter.value}
                      className={`filter-chip ${
                        alertFilter === filter.value ? "active-filter" : ""
                      }`}
                      type="button"
                      onClick={() => setAlertFilter(filter.value)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedUser && (
                <div className="selected-strip pf-monitoring-selected-user-strip">
                  <strong>{selectedUser.full_name}</strong>
                  <span>{selectedUser.email}</span>
                </div>
              )}

              {isLoadingAlerts && (
                <p className="pf-loading-text">Loading selected-user alerts...</p>
              )}

              {!isLoadingAlerts && (
                <AlertList
                  alerts={alerts}
                  selectedAlert={selectedAlert}
                  loadingAlertId={loadingAlertId}
                  selectedUserId={selectedUserId}
                  onViewDetail={handleViewAlertDetail}
                />
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

