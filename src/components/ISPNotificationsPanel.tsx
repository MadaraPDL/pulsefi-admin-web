import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../api/errors";
import {
  getISPAdminAnalyticsSummary,
  listISPAdminAlerts,
} from "../api/ispAdmin";
import type {
  ISPAdminAlert,
  ISPAdminAnalyticsSummary,
} from "../api/ispAdmin";

type NotificationFilter = "all" | "unread" | "critical";

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

function getAlertIcon(tone: string) {
  if (tone === "critical") {
    return "error";
  }

  if (tone === "warning") {
    return "warning";
  }

  return "notifications";
}

export function ISPNotificationsPanel({
  onClose,
  onOpenMonitoring,
}: {
  onClose: () => void;
  onOpenMonitoring: () => void;
}) {
  const [filter, setFilter] = useState<NotificationFilter>("unread");
  const [analytics, setAnalytics] = useState<ISPAdminAnalyticsSummary | null>(
    null
  );
  const [alerts, setAlerts] = useState<ISPAdminAlert[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const alertFilters =
        filter === "critical"
          ? { severity: "critical", limit: 8 }
          : filter === "unread"
            ? { status: "unread", limit: 8 }
            : { limit: 8 };

      const [analyticsData, alertData] = await Promise.all([
        getISPAdminAnalyticsSummary(),
        listISPAdminAlerts(alertFilters),
      ]);

      setAnalytics(analyticsData);
      setAlerts(alertData);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load ISP notifications.")
      );
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadNotifications]);

  function handleOpenMonitoring() {
    onOpenMonitoring();
    onClose();
  }

  return (
    <section
      className="pf-topbar-popover pf-notifications-popover"
      aria-label="ISP notifications"
    >
      <div className="pf-popover-header">
        <div>
          <h3>Notifications</h3>
          <p>Backend alerts for this ISP</p>
        </div>

        <button type="button" onClick={onClose} aria-label="Close notifications">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {analytics && (
        <div className="pf-notification-summary">
          <span>
            <strong>{analytics.unread_alerts}</strong>
            unread
          </span>
          <span>
            <strong>{analytics.critical_alerts}</strong>
            critical
          </span>
          <span>
            <strong>{analytics.total_alerts}</strong>
            total
          </span>
        </div>
      )}

      <div className="filter-bar pf-popover-filter-bar">
        {(["unread", "critical", "all"] as const).map((item) => (
          <button
            key={item}
            className={`filter-chip ${filter === item ? "active-filter" : ""}`}
            type="button"
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {errorMessage && <div className="pf-error-box">{errorMessage}</div>}

      {isLoading && (
        <p className="pf-loading-text">Loading notifications...</p>
      )}

      {!isLoading && !errorMessage && alerts.length === 0 && (
        <div className="pf-empty-state pf-popover-empty-state">
          <span className="material-symbols-outlined">notifications_off</span>
          <h3>No notifications found</h3>
          <p>No backend alerts match the selected filter.</p>
        </div>
      )}

      {!isLoading && !errorMessage && alerts.length > 0 && (
        <div className="pf-notification-list">
          {alerts.map((alert) => {
            const tone = getAlertTone(alert.severity);

            return (
              <article className={`pf-alert-item pf-alert-${tone}`} key={alert.id}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  {getAlertIcon(tone)}
                </span>

                <div>
                  <div className="pf-alert-title-row">
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
      )}

      <div className="pf-popover-footer">
        <button
          className="pf-secondary-button"
          type="button"
          onClick={() => void loadNotifications()}
          disabled={isLoading}
        >
          Refresh
        </button>
        <button className="pf-view-link" type="button" onClick={handleOpenMonitoring}>
          Open Monitoring
        </button>
      </div>
    </section>
  );
}
