import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/errors";
import {
  createISPAdminReport,
  listISPAdminReports,
  listPlanChangeRequests,
  reviewPlanChangeRequest,
} from "../api/ispAdmin";
import type {
  ISPAdminPlanChangeRequest,
  ISPAdminReport,
  ISPAdminReportType,
  PlanChangeRequestStatus,
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
    <div className="stitch-review-actions">
      <textarea
        value={adminResponse}
        onChange={(event) => setAdminResponse(event.target.value)}
        placeholder="Optional response to the user"
      />

      {errorMessage && <div className="stitch-error-box">{errorMessage}</div>}

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
  const [reportType, setReportType] =
    useState<ISPAdminReportType>("usage_report");
  const [reportTitle, setReportTitle] = useState("");
  const [requestFilter, setRequestFilter] =
    useState<PlanChangeRequestStatus | "all">("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  async function loadOperationsData() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [reportData, requestData] = await Promise.all([
        listISPAdminReports(null, 10),
        listPlanChangeRequests(
          requestFilter === "all" ? null : requestFilter,
          10
        ),
      ]);

      setReports(reportData);
      setRequests(requestData);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load operations data.")
      );
    } finally {
      setIsLoading(false);
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
      });

      setReportTitle("");
      setSuccessMessage(`Generated report: ${report.title}`);
      await loadOperationsData();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not generate report."));
    } finally {
      setIsGeneratingReport(false);
    }
  }

  return (
    <section className="stitch-content-card stitch-operations-center">
      <div className="stitch-panel-title-row">
        <div>
          <h2>Operations Center</h2>
          <p>Generate reports and review user plan change requests.</p>
        </div>

        <button
          className="stitch-view-link"
          type="button"
          onClick={() => void loadOperationsData()}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {errorMessage && <div className="stitch-error-box">{errorMessage}</div>}
      {successMessage && <div className="stitch-success-box">{successMessage}</div>}

      <section className="stitch-operations-grid">
        <div className="stitch-operations-panel">
          <h3>Generate report</h3>
          <p>Create a stored report using backend-generated ISP data.</p>

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

          <button
            type="button"
            disabled={isGeneratingReport}
            onClick={() => void handleGenerateReport()}
          >
            {isGeneratingReport ? "Generating..." : "Generate report"}
          </button>
        </div>

        <div className="stitch-operations-panel">
          <h3>Plan request filter</h3>
          <p>Review pending requests or inspect previous decisions.</p>

          <div className="filter-bar stitch-operations-filter-bar">
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

      {isLoading && <p className="stitch-loading-text">Loading operations...</p>}

      {!isLoading && (
        <section className="stitch-operations-split">
          <div className="stitch-operations-table-panel">
            <div className="stitch-monitoring-panel-header">
              <h3>Recent reports</h3>
            </div>

            <div className="stitch-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.title}</td>
                      <td>{formatReportType(report.report_type)}</td>
                      <td>{formatDateTime(report.created_at)}</td>
                    </tr>
                  ))}

                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={3}>No reports found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="stitch-operations-table-panel">
            <div className="stitch-monitoring-panel-header">
              <h3>Plan change requests</h3>
            </div>

            <div className="stitch-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.request_type}</td>
                      <td>
                        <span className={`status-pill status-${request.status}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>{formatDateTime(request.requested_at)}</td>
                      <td>{request.reason ?? "-"}</td>
                      <td>
                        <RequestReviewActions
                          request={request}
                          onReviewed={loadOperationsData}
                        />
                      </td>
                    </tr>
                  ))}

                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5}>No plan change requests found.</td>
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
