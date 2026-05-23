import { Fragment, useEffect, useState } from "react";
import { getErrorMessage } from "../api/errors";
import {
  createISPAdminReport,
  getPlanChangeRequest,
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
  const [selectedRequest, setSelectedRequest] =
    useState<ISPAdminPlanChangeRequest | null>(null);
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);
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
      setSelectedRequest(null);
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
    <section className="pf-content-card pf-operations-center">
      <div className="pf-panel-title-row">
        <div>
          <h2>Operations Center</h2>
          <p>Generate reports and review user plan change requests.</p>
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
                      <td colSpan={3}>
                        No reports yet. Generate a report above to populate this
                        list.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pf-operations-table-panel">
            <div className="pf-monitoring-panel-header">
              <h3>Plan change requests</h3>
            </div>

            <div className="pf-table-wrap">
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
                  {requests.map((request) => {
                    const isSelected = selectedRequest?.id === request.id;
                    const isLoadingDetail = loadingRequestId === request.id;
                    const detail = isSelected ? selectedRequest : request;

                    return (
                      <Fragment key={request.id}>
                        <tr>
                          <td>{request.request_type}</td>
                          <td>
                            <span className={`status-pill status-${request.status}`}>
                              {request.status}
                            </span>
                          </td>
                          <td>{formatDateTime(request.requested_at)}</td>
                          <td className="pf-request-reason-cell">{request.reason ?? "-"}</td>
                          <td>
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
                            <td colSpan={5}>
                              <div className="pf-inline-detail-panel">
                                <DetailLine label="Request ID" value={detail.id} />
                                <DetailLine label="User ID" value={detail.user_id} />
                                <DetailLine
                                  label="Subscription ID"
                                  value={detail.user_subscription_id}
                                />
                                <DetailLine
                                  label="Reason"
                                  value={detail.reason}
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
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}

                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        No plan change requests match this filter. Customer
                        requests appear here when App Users submit them.
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
