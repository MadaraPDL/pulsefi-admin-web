import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/errors";
import {
  getISPAdminAnalyticsSummary,
  listISPAdminAlerts,
} from "../api/ispAdmin";
import type {
  ISPAdminAlert,
  ISPAdminAnalyticsSummary,
} from "../api/ispAdmin";

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
    <section className="stitch-monitoring-card-grid">
      {cards.map((card) => (
        <article
          className={`stitch-monitoring-card stitch-monitoring-${card.tone}`}
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

function AlertList({ alerts }: { alerts: ISPAdminAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="stitch-empty-state">
        <span className="material-symbols-outlined">notifications_off</span>
        <h3>No alerts found</h3>
        <p>
          There are no recent alerts for this ISP yet. Refresh after seeded
          monitoring data is available.
        </p>
      </div>
    );
  }

  return (
    <div className="stitch-monitoring-alert-list">
      {alerts.map((alert) => {
        const tone = getAlertTone(alert.severity);

        return (
          <article
            className={`stitch-alert-item stitch-alert-${tone}`}
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
              <div className="stitch-alert-title-row">
                <h3>{alert.title}</h3>
                <span className={`status-pill status-${tone}`}>
                  {alert.severity}
                </span>
              </div>

              <p>{alert.message}</p>

              <small>
                {alert.alert_type} - {alert.status} -{" "}
                {formatDateTime(alert.created_at)}
              </small>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function ISPAdminMonitoringCenter() {
  const [analytics, setAnalytics] = useState<ISPAdminAnalyticsSummary | null>(
    null
  );
  const [alerts, setAlerts] = useState<ISPAdminAlert[]>([]);
  const [alertFilter, setAlertFilter] = useState<"all" | "critical" | "unread">(
    "all"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadMonitoringData() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const alertFilters =
        alertFilter === "critical"
          ? { severity: "critical", limit: 8 }
          : alertFilter === "unread"
            ? { status: "unread", limit: 8 }
            : { limit: 8 };

      const [analyticsData, alertsData] = await Promise.all([
        getISPAdminAnalyticsSummary(),
        listISPAdminAlerts(alertFilters),
      ]);

      setAnalytics(analyticsData);
      setAlerts(alertsData);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load ISP monitoring data.")
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMonitoringData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // loadMonitoringData intentionally stays local to avoid extra renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertFilter]);

  return (
    <section className="stitch-content-card stitch-monitoring-center">
      <div className="stitch-panel-title-row">
        <div>
          <h2>Monitoring Center</h2>
          <p>Analytics, usage totals, alerts, and ISP activity signals.</p>
        </div>

        <button
          className="stitch-view-link"
          type="button"
          onClick={() => void loadMonitoringData()}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {errorMessage && <div className="stitch-error-box">{errorMessage}</div>}

      {isLoading && (
        <p className="stitch-loading-text">Loading monitoring data...</p>
      )}

      {!isLoading && analytics && (
        <>
          <div className="stitch-monitoring-meta">
            <span>
              <strong>Generated:</strong> {formatDateTime(analytics.generated_at)}
            </span>
            <span>
              <strong>ISP ID:</strong> {analytics.isp_id}
            </span>
          </div>

          <AnalyticsCards analytics={analytics} />

          <section className="stitch-monitoring-split">
            <div className="stitch-monitoring-panel">
              <div className="stitch-monitoring-panel-header">
                <h3>Operational Summary</h3>
              </div>

              <div className="stitch-monitoring-stat-list">
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

            <div className="stitch-monitoring-panel">
              <div className="stitch-monitoring-panel-header">
                <h3>Recent Alerts</h3>

                <div className="filter-bar stitch-monitoring-filter-bar">
                  {(["all", "critical", "unread"] as const).map((filter) => (
                    <button
                      key={filter}
                      className={`filter-chip ${
                        alertFilter === filter ? "active-filter" : ""
                      }`}
                      type="button"
                      onClick={() => setAlertFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <AlertList alerts={alerts} />
            </div>
          </section>
        </>
      )}
    </section>
  );
}
