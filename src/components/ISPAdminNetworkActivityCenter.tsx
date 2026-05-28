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

const clippedTextStyle = {
  display: "block",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

const compactCellStyle = {
  minWidth: 0,
  overflow: "hidden",
  verticalAlign: "top",
} as const;

type DailyUsageKindFilter = "all" | "official" | "estimated";

const ADMIN_TABLE_PAGE_SIZE = 5;
const ADMIN_TABLE_QUICK_PAGE_COUNT = 3;

function getPageCount(totalItems: number) {
  return Math.max(1, Math.ceil(totalItems / ADMIN_TABLE_PAGE_SIZE));
}

function paginateRows<T>(rows: T[], page: number) {
  const safePage = Math.min(page, getPageCount(rows.length));
  const start = (safePage - 1) * ADMIN_TABLE_PAGE_SIZE;

  return {
    safePage,
    pageRows: rows.slice(start, start + ADMIN_TABLE_PAGE_SIZE),
    pageCount: getPageCount(rows.length),
  };
}

function AdminTablePagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const safePage = Math.min(page, pageCount);
  const visiblePages = Array.from(
    { length: Math.min(ADMIN_TABLE_QUICK_PAGE_COUNT, pageCount) },
    (_, index) => index + 1
  );

  return (
    <div className="pf-admin-pagination">
      <button
        className="small-button"
        type="button"
        disabled={safePage <= 1}
        onClick={() => onPageChange(Math.max(safePage - 1, 1))}
      >
        Previous
      </button>

      {visiblePages.map((pageNumber) => (
        <button
          key={pageNumber}
          className={
            pageNumber === safePage
              ? "small-button pf-admin-page-button-active"
              : "small-button"
          }
          type="button"
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </button>
      ))}

      <button
        className="small-button"
        type="button"
        disabled={safePage >= pageCount}
        onClick={() => onPageChange(Math.min(safePage + 1, pageCount))}
      >
        Next
      </button>
    </div>
  );
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

function getUsageKindLabel(kind: string | null | undefined) {
  return kind === "official" ? "Official" : "Estimated";
}

function getUsageKindHelp(kind: string | null | undefined) {
  return kind === "official"
    ? "Official router/subscription total"
    : "Estimated router/CPE device total";
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
      <table
        className="pf-usage-records-table"
        style={{ tableLayout: "fixed", width: "100%" }}
      >
        <thead>
          <tr>
            <th style={{ width: "15%" }}>User</th>
            <th style={{ width: "15%" }}>Service / Router</th>
            <th style={{ width: "10%" }}>Kind</th>
            <th style={{ width: "11%" }}>Day</th>
            <th className="pf-total-mb-heading" style={{ width: "13%" }}>
              Total
            </th>
            <th style={{ width: "13%" }}>Download</th>
            <th style={{ width: "13%" }}>Upload</th>
            <th style={{ width: "9%" }}>Records</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const routerLabel = row.router_name ?? "Unnamed router";
            const routerIdPrefix = row.router_id.slice(0, 8);
            const serviceLabel =
              row.subscription_label ?? "Unlabeled service line";

            return (
              <tr
                key={`${row.usage_date}-${row.user_id}-${row.user_subscription_id}-${row.router_id}`}
              >
                <td style={compactCellStyle}>
                  <strong
                    title={row.user_full_name}
                    style={{ ...clippedTextStyle, fontWeight: 900 }}
                  >
                    {row.user_full_name}
                  </strong>
                  <span
                    className="muted"
                    title={row.user_email}
                    style={{
                      ...clippedTextStyle,
                      marginTop: 4,
                      fontSize: "0.82rem",
                      fontWeight: 700,
                    }}
                  >
                    {row.user_email}
                  </span>
                </td>

                <td style={compactCellStyle}>
                  <strong
                    title={serviceLabel}
                    style={{ ...clippedTextStyle, fontWeight: 900 }}
                  >
                    {serviceLabel}
                  </strong>
                  <span
                    className="muted"
                    title={`${routerLabel} ID ${routerIdPrefix}`}
                    style={{
                      ...clippedTextStyle,
                      marginTop: 4,
                      fontSize: "0.82rem",
                      fontWeight: 700,
                    }}
                  >
                    {routerLabel} ID {routerIdPrefix}
                  </span>
                </td>

                <td style={compactCellStyle}>
                  <strong
                    title={row.usage_note ?? getUsageKindHelp(row.usage_kind)}
                    style={{
                      ...clippedTextStyle,
                      fontWeight: 900,
                      color: row.usage_kind === "official" ? "#8ee6b7" : "#f5c36b",
                    }}
                  >
                    {getUsageKindLabel(row.usage_kind)}
                  </strong>
                  <span
                    className="muted"
                    title={row.usage_note ?? getUsageKindHelp(row.usage_kind)}
                    style={{
                      ...clippedTextStyle,
                      marginTop: 4,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                    }}
                  >
                    {row.usage_kind === "official" ? "Service total" : "Device estimate"}
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
            );
          })}

          {rows.length === 0 && (
            <tr>
              <td colSpan={8}>
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
  const [dailyUsageKindFilter, setDailyUsageKindFilter] =
    useState<DailyUsageKindFilter>("all");
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
  const [dailyUsagePage, setDailyUsagePage] = useState(1);
  const [usageRecordsPage, setUsageRecordsPage] = useState(1);
  const [connectionLogsPage, setConnectionLogsPage] = useState(1);
  const [routerActionLogsPage, setRouterActionLogsPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadNetworkActivity() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [dailyByUserData, usageData, connectionData, actionData] =
        await Promise.all([
          listISPAdminDailyUsageByUser({ days: 7 }),
          listISPAdminUsageRecords(50),
          listISPAdminDeviceConnectionLogs(50),
          listISPAdminRouterActionLogs(
            routerActionStatus === "all" ? null : routerActionStatus,
            50
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

  const visibleDailyUsageByUserRows = dailyUsageByUserRows.filter((row) => {
    if (dailyUsageKindFilter === "all") {
      return true;
    }

    return row.usage_kind === dailyUsageKindFilter;
  });

  const dailyUsagePagination = paginateRows(
    visibleDailyUsageByUserRows,
    dailyUsagePage
  );
  const usageRecordsPagination = paginateRows(usageRecords, usageRecordsPage);
  const connectionLogsPagination = paginateRows(connectionLogs, connectionLogsPage);
  const routerActionLogsPagination = paginateRows(
    routerActionLogs,
    routerActionLogsPage
  );

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
                <p>Last 7 days by user, service line, router, and usage type.</p>
              </div>
            </div>

            <div
              className="pf-daily-usage-controls"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 16,
                flexWrap: "wrap",
                padding: "14px 0 18px",
              }}
            >
<div
                className="filter-bar pf-network-filter-bar"
                style={{
                  marginLeft: "auto",
                  gap: 10,
                }}
              >
                {(["all", "official", "estimated"] as const).map((kind) => (
                  <button
                    key={kind}
                    className={`filter-chip ${
                      dailyUsageKindFilter === kind ? "active-filter" : ""
                    }`}
                    type="button"
                    onClick={() => setDailyUsageKindFilter(kind)}
                  >
                    {kind === "all"
                      ? `All (${dailyUsageByUserRows.length})`
                      : `${kind[0].toUpperCase()}${kind.slice(1)} (${
                          dailyUsageByUserRows.filter(
                            (row) => row.usage_kind === kind
                          ).length
                        })`}
                  </button>
                ))}
              </div>
            </div>

            <DailyUsageByUserTable rows={dailyUsagePagination.pageRows} />
            <AdminTablePagination
              page={dailyUsagePagination.safePage}
              pageCount={dailyUsagePagination.pageCount}
              onPageChange={setDailyUsagePage}
            />
          </article>

          <article className="pf-network-panel pf-network-panel-wide">
            <div className="pf-monitoring-panel-header">
              <h3>Recent Usage Records</h3>
            </div>

            <UsageRecordsTable
              records={usageRecordsPagination.pageRows}
              selectedRecord={selectedUsageRecord}
              loadingRecordId={loadingUsageRecordId}
              onViewDetail={handleViewUsageRecord}
            />
            <AdminTablePagination
              page={usageRecordsPagination.safePage}
              pageCount={usageRecordsPagination.pageCount}
              onPageChange={setUsageRecordsPage}
            />
          </article>

          <article className="pf-network-panel">
            <div className="pf-monitoring-panel-header">
              <h3>Device Connection Logs</h3>
            </div>

            <DeviceConnectionTable
              logs={connectionLogsPagination.pageRows}
              selectedLog={selectedConnectionLog}
              loadingLogId={loadingConnectionLogId}
              onViewDetail={handleViewConnectionLog}
            />
            <AdminTablePagination
              page={connectionLogsPagination.safePage}
              pageCount={connectionLogsPagination.pageCount}
              onPageChange={setConnectionLogsPage}
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
                      onClick={() => {
                        setRouterActionLogsPage(1);
                        setRouterActionStatus(status);
                      }}
                    >
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>

            <RouterActionLogTable
              logs={routerActionLogsPagination.pageRows}
              selectedLog={selectedRouterActionLog}
              loadingLogId={loadingRouterActionLogId}
              onViewDetail={handleViewRouterActionLog}
            />
            <AdminTablePagination
              page={routerActionLogsPagination.safePage}
              pageCount={routerActionLogsPagination.pageCount}
              onPageChange={setRouterActionLogsPage}
            />
          </article>
        </section>
      )}
    </section>
  );
}
