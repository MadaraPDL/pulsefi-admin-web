import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/errors";
import {
  generatePredictionForSubscription,
  generateRecommendationForPrediction,
  getISPAdminAnalyticsSummary,
  listISPAdminReports,
  listRecommendations,
  listUserSubscriptions,
  runISPAdminIntelligence,
} from "../api/ispAdmin";
import type {
  ISPAdminAnalyticsSummary,
  ISPAdminIntelligenceRunResponse,
  ISPAdminPredictionGenerationResponse,
  ISPAdminRecommendation,
  ISPAdminRecommendationGenerationResponse,
  ISPAdminRecommendationStatus,
  ISPAdminReport,
  UserSubscription,
} from "../api/ispAdmin";

type RecommendationFilter = ISPAdminRecommendationStatus | "all";

const recommendationFilters: {
  label: string;
  value: RecommendationFilter;
}[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Accepted", value: "accepted" },
];

function formatNumber(value: string | number | null) {
  if (value === null) {
    return "-";
  }

  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return numericValue.toFixed(2);
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
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

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function getRiskClass(riskLevel: string) {
  const normalized = riskLevel.toLowerCase();

  if (normalized.includes("high") || normalized.includes("critical")) {
    return "status-critical";
  }

  if (normalized.includes("medium") || normalized.includes("warning")) {
    return "status-warning";
  }

  return "status-info";
}

function getRecommendationStatusClass(statusValue: string) {
  if (statusValue === "accepted") {
    return "status-approved";
  }

  return "status-info";
}

function AnalyticsSnapshot({
  analytics,
}: {
  analytics: ISPAdminAnalyticsSummary | null;
}) {
  if (!analytics) {
    return (
      <div className="pf-empty-state">
        <span className="material-symbols-outlined">query_stats</span>
        <h3>No analytics loaded</h3>
        <p>Analytics will appear after the dashboard connects to the backend.</p>
      </div>
    );
  }

  const cards = [
    {
      label: "Usage",
      value: `${formatNumber(analytics.total_usage_gb)} GB`,
      detail: `${formatNumber(analytics.total_usage_mb)} MB`,
      icon: "monitoring",
    },
    {
      label: "Recommendations",
      value: analytics.total_recommendations,
      detail: `${analytics.new_recommendations} new`,
      icon: "tips_and_updates",
    },
    {
      label: "Plan Requests",
      value: analytics.pending_plan_change_requests,
      detail: `${analytics.approved_plan_change_requests} approved`,
      icon: "compare_arrows",
    },
    {
      label: "Alerts",
      value: analytics.total_alerts,
      detail: `${analytics.critical_alerts} critical`,
      icon: "notifications_active",
    },
  ];

  return (
    <section className="pf-monitoring-card-grid">
      {cards.map((card) => (
        <article className="pf-monitoring-card pf-monitoring-info" key={card.label}>
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

function RecommendationList({
  recommendations,
}: {
  recommendations: ISPAdminRecommendation[];
}) {
  if (recommendations.length === 0) {
    return (
      <div className="pf-empty-state">
        <span className="material-symbols-outlined">tips_and_updates</span>
        <h3>No recommendations found</h3>
        <p>Generate recommendations from predictions to build ISP history.</p>
      </div>
    );
  }

  return (
    <div className="pf-intelligence-list">
      <div className="recommendations-scroll-list">
        {recommendations.map((recommendation) => (
          <article
            className="pf-intelligence-list-item"
            key={recommendation.id}
          >
            <div>
              <span
                className={`status-pill ${getRecommendationStatusClass(
                  recommendation.status
                )}`}
              >
                {recommendation.status}
              </span>
              <strong>{recommendation.recommendation_text}</strong>
              <p>{recommendation.reason ?? "No reason returned."}</p>
            </div>

            <dl>
              <div>
                <dt>Type</dt>
                <dd>{formatLabel(recommendation.recommendation_type)}</dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd>{formatNumber(recommendation.confidence_score)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDateTime(recommendation.created_at)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

function ReportList({ reports }: { reports: ISPAdminReport[] }) {
  if (reports.length === 0) {
    return (
      <div className="pf-empty-state">
        <span className="material-symbols-outlined">assignment</span>
        <h3>No reports found</h3>
        <p>Generated reports from the Operations Center will appear here.</p>
      </div>
    );
  }

  return (
    <div className="pf-table-wrap intelligence-scroll-list">
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
              <td>{formatLabel(report.report_type)}</td>
              <td>{formatDateTime(report.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ISPAdminIntelligenceCenter() {
  const [analytics, setAnalytics] = useState<ISPAdminAnalyticsSummary | null>(
    null
  );
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [recommendations, setRecommendations] = useState<
    ISPAdminRecommendation[]
  >([]);
  const [reports, setReports] = useState<ISPAdminReport[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState("");
  const [recommendationFilter, setRecommendationFilter] =
    useState<RecommendationFilter>("all");
  const [predictionDate, setPredictionDate] = useState("");
  const [predictionResult, setPredictionResult] =
    useState<ISPAdminPredictionGenerationResponse | null>(null);
  const [recommendationResult, setRecommendationResult] =
    useState<ISPAdminRecommendationGenerationResponse | null>(null);
  const [automationResult, setAutomationResult] =
    useState<ISPAdminIntelligenceRunResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isGeneratingPrediction, setIsGeneratingPrediction] = useState(false);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] =
    useState(false);
  const [isRunningAutomation, setIsRunningAutomation] = useState(false);

  async function loadIntelligenceData() {
    setIsLoadingData(true);
    setErrorMessage("");

    try {
      const [analyticsData, subscriptionData, recommendationData, reportData] =
        await Promise.all([
          getISPAdminAnalyticsSummary(),
          listUserSubscriptions("active", null, 50, 0),
          listRecommendations({
            status: recommendationFilter === "all" ? null : recommendationFilter,
            limit: 8,
          }),
          listISPAdminReports(null, 6, 0),
        ]);

      setAnalytics(analyticsData);
      setSubscriptions(subscriptionData);
      setRecommendations(recommendationData);
      setReports(reportData);

      if (!selectedSubscriptionId && subscriptionData.length > 0) {
        setSelectedSubscriptionId(subscriptionData[0].id);
      }
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load intelligence dashboard data.")
      );
    } finally {
      setIsLoadingData(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadIntelligenceData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // loadIntelligenceData intentionally stays local to avoid extra renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendationFilter]);

  async function handleRunAutomation() {
    setErrorMessage("");
    setSuccessMessage("");
    setAutomationResult(null);
    setIsRunningAutomation(true);

    try {
      const result = await runISPAdminIntelligence();
      setAutomationResult(result);
      setSuccessMessage(
        `Intelligence run complete: ${result.predictions_created} predictions and ${result.recommendations_created} recommendations.`
      );
      await loadIntelligenceData();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not run automatic intelligence.")
      );
    } finally {
      setIsRunningAutomation(false);
    }
  }

  async function handleGeneratePrediction() {
    if (!selectedSubscriptionId) {
      setErrorMessage("Select an active subscription first.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setRecommendationResult(null);
    setIsGeneratingPrediction(true);

    try {
      const result = await generatePredictionForSubscription(
        selectedSubscriptionId,
        predictionDate || null
      );

      setPredictionResult(result);
      setSuccessMessage("Prediction generated successfully.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not generate prediction."));
    } finally {
      setIsGeneratingPrediction(false);
    }
  }

  async function handleGenerateRecommendation() {
    if (!predictionResult) {
      setErrorMessage("Generate a prediction first.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsGeneratingRecommendation(true);

    try {
      const result = await generateRecommendationForPrediction(
        predictionResult.prediction.id
      );

      setRecommendationResult(result);
      setSuccessMessage(
        result.created
          ? "Recommendation generated successfully."
          : "Existing recommendation returned."
      );
      await loadIntelligenceData();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not generate recommendation.")
      );
    } finally {
      setIsGeneratingRecommendation(false);
    }
  }

  return (
    <section className="pf-content-card pf-intelligence-center">
      <div className="pf-panel-title-row">
        <div>
          <h2>Intelligence Center</h2>
          <p>Analytics, recommendations, reports, and generation workflows.</p>
        </div>

        <button
          className="pf-view-link pf-refresh-button"
          type="button"
          onClick={() => void loadIntelligenceData()}
          disabled={isLoadingData}
        >
          Refresh
        </button>
      </div>

      {errorMessage && <div className="pf-error-box">{errorMessage}</div>}
      {successMessage && <div className="pf-success-box">{successMessage}</div>}

      {isLoadingData && (
        <p className="pf-loading-text">Loading intelligence data...</p>
      )}

      {!isLoadingData && (
        <>
          <AnalyticsSnapshot analytics={analytics} />

          <section className="pf-intelligence-automation-panel">
            <div>
              <span className="pf-automation-kicker">
                Automatic intelligence
              </span>
              <h3>Run predictions and recommendations for this ISP</h3>
              <p>
                This checks active subscriptions under the current ISP, skips
                subscriptions without enough usage data, and reuses existing
                daily intelligence when it already exists.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleRunAutomation()}
              disabled={isRunningAutomation}
            >
              {isRunningAutomation ? "Running..." : "Run intelligence now"}
            </button>

            {automationResult && (
              <div className="pf-intelligence-run-summary">
                <div>
                  <span>Checked</span>
                  <strong>{automationResult.subscriptions_checked}</strong>
                </div>
                <div>
                  <span>Predictions</span>
                  <strong>{automationResult.predictions_created}</strong>
                </div>
                <div>
                  <span>Recommendations</span>
                  <strong>{automationResult.recommendations_created}</strong>
                </div>
                <div>
                  <span>Skipped</span>
                  <strong>{automationResult.skipped}</strong>
                </div>
                <div>
                  <span>Failed</span>
                  <strong>{automationResult.failed}</strong>
                </div>
              </div>
            )}

            {automationResult && automationResult.items.length > 0 && (
              <details className="pf-intelligence-run-details">
                <summary>View run details</summary>

                <div>
                  {automationResult.items.map((item) => (
                    <article key={item.subscription_id}>
                      <span className={`status-pill status-${item.status}`}>
                        {item.status}
                      </span>
                      <code>{item.subscription_id}</code>
                      <p>{item.message ?? "No message."}</p>
                    </article>
                  ))}
                </div>
              </details>
            )}
          </section>

          <section className="pf-intelligence-grid">
            <div className="pf-intelligence-panel">
              <h3>Prediction input</h3>
              <p>Select an active subscription and let the backend calculate usage risk.</p>

              <label>
                Active subscription
                <select
                  value={selectedSubscriptionId}
                  onChange={(event) => {
                    setSelectedSubscriptionId(event.target.value);
                    setPredictionResult(null);
                    setRecommendationResult(null);
                  }}
                  disabled={subscriptions.length === 0}
                >
                  {subscriptions.map((subscription) => (
                    <option value={subscription.id} key={subscription.id}>
                      {subscription.subscription_label ??
                        `Subscription ${subscription.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Prediction date optional
                <input
                  type="date"
                  value={predictionDate}
                  onChange={(event) => setPredictionDate(event.target.value)}
                />
              </label>

              <button
                type="button"
                onClick={() => void handleGeneratePrediction()}
                disabled={isGeneratingPrediction || subscriptions.length === 0}
              >
                {isGeneratingPrediction ? "Generating..." : "Generate prediction"}
              </button>

              {subscriptions.length === 0 && (
                <p className="pf-warning-text">
                  No active subscriptions found. Create or activate a subscription
                  before generating predictions.
                </p>
              )}
            </div>

            <div className="pf-intelligence-panel">
              <h3>Recommendation action</h3>
              <p>Generate a plan recommendation from the latest prediction result.</p>

              <button
                type="button"
                onClick={() => void handleGenerateRecommendation()}
                disabled={!predictionResult || isGeneratingRecommendation}
              >
                {isGeneratingRecommendation
                  ? "Generating..."
                  : "Generate recommendation"}
              </button>

              {!predictionResult && (
                <p className="pf-warning-text">
                  Generate a prediction first to unlock recommendations.
                </p>
              )}
            </div>
          </section>

          <section className="pf-intelligence-results">
            <article className="pf-intelligence-result-card">
              <div className="pf-monitoring-panel-header">
                <h3>Latest Prediction</h3>
              </div>

              {!predictionResult && (
                <div className="pf-empty-state">
                  <span className="material-symbols-outlined">query_stats</span>
                  <h3>No prediction generated</h3>
                  <p>Generate a prediction to preview usage risk and cycle data.</p>
                </div>
              )}

              {predictionResult && (
                <div className="pf-intelligence-detail-grid">
                  <div>
                    <span>Predicted usage</span>
                    <strong>
                      {formatNumber(predictionResult.prediction.predicted_usage_gb)} GB
                    </strong>
                  </div>

                  <div>
                    <span>Risk level</span>
                    <strong>
                      <span
                        className={`status-pill ${getRiskClass(
                          predictionResult.prediction.risk_level
                        )}`}
                      >
                        {predictionResult.prediction.risk_level}
                      </span>
                    </strong>
                  </div>

                  <div>
                    <span>Observed usage</span>
                    <strong>
                      {formatNumber(predictionResult.observed_usage_gb)} GB
                    </strong>
                  </div>

                  <div>
                    <span>Average daily</span>
                    <strong>
                      {formatNumber(predictionResult.average_daily_usage_gb)} GB
                    </strong>
                  </div>

                  <div>
                    <span>Cycle progress</span>
                    <strong>
                      {predictionResult.days_elapsed}/
                      {predictionResult.total_cycle_days} days
                    </strong>
                  </div>

                  <div>
                    <span>Prediction date</span>
                    <strong>
                      {formatDate(predictionResult.prediction.prediction_date)}
                    </strong>
                  </div>
                </div>
              )}
            </article>

            <article className="pf-intelligence-result-card">
              <div className="pf-monitoring-panel-header">
                <h3>Latest Recommendation</h3>
              </div>

              {!recommendationResult && (
                <div className="pf-empty-state">
                  <span className="material-symbols-outlined">
                    tips_and_updates
                  </span>
                  <h3>No recommendation generated</h3>
                  <p>Generate a recommendation after a successful prediction.</p>
                </div>
              )}

              {recommendationResult && (
                <div className="pf-recommendation-box recommendations-scroll-list">
                  <span className="status-pill status-info">
                    {formatLabel(
                      recommendationResult.recommendation.recommendation_type
                    )}
                  </span>

                  <h3>{recommendationResult.recommendation.recommendation_text}</h3>

                  <p>
                    {recommendationResult.recommendation.reason ??
                      "No reason returned."}
                  </p>

                  <div className="pf-intelligence-detail-grid">
                    <div>
                      <span>Predicted usage</span>
                      <strong>
                        {formatNumber(recommendationResult.predicted_usage_gb)} GB
                      </strong>
                    </div>

                    <div>
                      <span>Current limit</span>
                      <strong>
                        {formatNumber(recommendationResult.current_plan_limit_gb)} GB
                      </strong>
                    </div>

                    <div>
                      <span>Recommended limit</span>
                      <strong>
                        {formatNumber(
                          recommendationResult.recommended_plan_limit_gb
                        )}{" "}
                        GB
                      </strong>
                    </div>

                    <div>
                      <span>Status</span>
                      <strong>{recommendationResult.recommendation.status}</strong>
                    </div>
                  </div>
                </div>
              )}
            </article>
          </section>

          <section className="pf-intelligence-history-grid">
            <article className="pf-intelligence-result-card">
              <div className="pf-monitoring-panel-header">
                <h3>Recommendation History</h3>

                <div className="filter-bar pf-intelligence-filter-bar">
                  {recommendationFilters.map((filter) => (
                    <button
                      key={filter.value}
                      className={`filter-chip ${
                        recommendationFilter === filter.value
                          ? "active-filter"
                          : ""
                      }`}
                      type="button"
                      onClick={() => setRecommendationFilter(filter.value)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <RecommendationList recommendations={recommendations} />
            </article>

            <article className="pf-intelligence-result-card">
              <div className="pf-monitoring-panel-header">
                <h3>Recent Reports</h3>
              </div>

              <ReportList reports={reports} />
            </article>
          </section>
        </>
      )}
    </section>
  );
}
