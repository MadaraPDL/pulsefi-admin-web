import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/errors";
import {
  generatePredictionForSubscription,
  generateRecommendationForPrediction,
  listUserSubscriptions,
} from "../api/ispAdmin";
import type {
  ISPAdminPredictionGenerationResponse,
  ISPAdminRecommendationGenerationResponse,
  UserSubscription,
} from "../api/ispAdmin";

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

export function ISPAdminIntelligenceCenter() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState("");
  const [predictionDate, setPredictionDate] = useState("");
  const [predictionResult, setPredictionResult] =
    useState<ISPAdminPredictionGenerationResponse | null>(null);
  const [recommendationResult, setRecommendationResult] =
    useState<ISPAdminRecommendationGenerationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);
  const [isGeneratingPrediction, setIsGeneratingPrediction] = useState(false);
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] =
    useState(false);

  async function loadSubscriptions() {
    setIsLoadingSubscriptions(true);
    setErrorMessage("");

    try {
      const data = await listUserSubscriptions("active", null, 50, 0);
      setSubscriptions(data);

      if (!selectedSubscriptionId && data.length > 0) {
        setSelectedSubscriptionId(data[0].id);
      }
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load active subscriptions.")
      );
    } finally {
      setIsLoadingSubscriptions(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSubscriptions();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // loadSubscriptions intentionally stays local to avoid extra renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not generate recommendation.")
      );
    } finally {
      setIsGeneratingRecommendation(false);
    }
  }

  return (
    <section className="stitch-content-card stitch-intelligence-center">
      <div className="stitch-panel-title-row">
        <div>
          <h2>Intelligence Center</h2>
          <p>Generate usage predictions and plan recommendations.</p>
        </div>

        <button
          className="stitch-view-link"
          type="button"
          onClick={() => void loadSubscriptions()}
          disabled={isLoadingSubscriptions}
        >
          Refresh subscriptions
        </button>
      </div>

      {errorMessage && <div className="stitch-error-box">{errorMessage}</div>}
      {successMessage && <div className="stitch-success-box">{successMessage}</div>}

      <section className="stitch-intelligence-grid">
        <div className="stitch-intelligence-panel">
          <h3>Prediction input</h3>
          <p>
            Select an active subscription. The backend calculates prediction
            using the subscription cycle and available usage records.
          </p>

          <label>
            Active subscription
            <select
              value={selectedSubscriptionId}
              onChange={(event) => {
                setSelectedSubscriptionId(event.target.value);
                setPredictionResult(null);
                setRecommendationResult(null);
              }}
              disabled={isLoadingSubscriptions || subscriptions.length === 0}
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
            disabled={
              isGeneratingPrediction ||
              isLoadingSubscriptions ||
              subscriptions.length === 0
            }
          >
            {isGeneratingPrediction ? "Generating..." : "Generate prediction"}
          </button>

          {subscriptions.length === 0 && !isLoadingSubscriptions && (
            <p className="stitch-warning-text">
              No active subscriptions found. Create or activate a subscription
              before generating predictions.
            </p>
          )}
        </div>

        <div className="stitch-intelligence-panel">
          <h3>Recommendation action</h3>
          <p>
            After generating a prediction, request a backend plan
            recommendation from that prediction.
          </p>

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
            <p className="stitch-warning-text">
              Generate a prediction first to unlock recommendations.
            </p>
          )}
        </div>
      </section>

      <section className="stitch-intelligence-results">
        <article className="stitch-intelligence-result-card">
          <div className="stitch-monitoring-panel-header">
            <h3>Latest Prediction</h3>
          </div>

          {!predictionResult && (
            <div className="stitch-empty-state">
              <span className="material-symbols-outlined">query_stats</span>
              <h3>No prediction generated</h3>
              <p>Generate a prediction to preview usage risk and cycle data.</p>
            </div>
          )}

          {predictionResult && (
            <div className="stitch-intelligence-detail-grid">
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

        <article className="stitch-intelligence-result-card">
          <div className="stitch-monitoring-panel-header">
            <h3>Latest Recommendation</h3>
          </div>

          {!recommendationResult && (
            <div className="stitch-empty-state">
              <span className="material-symbols-outlined">tips_and_updates</span>
              <h3>No recommendation generated</h3>
              <p>Generate a recommendation after a successful prediction.</p>
            </div>
          )}

          {recommendationResult && (
            <div className="stitch-recommendation-box">
              <span className="status-pill status-info">
                {recommendationResult.recommendation.recommendation_type}
              </span>

              <h3>{recommendationResult.recommendation.recommendation_text}</h3>

              <p>{recommendationResult.recommendation.reason ?? "No reason returned."}</p>

              <div className="stitch-intelligence-detail-grid">
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
                    {formatNumber(recommendationResult.recommended_plan_limit_gb)} GB
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
    </section>
  );
}
