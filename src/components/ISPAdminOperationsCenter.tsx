import { Fragment, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../api/errors";
import {
  createISPAdminReport,
  getISPAdminReport,
  getPlanChangeRequest,
  listISPAdminAppUsers,
  listISPAdminReports,
  listPlanChangeRequests,
  listRouters,
  listSubscriptionPlans,
  listUserSubscriptions,
  reviewPlanChangeRequest,
} from "../api/ispAdmin";
import type {
  AppUser,
  ISPAdminPlanChangeRequest,
  ISPAdminReport,
  ISPAdminReportType,
  ISPAdminRouter,
  PlanChangeRequestStatus,
  SubscriptionPlan,
  UserSubscription,
} from "../api/ispAdmin";

const reportTypes: { label: string; value: ISPAdminReportType }[] = [
  { label: "Usage", value: "usage_report" },
  { label: "Devices", value: "device_report" },
  { label: "Alerts", value: "alert_report" },
  { label: "Recommendations", value: "recommendation_report" },
  { label: "Network", value: "network_performance_report" },
];

const requestFilters: { label: string; value: PlanChangeRequestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Completed", value: "completed" },
];

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

function formatReportType(value: string) {
  return value.replaceAll("_", " ");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function formatJson(value: unknown) {
  if (!value) {
    return "-";
  }

  return JSON.stringify(value, null, 2);
}

function safeReportFileName(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "pulsefi-report";
}

function downloadTextFile(filename: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function getReportInsights(report: ISPAdminReport) {
  const insights = report.report_data?.insights;

  if (!Array.isArray(insights)) {
    return [];
  }

  return insights.filter(
    (item): item is Record<string, unknown> =>
      item !== null && typeof item === "object" && !Array.isArray(item)
  );
}

function getReportTableEntries(report: ISPAdminReport) {
  const tables = report.report_data?.tables;

  if (!tables || typeof tables !== "object" || Array.isArray(tables)) {
    return [];
  }

  return Object.entries(tables as Record<string, unknown>)
    .map(([key, value]) => {
      const rows = Array.isArray(value)
        ? value.filter(
            (row): row is Record<string, unknown> =>
              row !== null && typeof row === "object" && !Array.isArray(row)
          )
        : [];

      return { key, rows };
    })
    .filter((entry) => entry.rows.length > 0);
}

function getReportTableHeaders(rows: Record<string, unknown>[]) {
  return Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).slice(0, 8);
}

function escapeHtml(value: unknown) {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildPrintableReportHtml(report: ISPAdminReport) {
  const metrics = getReportMetricEntries(report);
  const insights = getReportInsights(report);
  const tables = getReportTableEntries(report);

  const metricHtml = metrics.length
    ? `<section class="metrics">${metrics
        .map(
          ([key, value]) =>
            `<article><span>${escapeHtml(formatReportType(key))}</span><strong>${escapeHtml(
              formatValue(value)
            )}</strong></article>`
        )
        .join("")}</section>`
    : `<p class="muted">No simple summary metrics available.</p>`;

  const insightHtml = insights.length
    ? `<section><h2>Insights</h2>${insights
        .map(
          (insight) =>
            `<div class="insight"><strong>${escapeHtml(
              insight.severity ?? "info"
            )}</strong><p>${escapeHtml(insight.message ?? "-")}</p></div>`
        )
        .join("")}</section>`
    : "";

  const tableHtml = tables.length
    ? `<section><h2>Tables</h2>${tables
        .map((entry) => {
          const headers = getReportTableHeaders(entry.rows);

          return `<div class="table-section">
            <h3>${escapeHtml(formatReportType(entry.key))}</h3>
            <table>
              <thead>
                <tr>${headers
                  .map((header) => `<th>${escapeHtml(formatReportType(header))}</th>`)
                  .join("")}</tr>
              </thead>
              <tbody>
                ${entry.rows
                  .map(
                    (row) =>
                      `<tr>${headers
                        .map((header) => `<td>${escapeHtml(formatValue(row[header]))}</td>`)
                        .join("")}</tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>`;
        })
        .join("")}</section>`
    : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 14mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #0f172a;
      font-family: Inter, Arial, sans-serif;
      background: #ffffff;
      font-size: 12px;
    }

    header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 18px;
    }

    h1 {
      margin: 0;
      font-size: 24px;
    }

    h2 {
      margin: 22px 0 10px;
      font-size: 16px;
    }

    h3 {
      margin: 16px 0 8px;
      font-size: 13px;
    }

    .muted {
      color: #64748b;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 18px;
    }

    .metrics article,
    .insight {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px;
      background: #f8fafc;
    }

    .metrics span {
      display: block;
      color: #64748b;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .metrics strong {
      display: block;
      margin-top: 5px;
      font-size: 15px;
      overflow-wrap: anywhere;
    }

    .insight {
      margin-bottom: 8px;
    }

    .insight strong {
      text-transform: uppercase;
      font-size: 11px;
    }

    .insight p {
      margin: 5px 0 0;
    }

    .table-section {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-top: 12px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-bottom: 14px;
    }

    th,
    td {
      border: 1px solid #e2e8f0;
      padding: 7px 8px;
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    footer {
      margin-top: 22px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <header>
    <div>
      <p class="muted">PulseFi ISP Admin Report</p>
      <h1>${escapeHtml(report.title)}</h1>
      <p class="muted">${escapeHtml(formatReportType(report.report_type))}</p>
    </div>
    <div>
      <p><strong>Created:</strong> ${escapeHtml(formatDateTime(report.created_at))}</p>
      <p><strong>Period:</strong> ${escapeHtml(report.period_start ?? "Any")} → ${escapeHtml(
        report.period_end ?? "Any"
      )}</p>
    </div>
  </header>

  ${metricHtml}
  ${insightHtml}
  ${tableHtml}

  <footer>
    Generated by PulseFi. Technical JSON is available through Export JSON in the admin dashboard.
  </footer>

  <script>
    window.addEventListener("load", () => {
      window.focus();
      window.print();
    });
  </script>
</body>
</html>`;
}

function printReport(report: ISPAdminReport) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    window.alert("Popup blocked. Allow popups for this site, then try Print again.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildPrintableReportHtml(report));
  printWindow.document.close();
}

function DetailLine({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <small>
      <strong>{label}:</strong> {value ?? "-"}
    </small>
  );
}

function getReportMetricEntries(report: ISPAdminReport | null) {
  if (!report?.report_data) {
    return [];
  }

  const data = report.report_data;
  const summary =
    data.summary && typeof data.summary === "object"
      ? (data.summary as Record<string, unknown>)
      : null;

  if (summary) {
    return Object.entries(summary).filter(
      ([, value]) =>
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    );
  }

  return Object.entries(data).filter(
    ([key, value]) =>
      key !== "summary_type" &&
      (value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean")
  );
}

function ReportDetailPanel({ report }: { report: ISPAdminReport }) {
  const metricEntries = getReportMetricEntries(report);
  const insights = getReportInsights(report);
  const tableEntries = getReportTableEntries(report);

  function handleExportJson() {
    downloadTextFile(
      `${safeReportFileName(report.title)}.json`,
      JSON.stringify(report.report_data ?? {}, null, 2),
      "application/json"
    );
  }

  function handlePrintReport() {
    printReport(report);
  }

  return (
    <div className="pf-report-detail-panel">
      <div className="pf-report-detail-header">
        <div>
          <p className="eyebrow">Generated report</p>
          <h3>{report.title}</h3>
          <p className="muted">
            {formatReportType(report.report_type)} · Created{" "}
            {formatDateTime(report.created_at)}
          </p>
        </div>

        <div className="pf-row-action-stack">
          <span className="status-pill status-active">Stored</span>
          <button className="small-button" type="button" onClick={handleExportJson}>
            Export JSON
          </button>
          <button className="small-button" type="button" onClick={handlePrintReport}>
            Print
          </button>
        </div>
      </div>

      {metricEntries.length ? (
        <div className="pf-report-metric-grid">
          {metricEntries.map(([key, value]) => (
            <div className="pf-report-metric" key={key}>
              <span>{formatReportType(key)}</span>
              <strong>{formatValue(value)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="pf-empty-state">
          <span className="material-symbols-outlined">analytics</span>
          <h3>No simple summary metrics</h3>
          <p>Open the raw report data below to inspect this report.</p>
        </div>
      )}

      {insights.length ? (
        <section className="pf-report-insights">
          <h4>Report insights</h4>
          {insights.map((insight, index) => (
            <div className="pf-inline-detail-panel" key={`${insight.message ?? index}`}>
              <DetailLine
                label="Severity"
                value={String(insight.severity ?? "info")}
              />
              <DetailLine
                label="Insight"
                value={String(insight.message ?? "-")}
              />
            </div>
          ))}
        </section>
      ) : null}

      {tableEntries.length ? (
        <section className="pf-report-tables">
          <h4>Report tables</h4>
          {tableEntries.map((entry) => {
            const headers = getReportTableHeaders(entry.rows);

            return (
              <div className="pf-operations-table-panel" key={entry.key}>
                <div className="pf-monitoring-panel-header">
                  <h3>{formatReportType(entry.key)}</h3>
                </div>

                <div className="pf-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {headers.map((header) => (
                          <th key={header}>{formatReportType(header)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entry.rows.map((row, rowIndex) => (
                        <tr key={`${entry.key}-${rowIndex}`}>
                          {headers.map((header) => (
                            <td key={header}>{formatValue(row[header])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      {report.report_data ? (
        <details className="pf-report-json-details">
          <summary>Technical details: raw report data</summary>
          <pre className="pf-json-preview">{formatJson(report.report_data)}</pre>
        </details>
      ) : (
        <p className="muted">This report has no stored report data.</p>
      )}
    </div>
  );
}

function RequestReviewActions({
  request,
  onReviewed,
}: {
  request: ISPAdminPlanChangeRequest;
  onReviewed: () => Promise<void>;
}) {
  const [adminResponse, setAdminResponse] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  async function handleReview(decision: "approve" | "reject") {
    setErrorMessage("");
    setIsReviewing(true);

    try {
      await reviewPlanChangeRequest(
        request.id,
        decision,
        adminResponse.trim() || null
      );
      setAdminResponse("");
      await onReviewed();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not review plan change request.")
      );
    } finally {
      setIsReviewing(false);
    }
  }

  if (request.status !== "pending") {
    return <span className="muted">No action</span>;
  }

  return (
    <div className="pf-review-actions">
      <textarea
        value={adminResponse}
        onChange={(event) => setAdminResponse(event.target.value)}
        placeholder="Optional response to the user"
      />

      {errorMessage && <div className="pf-error-box">{errorMessage}</div>}

      <div>
        <button
          className="small-button"
          type="button"
          disabled={isReviewing}
          onClick={() => void handleReview("approve")}
        >
          Approve
        </button>

        <button
          className="small-button danger-button"
          type="button"
          disabled={isReviewing}
          onClick={() => void handleReview("reject")}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export function ISPAdminOperationsCenter() {
  const [reports, setReports] = useState<ISPAdminReport[]>([]);
  const [requests, setRequests] = useState<ISPAdminPlanChangeRequest[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [routers, setRouters] = useState<ISPAdminRouter[]>([]);

  const [selectedRequest, setSelectedRequest] =
    useState<ISPAdminPlanChangeRequest | null>(null);
  const [selectedReport, setSelectedReport] = useState<ISPAdminReport | null>(
    null
  );

  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);

  const [reportType, setReportType] =
    useState<ISPAdminReportType>("usage_report");
  const [reportTitle, setReportTitle] = useState("");
  const [reportPeriodStart, setReportPeriodStart] = useState("");
  const [reportPeriodEnd, setReportPeriodEnd] = useState("");
  const [requestFilter, setRequestFilter] =
    useState<PlanChangeRequestStatus | "all">("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const userById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user]));
  }, [users]);

  const subscriptionById = useMemo(() => {
    return new Map(
      subscriptions.map((subscription) => [subscription.id, subscription])
    );
  }, [subscriptions]);

  const planById = useMemo(() => {
    return new Map(plans.map((plan) => [plan.id, plan]));
  }, [plans]);

  const routerByServiceLineId = useMemo(() => {
    const map = new Map<string, ISPAdminRouter>();

    for (const router of routers) {
      if (router.user_subscription_id) {
        map.set(router.user_subscription_id, router);
      }
    }

    return map;
  }, [routers]);

  function getRequestContext(request: ISPAdminPlanChangeRequest) {
    const user = userById.get(request.user_id);
    const subscription = subscriptionById.get(request.user_subscription_id);
    const router = routerByServiceLineId.get(request.user_subscription_id);
    const currentPlan = planById.get(request.current_plan_id);
    const requestedPlan = request.requested_plan_id
      ? planById.get(request.requested_plan_id)
      : null;

    return {
      userName: user?.full_name ?? request.user_id,
      userEmail: user?.email ?? null,
      serviceLabel:
        subscription?.subscription_label ??
        router?.router_name ??
        request.user_subscription_id,
      routerName: router?.router_name ?? "-",
      currentPlanName: currentPlan?.plan_name ?? request.current_plan_id,
      requestedPlanName: requestedPlan?.plan_name ?? request.requested_plan_id ?? "-",
    };
  }

  async function loadOperationsData() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [
        reportData,
        requestData,
        userData,
        subscriptionData,
        planData,
        routerData,
      ] = await Promise.all([
        listISPAdminReports(null, 10),
        listPlanChangeRequests(
          requestFilter === "all" ? null : requestFilter,
          10
        ),
        listISPAdminAppUsers(null, 100),
        listUserSubscriptions(null, null, 100),
        listSubscriptionPlans(null, 100),
        listRouters(null, null, 100),
      ]);

      setReports(reportData);
      setRequests(requestData);
      setUsers(userData);
      setSubscriptions(subscriptionData);
      setPlans(planData);
      setRouters(routerData);
      setSelectedRequest(null);
      setSelectedReport(null);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load operations data.")
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleViewRequestDetail(requestId: string) {
    if (selectedRequest?.id === requestId) {
      setSelectedRequest(null);
      return;
    }

    setLoadingRequestId(requestId);
    setErrorMessage("");

    try {
      const request = await getPlanChangeRequest(requestId);
      setSelectedRequest(request);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load plan-change request details.")
      );
    } finally {
      setLoadingRequestId(null);
    }
  }

  async function handleViewReportDetail(reportId: string) {
    if (selectedReport?.id === reportId) {
      setSelectedReport(null);
      return;
    }

    setLoadingReportId(reportId);
    setErrorMessage("");

    try {
      const report = await getISPAdminReport(reportId);
      setSelectedReport(report);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load report details."));
    } finally {
      setLoadingReportId(null);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOperationsData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // loadOperationsData intentionally stays local to avoid extra renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestFilter]);

  async function handleGenerateReport() {
    setErrorMessage("");
    setSuccessMessage("");
    setIsGeneratingReport(true);

    try {
      const report = await createISPAdminReport({
        report_type: reportType,
        title: reportTitle.trim() || null,
        period_start: reportPeriodStart || null,
        period_end: reportPeriodEnd || null,
      });

      setReportTitle("");
      setSelectedReport(report);
      setSuccessMessage(`Generated report: ${report.title}`);
      await loadOperationsData();
      setSelectedReport(report);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not generate report."));
    } finally {
      setIsGeneratingReport(false);
    }
  }

  return (
    <section className="pf-content-card pf-operations-center">
      <div className="pf-panel-title-row">
        <div>
          <h2>Operations Center</h2>
          <p>
            Generate useful reports and review customer service/package requests.
          </p>
        </div>

        <button
          className="pf-view-link pf-refresh-button"
          type="button"
          onClick={() => void loadOperationsData()}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {errorMessage && <div className="pf-error-box">{errorMessage}</div>}
      {successMessage && <div className="pf-success-box">{successMessage}</div>}

      <section className="pf-operations-grid">
        <div className="pf-operations-panel">
          <h3>Generate report</h3>
          <p>
            Create a stored backend report and inspect the generated report data
            directly in this screen.
          </p>

          <label>
            Report type
            <select
              value={reportType}
              onChange={(event) =>
                setReportType(event.target.value as ISPAdminReportType)
              }
            >
              {reportTypes.map((type) => (
                <option value={type.value} key={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Optional title
            <input
              value={reportTitle}
              onChange={(event) => setReportTitle(event.target.value)}
              placeholder="May 2026 usage summary"
            />
          </label>

          <div className="pf-operations-filter-bar">
            <label>
              Period start
              <input
                type="date"
                value={reportPeriodStart}
                onChange={(event) => setReportPeriodStart(event.target.value)}
              />
            </label>

            <label>
              Period end
              <input
                type="date"
                value={reportPeriodEnd}
                onChange={(event) => setReportPeriodEnd(event.target.value)}
              />
            </label>
          </div>

          <button
            className="pf-action-button"
            type="button"
            disabled={isGeneratingReport}
            onClick={() => void handleGenerateReport()}
          >
            {isGeneratingReport ? "Generating..." : "Generate report"}
          </button>
        </div>

        <div className="pf-operations-panel">
          <h3>Plan request filter</h3>
          <p>Review pending requests or inspect previous decisions.</p>

          <div className="filter-bar pf-operations-filter-bar">
            {requestFilters.map((filter) => (
              <button
                key={filter.value}
                className={`filter-chip ${
                  requestFilter === filter.value ? "active-filter" : ""
                }`}
                type="button"
                onClick={() => setRequestFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {selectedReport ? <ReportDetailPanel report={selectedReport} /> : null}

      {isLoading && <p className="pf-loading-text">Loading operations...</p>}

      {!isLoading && (
        <section className="pf-operations-split">
          <div className="pf-operations-table-panel">
            <div className="pf-monitoring-panel-header">
              <h3>Recent reports</h3>
            </div>

            <div className="pf-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.title}</td>
                      <td>{formatReportType(report.report_type)}</td>
                      <td>{formatDateTime(report.created_at)}</td>
                      <td>
                        <button
                          className="small-button"
                          type="button"
                          disabled={loadingReportId === report.id}
                          onClick={() => void handleViewReportDetail(report.id)}
                        >
                          {loadingReportId === report.id
                            ? "Loading..."
                            : selectedReport?.id === report.id
                              ? "Hide report"
                              : "View report"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        No reports yet. Generate a report above to populate this
                        list.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pf-operations-table-panel pf-operations-table-panel-service">
            <div className="pf-monitoring-panel-header">
              <h3>Service requests</h3>
            </div>

            <div className="pf-table-wrap">
              <table className="pf-service-requests-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Router</th>
                    <th>Current package</th>
                    <th>Requested package</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => {
                    const isSelected = selectedRequest?.id === request.id;
                    const isLoadingDetail = loadingRequestId === request.id;
                    const detail = isSelected ? selectedRequest : request;
                    const context = getRequestContext(detail);

                    return (
                      <Fragment key={request.id}>
                        <tr>
                          <td>
                            <strong>{context.userName}</strong>
                            {context.userEmail ? (
                              <small className="pf-block-muted">
                                {context.userEmail}
                              </small>
                            ) : null}
                          </td>
                          <td>{context.routerName}</td>
                          <td>{context.currentPlanName}</td>
                          <td>{context.requestedPlanName}</td>
                          <td>
                            <span className={`status-pill status-${request.status}`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="pf-request-reason-cell">
                            {request.reason ?? "-"}
                          </td>
                          <td className="pf-service-request-action-cell">
                            <div className="pf-row-action-stack">
                              <button
                                className="small-button"
                                type="button"
                                disabled={isLoadingDetail}
                                onClick={() => void handleViewRequestDetail(request.id)}
                              >
                                {isLoadingDetail
                                  ? "Loading..."
                                  : isSelected
                                    ? "Hide details"
                                    : "View details"}
                              </button>

                              <RequestReviewActions
                                request={request}
                                onReviewed={loadOperationsData}
                              />
                            </div>
                          </td>
                        </tr>

                        {isSelected && (
                          <tr>
                            <td colSpan={7}>
                              <div className="pf-inline-detail-panel">
                                <DetailLine label="Request ID" value={detail.id} />
                                <DetailLine label="App User" value={context.userName} />
                                <DetailLine label="Router" value={context.routerName} />
                                <DetailLine
                                  label="Service line"
                                  value={context.serviceLabel}
                                />
                                <DetailLine
                                  label="Current package"
                                  value={context.currentPlanName}
                                />
                                <DetailLine
                                  label="Requested package"
                                  value={context.requestedPlanName}
                                />
                                <DetailLine label="Request type" value={detail.request_type} />
                                <DetailLine label="Reason" value={detail.reason} />
                                <DetailLine
                                  label="Requested at"
                                  value={formatDateTime(detail.requested_at)}
                                />
                                <DetailLine
                                  label="Reviewed by"
                                  value={detail.reviewed_by_admin_id}
                                />
                                <DetailLine
                                  label="Reviewed at"
                                  value={formatDateTime(detail.reviewed_at)}
                                />
                                <DetailLine
                                  label="Admin response"
                                  value={detail.admin_response}
                                />
                                <DetailLine
                                  label="Updated"
                                  value={formatDateTime(detail.updated_at)}
                                />

                                <details className="pf-technical-id-details">
                                  <summary>Technical IDs</summary>
                                  <DetailLine label="User ID" value={detail.user_id} />
                                  <DetailLine
                                    label="Subscription ID"
                                    value={detail.user_subscription_id}
                                  />
                                  <DetailLine
                                    label="Current plan ID"
                                    value={detail.current_plan_id}
                                  />
                                  <DetailLine
                                    label="Requested plan ID"
                                    value={detail.requested_plan_id}
                                  />
                                  <DetailLine
                                    label="Recommendation ID"
                                    value={detail.recommendation_id}
                                  />
                                </details>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}

                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        No service requests match this filter. Customer requests
                        appear here when App Users submit them.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
