import { Fragment, useEffect, useState } from "react";
import { getErrorMessage } from "../api/errors";
import {
  getISPAdminDeviceConnectionLog,
  getISPAdminRouterActionLog,
  getISPAdminUsageRecord,
  listISPAdminDailyUsageByUser,
  listISPAdminDeviceConnectionLogs,
  listISPAdminRouterActionLogs,
  listISPAdminUsageRecords,
} from "../api/ispAdmin";
import type {
  ISPAdminDailyUsageByUser,
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

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
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

function formatJson(value: Record<string, unknown> | null) {
  if (!value) {
    return "-";
  }

  return JSON.stringify(value, null, 2);
}

function DailyUsageByUserTable({
  rows,
}: {
  rows: ISPAdminDailyUsageByUser[];
}) {
  return (
    <div className="pf-table-wrap">
      <table className="pf-usage-records-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Service / Router</th>
            <th>Day</th>
            <th className="pf-total-mb-heading">Total</th>
            <th>Download</th>
            <th>Upload</th>
            <th>Records</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.usage_date}-${row.user_id}-${row.user_subscription_id}-${row.router_id}`}
            >
              <td>
                <strong>{row.user_full_name}</strong>
                <br />
                <span className="muted">{row.user_email}</span>
              </td>
              <td>
                {row.subscription_label ?? "Unlabeled service line"}
                <br />
                <span className="muted">
                  {row.router_name ?? "Unnamed router"} ? {row.router_id.slice(0, 8)}
                </span>
              </td>
              <td className="pf-time-cell">{formatDateLabel(row.usage_date)}</td>
              <td className="pf-total-mb-cell">
                {formatMb(row.totals.total_mb)}
              </td>
              <td>{formatMb(row.totals.download_mb)}</td>
              <td>{formatMb(row.totals.upload_mb)}</td>
              <td>{row.totals.record_count}</td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={7}>
                No daily usage by user yet. Run simulator ingestion or import
                usage data to populate this view.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function UsageRecordsTable({
  records,
  selectedRecord,
  loadingRecordId,
  onViewDetail,
}: {
  records: ISPAdminUsageRecord[];
  selectedRecord: ISPAdminUsageRecord | null;
  loadingRecordId: string | null;
  onViewDetail: (recordId: string) => void;
}) {
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
            <th>Detail</th>
          </tr>
        </thead>

        <tbody>
          {records.map((record) => {
            const isSelected = selectedRecord?.id === record.id;
            const isLoading = loadingRecordId === record.id;
            const detail = isSelected ? selectedRecord : record;

            return (
              <Fragment key={record.id}>
                <tr>
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
                  <td>
                    <button
                      className="small-button"
                      type="button"
                      disabled={isLoading}
                      onClick={() => onViewDetail(record.id)}
                    >
                      {isLoading
                        ? "Loading..."
                        : isSelected
                          ? "Hide"
                          : "View"}
                    </button>
                  </td>
                </tr>

                {isSelected && (
                  <tr>
                    <td colSpan={6}>
                      <div className="pf-inline-detail-panel">
                        <DetailLine label="Usage record ID" value={detail.id} />
                        <DetailLine label="User ID" value={detail.user_id} />
                        <DetailLine
                          label="Subscription ID"
                          value={detail.user_subscription_id}
                        />
                        <DetailLine label="Router ID" value={detail.router_id} />
                        <DetailLine label="Device ID" value={detail.device_id} />
                        <DetailLine label="Created" value={formatDateTime(detail.created_at)} />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}

          {records.length === 0 && (
            <tr>
              <td colSpan={6}>
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
  selectedLog,
  loadingLogId,
  onViewDetail,
}: {
  logs: ISPAdminDeviceConnectionLog[];
  selectedLog: ISPAdminDeviceConnectionLog | null;
  loadingLogId: string | null;
  onViewDetail: (logId: string) => void;
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
            <th>Detail</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => {
            const isSelected = selectedLog?.id === log.id;
            const isLoading = loadingLogId === log.id;
            const detail = isSelected ? selectedLog : log;

            return (
              <Fragment key={log.id}>
                <tr>
                  <td>{log.event_type}</td>
                  <td>{log.ip_address ?? "-"}</td>
                  <td>{log.details ?? "-"}</td>
                  <td>{formatDateTime(log.event_time)}</td>
                  <td>
                    <button
                      className="small-button"
                      type="button"
                      disabled={isLoading}
                      onClick={() => onViewDetail(log.id)}
                    >
                      {isLoading
                        ? "Loading..."
                        : isSelected
                          ? "Hide"
                          : "View"}
                    </button>
                  </td>
                </tr>

                {isSelected && (
                  <tr>
                    <td colSpan={5}>
                      <div className="pf-inline-detail-panel">
                        <DetailLine label="Connection log ID" value={detail.id} />
                        <DetailLine label="Device ID" value={detail.device_id} />
                        <DetailLine label="Router ID" value={detail.router_id} />
                        <DetailLine label="Event type" value={detail.event_type} />
                        <DetailLine label="IP address" value={detail.ip_address} />
                        <DetailLine label="Details" value={detail.details} />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}

          {logs.length === 0 && (
            <tr>
              <td colSpan={5}>
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
  selectedLog,
  loadingLogId,
  onViewDetail,
}: {
  logs: ISPAdminRouterActionLog[];
  selectedLog: ISPAdminRouterActionLog | null;
  loadingLogId: string | null;
  onViewDetail: (logId: string) => void;
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
            <th>Detail</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => {
            const isSelected = selectedLog?.id === log.id;
            const isLoading = loadingLogId === log.id;
            const detail = isSelected ? selectedLog : log;

            return (
              <Fragment key={log.id}>
                <tr>
                  <td>{log.action_type}</td>
                  <td>
                    <span className={`status-pill ${getLogStatusClass(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="pf-log-message-cell">{log.error_message ?? "-"}</td>
                  <td className="pf-time-cell">{formatDateTime(log.executed_at)}</td>
                  <td>
                    <button
                      className="small-button"
                      type="button"
                      disabled={isLoading}
                      onClick={() => onViewDetail(log.id)}
                    >
                      {isLoading
                        ? "Loading..."
                        : isSelected
                          ? "Hide"
                          : "View"}
                    </button>
                  </td>
                </tr>

                {isSelected && (
                  <tr>
                    <td colSpan={5}>
                      <div className="pf-inline-detail-panel">
                        <DetailLine label="Action log ID" value={detail.id} />
                        <DetailLine label="Router ID" value={detail.router_id} />
                        <DetailLine label="Policy ID" value={detail.policy_id} />
                        <DetailLine label="Action type" value={detail.action_type} />
                        <DetailLine label="Status" value={detail.status} />
                        <DetailLine label="Error" value={detail.error_message} />
                        <small>
                          <strong>Command payload:</strong>
                        </small>
                        <pre className="pf-json-preview">
                          {formatJson(detail.command_payload)}
                        </pre>
                        <small>
                          <strong>Response payload:</strong>
                        </small>
                        <pre className="pf-json-preview">
                          {formatJson(detail.response_payload)}
                        </pre>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}

          {logs.length === 0 && (
            <tr>
              <td colSpan={5}>
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
  const [dailyUsageByUserRows, setDailyUsageByUserRows] = useState<
    ISPAdminDailyUsageByUser[]
  >([]);
  const [usageRecords, setUsageRecords] = useState<ISPAdminUsageRecord[]>([]);
  const [connectionLogs, setConnectionLogs] = useState<
    ISPAdminDeviceConnectionLog[]
  >([]);
  const [routerActionLogs, setRouterActionLogs] = useState<
    ISPAdminRouterActionLog[]
  >([]);

  const [selectedUsageRecord, setSelectedUsageRecord] =
    useState<ISPAdminUsageRecord | null>(null);
  const [selectedConnectionLog, setSelectedConnectionLog] =
    useState<ISPAdminDeviceConnectionLog | null>(null);
  const [selectedRouterActionLog, setSelectedRouterActionLog] =
    useState<ISPAdminRouterActionLog | null>(null);

  const [loadingUsageRecordId, setLoadingUsageRecordId] = useState<string | null>(
    null
  );
  const [loadingConnectionLogId, setLoadingConnectionLogId] = useState<
    string | null
  >(null);
  const [loadingRouterActionLogId, setLoadingRouterActionLogId] = useState<
    string | null
  >(null);

  const [routerActionStatus, setRouterActionStatus] = useState<
    RouterActionLogStatus | "all"
  >("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadNetworkActivity() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [dailyByUserData, usageData, connectionData, actionData] =
        await Promise.all([
          listISPAdminDailyUsageByUser({ days: 7 }),
          listISPAdminUsageRecords(8),
          listISPAdminDeviceConnectionLogs(8),
          listISPAdminRouterActionLogs(
            routerActionStatus === "all" ? null : routerActionStatus,
            8
          ),
        ]);

      setDailyUsageByUserRows(dailyByUserData);
      setUsageRecords(usageData);
      setConnectionLogs(connectionData);
      setRouterActionLogs(actionData);
      setSelectedUsageRecord(null);
      setSelectedConnectionLog(null);
      setSelectedRouterActionLog(null);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load network activity data.")
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleViewUsageRecord(recordId: string) {
    if (selectedUsageRecord?.id === recordId) {
      setSelectedUsageRecord(null);
      return;
    }

    setLoadingUsageRecordId(recordId);
    setErrorMessage("");

    try {
      const record = await getISPAdminUsageRecord(recordId);
      setSelectedUsageRecord(record);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load usage record details.")
      );
    } finally {
      setLoadingUsageRecordId(null);
    }
  }

  async function handleViewConnectionLog(logId: string) {
    if (selectedConnectionLog?.id === logId) {
      setSelectedConnectionLog(null);
      return;
    }

    setLoadingConnectionLogId(logId);
    setErrorMessage("");

    try {
      const log = await getISPAdminDeviceConnectionLog(logId);
      setSelectedConnectionLog(log);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load device connection details.")
      );
    } finally {
      setLoadingConnectionLogId(null);
    }
  }

  async function handleViewRouterActionLog(logId: string) {
    if (selectedRouterActionLog?.id === logId) {
      setSelectedRouterActionLog(null);
      return;
    }

    setLoadingRouterActionLogId(logId);
    setErrorMessage("");

    try {
      const log = await getISPAdminRouterActionLog(logId);
      setSelectedRouterActionLog(log);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load router action details.")
      );
    } finally {
      setLoadingRouterActionLogId(null);
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
              <div>
                <h3>Daily Usage by User</h3>
                <p>Last 7 days grouped by App User, service line, and router.</p>
              </div>
            </div>

            <DailyUsageByUserTable rows={dailyUsageByUserRows} />
          </article>

          <article className="pf-network-panel pf-network-panel-wide">
            <div className="pf-monitoring-panel-header">
              <div>
                <h3>Daily Usage by User</h3>
                <p>Last 7 days grouped by App User, service line, and router.</p>
              </div>
            </div>

            <DailyUsageByUserTable rows={dailyUsageByUserRows} />
          </article>

          <article className="pf-network-panel pf-network-panel-wide">
            <div className="pf-monitoring-panel-header">
              <h3>Recent Usage Records</h3>
            </div>

            <UsageRecordsTable
              records={usageRecords}
              selectedRecord={selectedUsageRecord}
              loadingRecordId={loadingUsageRecordId}
              onViewDetail={handleViewUsageRecord}
            />
          </article>

          <article className="pf-network-panel">
            <div className="pf-monitoring-panel-header">
              <h3>Device Connection Logs</h3>
            </div>

            <DeviceConnectionTable
              logs={connectionLogs}
              selectedLog={selectedConnectionLog}
              loadingLogId={loadingConnectionLogId}
              onViewDetail={handleViewConnectionLog}
            />
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

            <RouterActionLogTable
              logs={routerActionLogs}
              selectedLog={selectedRouterActionLog}
              loadingLogId={loadingRouterActionLogId}
              onViewDetail={handleViewRouterActionLog}
            />
          </article>
        </section>
      )}
    </section>
  );
}
