import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/errors";
import {
  listISPAdminDeviceConnectionLogs,
  listISPAdminRouterActionLogs,
  listISPAdminUsageRecords,
} from "../api/ispAdmin";
import type {
  ISPAdminDeviceConnectionLog,
  ISPAdminRouterActionLog,
  ISPAdminUsageRecord,
  RouterActionLogStatus,
} from "../api/ispAdmin";

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

function formatMb(value: string | number | null) {
  if (value === null) {
    return "-";
  }

  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return `${numericValue.toFixed(2)} MB`;
}

function getLogStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "success") {
    return "status-approved";
  }

  if (normalized === "failed") {
    return "status-rejected";
  }

  return "status-pending";
}

function UsageRecordsTable({ records }: { records: ISPAdminUsageRecord[] }) {
  return (
    <div className="pf-table-wrap">
      <table className="pf-usage-records-table">
        <thead>
          <tr>
            <th className="pf-total-mb-heading">Total</th>
            <th>Upload</th>
            <th>Download</th>
            <th>Source</th>
            <th>Period</th>
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td className="pf-total-mb-cell">
                {formatMb(record.total_mb)}
              </td>
              <td>{formatMb(record.upload_mb)}</td>
              <td>{formatMb(record.download_mb)}</td>
              <td>{record.source ?? "-"}</td>
              <td>
                {formatDateTime(record.record_start)}
                <br />
                <span className="muted">to {formatDateTime(record.record_end)}</span>
              </td>
            </tr>
          ))}

          {records.length === 0 && (
            <tr>
              <td colSpan={5}>
                No usage records yet. Seed or import usage data to review ISP
                traffic here.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DeviceConnectionTable({
  logs,
}: {
  logs: ISPAdminDeviceConnectionLog[];
}) {
  return (
    <div className="pf-table-wrap">
      <table className="pf-device-connection-log-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>IP</th>
            <th>Details</th>
            <th>Time</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.event_type}</td>
              <td>{log.ip_address ?? "-"}</td>
              <td>{log.details ?? "-"}</td>
              <td>{formatDateTime(log.event_time)}</td>
            </tr>
          ))}

          {logs.length === 0 && (
            <tr>
              <td colSpan={4}>
                No device connection logs yet. Router or device events will
                appear here after they are recorded.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RouterActionLogTable({
  logs,
}: {
  logs: ISPAdminRouterActionLog[];
}) {
  return (
    <div className="pf-table-wrap">
      <table className="pf-router-action-log-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Status</th>
            <th>Error</th>
            <th>Executed</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.action_type}</td>
              <td>
                <span className={`status-pill ${getLogStatusClass(log.status)}`}>
                  {log.status}
                </span>
              </td>
              <td className="pf-log-message-cell">{log.error_message ?? "-"}</td>
              <td className="pf-time-cell">{formatDateTime(log.executed_at)}</td>
            </tr>
          ))}

          {logs.length === 0 && (
            <tr>
              <td colSpan={4}>
                No router action logs match this filter. Policy actions appear
                here after execution.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ISPAdminNetworkActivityCenter() {
  const [usageRecords, setUsageRecords] = useState<ISPAdminUsageRecord[]>([]);
  const [connectionLogs, setConnectionLogs] = useState<
    ISPAdminDeviceConnectionLog[]
  >([]);
  const [routerActionLogs, setRouterActionLogs] = useState<
    ISPAdminRouterActionLog[]
  >([]);
  const [routerActionStatus, setRouterActionStatus] = useState<
    RouterActionLogStatus | "all"
  >("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadNetworkActivity() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [usageData, connectionData, actionData] = await Promise.all([
        listISPAdminUsageRecords(8),
        listISPAdminDeviceConnectionLogs(8),
        listISPAdminRouterActionLogs(
          routerActionStatus === "all" ? null : routerActionStatus,
          8
        ),
      ]);

      setUsageRecords(usageData);
      setConnectionLogs(connectionData);
      setRouterActionLogs(actionData);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load network activity data.")
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNetworkActivity();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // loadNetworkActivity intentionally stays local to avoid extra renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerActionStatus]);

  return (
    <section className="pf-content-card pf-network-activity-center">
      <div className="pf-panel-title-row">
        <div>
          <h2>Network Activity Center</h2>
          <p>Review usage records, device events, and router policy actions.</p>
        </div>

        <button
          className="pf-view-link pf-refresh-button"
          type="button"
          onClick={() => void loadNetworkActivity()}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {errorMessage && <div className="pf-error-box">{errorMessage}</div>}

      {isLoading && (
        <p className="pf-loading-text">Loading network activity...</p>
      )}

      {!isLoading && (
        <section className="pf-network-grid">
          <article className="pf-network-panel pf-network-panel-wide">
            <div className="pf-monitoring-panel-header">
              <h3>Recent Usage Records</h3>
            </div>

            <UsageRecordsTable records={usageRecords} />
          </article>

          <article className="pf-network-panel">
            <div className="pf-monitoring-panel-header">
              <h3>Device Connection Logs</h3>
            </div>

            <DeviceConnectionTable logs={connectionLogs} />
          </article>

          <article className="pf-network-panel">
            <div className="pf-monitoring-panel-header">
              <h3>Router Action Logs</h3>

              <div className="filter-bar pf-network-filter-bar">
                {(["all", "pending", "success", "failed"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      className={`filter-chip ${
                        routerActionStatus === status ? "active-filter" : ""
                      }`}
                      type="button"
                      onClick={() => setRouterActionStatus(status)}
                    >
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>

            <RouterActionLogTable logs={routerActionLogs} />
          </article>
        </section>
      )}
    </section>
  );
}
