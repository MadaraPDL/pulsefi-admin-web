import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getErrorMessage } from "../api/errors";
import {
  createSubscriptionPlan,
  getSubscriptionPlan,
  listSubscriptionPlans,
  updateSubscriptionPlan,
} from "../api/ispAdmin";
import type {
  CreateSubscriptionPlanRequest,
  SubscriptionPlan,
  SubscriptionPlanActiveFilter,
  UpdateSubscriptionPlanRequest,
} from "../api/ispAdmin";

const planFilters: { label: string; value: SubscriptionPlanActiveFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function getApiActiveFilter(filter: SubscriptionPlanActiveFilter): boolean | null {
  if (filter === "active") {
    return true;
  }

  if (filter === "inactive") {
    return false;
  }

  return null;
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatValue(value: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function validatePositiveNumber(value: string, label: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return `${label} must be greater than 0.`;
  }

  return "";
}

function validateNonNegativeNumber(value: string, label: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return `${label} must be 0 or greater.`;
  }

  return "";
}

export function SubscriptionPlanManagement() {
  const [activeFilter, setActiveFilter] =
    useState<SubscriptionPlanActiveFilter>("all");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const [createPlanName, setCreatePlanName] = useState("");
  const [createMonthlyPrice, setCreateMonthlyPrice] = useState("");
  const [createDataLimitGb, setCreateDataLimitGb] = useState("");
  const [createSpeedLimitMbps, setCreateSpeedLimitMbps] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createIsActive, setCreateIsActive] = useState(true);

  const [editPlanName, setEditPlanName] = useState("");
  const [editMonthlyPrice, setEditMonthlyPrice] = useState("");
  const [editDataLimitGb, setEditDataLimitGb] = useState("");
  const [editSpeedLimitMbps, setEditSpeedLimitMbps] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectingPlanId, setSelectingPlanId] = useState<string | null>(null);

  function setEditableFields(plan: SubscriptionPlan) {
    setEditPlanName(plan.plan_name);
    setEditMonthlyPrice(String(plan.monthly_price));
    setEditDataLimitGb(String(plan.data_limit_gb));
    setEditSpeedLimitMbps(
      plan.speed_limit_mbps === null ? "" : String(plan.speed_limit_mbps)
    );
    setEditDescription(plan.description ?? "");
    setEditIsActive(plan.is_active);
  }

  async function loadPlans() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await listSubscriptionPlans(getApiActiveFilter(activeFilter));
      setPlans(data);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load subscription plans.")
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadFilteredPlans() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await listSubscriptionPlans(
          getApiActiveFilter(activeFilter)
        );

        if (!isCancelled) {
          setPlans(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            getErrorMessage(error, "Could not load subscription plans.")
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadFilteredPlans();

    return () => {
      isCancelled = true;
    };
  }, [activeFilter]);

  async function choosePlan(plan: SubscriptionPlan) {
    setSelectingPlanId(plan.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const planDetails = await getSubscriptionPlan(plan.id);
      setSelectedPlan(planDetails);
      setEditableFields(planDetails);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load subscription plan.")
      );
    } finally {
      setSelectingPlanId(null);
    }
  }

  function validatePlanForm(
    planName: string,
    monthlyPrice: string,
    dataLimitGb: string,
    speedLimitMbps: string
  ) {
    if (planName.trim().length < 2) {
      return "Plan name must be at least 2 characters.";
    }

    const priceError = validateNonNegativeNumber(monthlyPrice, "Monthly price");
    if (priceError) {
      return priceError;
    }

    const dataError = validatePositiveNumber(dataLimitGb, "Data limit");
    if (dataError) {
      return dataError;
    }

    if (speedLimitMbps.trim()) {
      const speedError = validatePositiveNumber(
        speedLimitMbps,
        "Speed limit"
      );
      if (speedError) {
        return speedError;
      }
    }

    return "";
  }

  async function handleCreatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validatePlanForm(
      createPlanName,
      createMonthlyPrice,
      createDataLimitGb,
      createSpeedLimitMbps
    );

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsCreating(true);

    const payload: CreateSubscriptionPlanRequest = {
      plan_name: createPlanName.trim(),
      monthly_price: createMonthlyPrice.trim(),
      data_limit_gb: createDataLimitGb.trim(),
      speed_limit_mbps: createSpeedLimitMbps.trim() || null,
      description: createDescription.trim() || null,
      is_active: createIsActive,
    };

    try {
      const createdPlan = await createSubscriptionPlan(payload);
      const apiActiveFilter = getApiActiveFilter(activeFilter);

      if (apiActiveFilter === null || createdPlan.is_active === apiActiveFilter) {
        setPlans((current) => [createdPlan, ...current]);
      }

      setSelectedPlan(createdPlan);
      setEditableFields(createdPlan);

      setCreatePlanName("");
      setCreateMonthlyPrice("");
      setCreateDataLimitGb("");
      setCreateSpeedLimitMbps("");
      setCreateDescription("");
      setCreateIsActive(true);

      setSuccessMessage(`Created plan: ${createdPlan.plan_name}.`);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not create subscription plan.")
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPlan) {
      setErrorMessage("Select a subscription plan first.");
      return;
    }

    const validationError = validatePlanForm(
      editPlanName,
      editMonthlyPrice,
      editDataLimitGb,
      editSpeedLimitMbps
    );

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsUpdating(true);

    const payload: UpdateSubscriptionPlanRequest = {
      plan_name: editPlanName.trim(),
      monthly_price: editMonthlyPrice.trim(),
      data_limit_gb: editDataLimitGb.trim(),
      speed_limit_mbps: editSpeedLimitMbps.trim() || null,
      description: editDescription.trim() || null,
      is_active: editIsActive,
    };

    try {
      const updatedPlan = await updateSubscriptionPlan(selectedPlan.id, payload);
      const apiActiveFilter = getApiActiveFilter(activeFilter);

      setSelectedPlan(updatedPlan);
      setEditableFields(updatedPlan);
      setPlans((current) =>
        current
          .map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan))
          .filter(
            (plan) => apiActiveFilter === null || plan.is_active === apiActiveFilter
          )
      );

      setSuccessMessage(`Updated plan: ${updatedPlan.plan_name}.`);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not update subscription plan.")
      );
    } finally {
      setIsUpdating(false);
    }
  }


  async function handleSetPlanAvailability(isActive: boolean) {
    if (!selectedPlan) {
      setErrorMessage("Select a plan first.");
      return;
    }

    const validationError = validatePlanForm(
      editPlanName,
      editMonthlyPrice,
      editDataLimitGb,
      editSpeedLimitMbps
    );

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsUpdating(true);

    const payload: UpdateSubscriptionPlanRequest = {
      plan_name: editPlanName.trim(),
      monthly_price: editMonthlyPrice.trim(),
      data_limit_gb: editDataLimitGb.trim(),
      speed_limit_mbps: editSpeedLimitMbps.trim() || null,
      description: editDescription.trim() || null,
      is_active: isActive,
    };

    try {
      const updatedPlan = await updateSubscriptionPlan(selectedPlan.id, payload);
      const apiActiveFilter = getApiActiveFilter(activeFilter);

      setSelectedPlan(updatedPlan);
      setEditableFields(updatedPlan);
      setPlans((current) =>
        current
          .map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan))
          .filter(
            (plan) => apiActiveFilter === null || plan.is_active === apiActiveFilter
          )
      );

      setSuccessMessage(
        `${updatedPlan.is_active ? "Reactivated" : "Archived"} plan: ${
          updatedPlan.plan_name
        }.`
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not update subscription plan.")
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Subscription Plans</p>
          <h2>Plan Management</h2>
          <p className="muted">
            Create ISP-scoped internet plans and update plan availability.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button pf-refresh-button"
          onClick={loadPlans}
        >
          Refresh
        </button>
      </div>

      <div className="management-grid plans-management-grid">
        <form className="create-form" onSubmit={handleCreatePlan}>
          <h3>Create plan</h3>

          <label>
            Plan name
            <input
              value={createPlanName}
              onChange={(event) => setCreatePlanName(event.target.value)}
              minLength={2}
              required
            />
          </label>

          <label>
            Monthly price
            <input
              type="number"
              min="0"
              step="0.01"
              value={createMonthlyPrice}
              onChange={(event) => setCreateMonthlyPrice(event.target.value)}
              required
            />
          </label>

          <label>
            Data limit GB
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={createDataLimitGb}
              onChange={(event) => setCreateDataLimitGb(event.target.value)}
              required
            />
          </label>

          <label className="pf-bandwidth-limit-field">
            Speed limit Mbps
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={createSpeedLimitMbps}
              onChange={(event) => setCreateSpeedLimitMbps(event.target.value)}
              placeholder="Optional"
            />
          </label>

          <label>
            Description
            <textarea
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Optional plan notes"
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={createIsActive}
              onChange={(event) => setCreateIsActive(event.target.checked)}
            />
            Active plan
          </label>

          <button className="pf-action-button" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create plan"}
          </button>
        </form>

        <form className="create-form" onSubmit={handleUpdatePlan}>
          <h3>Selected plan</h3>

          {!selectedPlan && (
            <p className="muted">Select a plan from the table to view it.</p>
          )}

          {selectedPlan && (
            <>
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Created</span>
                  <strong>{formatDate(selectedPlan.created_at)}</strong>
                </div>
                <div className="detail-item">
                  <span>Updated</span>
                  <strong>{formatDate(selectedPlan.updated_at)}</strong>
                </div>
              </div>

              <label>
                Plan name
                <input
                  value={editPlanName}
                  onChange={(event) => setEditPlanName(event.target.value)}
                  minLength={2}
                  required
                />
              </label>

              <label>
                Monthly price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editMonthlyPrice}
                  onChange={(event) => setEditMonthlyPrice(event.target.value)}
                  required
                />
              </label>

              <label>
                Data limit GB
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editDataLimitGb}
                  onChange={(event) => setEditDataLimitGb(event.target.value)}
                  required
                />
              </label>

              <label className="pf-bandwidth-limit-field">
                Speed limit Mbps
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editSpeedLimitMbps}
                  onChange={(event) => setEditSpeedLimitMbps(event.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label>
                Description
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Optional plan notes"
                />
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(event) => setEditIsActive(event.target.checked)}
                />
                Active plan
              </label>

              <div className="pf-lifecycle-actions">
                <button
                  className="pf-action-button"
                  disabled={isUpdating}
                  type="submit"
                >
                  {isUpdating ? "Updating..." : "Update plan"}
                </button>

                <button
                  className="pf-secondary-button"
                  disabled={isUpdating || selectedPlan.is_active}
                  type="button"
                  onClick={() => void handleSetPlanAvailability(true)}
                >
                  Reactivate Plan
                </button>

                <button
                  className="pf-danger-outline-button"
                  disabled={isUpdating || !selectedPlan.is_active}
                  type="button"
                  onClick={() => void handleSetPlanAvailability(false)}
                >
                  Archive Plan
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      <div className="filter-bar" aria-label="Subscription plan active filter">
        {planFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`filter-chip ${
              activeFilter === filter.value ? "active-filter" : ""
            }`}
            aria-pressed={activeFilter === filter.value}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {errorMessage && <div className="error-box">{errorMessage}</div>}
      {successMessage && <div className="success-box">{successMessage}</div>}

      {isLoading && <p>Loading subscription plans...</p>}

      {!isLoading && (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Price</th>
                <th>Data GB</th>
                <th>Speed Mbps</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr
                  key={plan.id}
                  className={
                    selectedPlan?.id === plan.id
                      ? "selected-row"
                      : "clickable-row"
                  }
                  onClick={() => choosePlan(plan)}
                >
                  <td>{plan.plan_name}</td>
                  <td>{formatValue(plan.monthly_price)}</td>
                  <td>{formatValue(plan.data_limit_gb)}</td>
                  <td>{formatValue(plan.speed_limit_mbps)}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        plan.is_active ? "status-active" : "status-inactive"
                      }`}
                    >
                      {plan.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td>{formatDate(plan.created_at)}</td>
                  <td>
                    <button
                      className="small-button"
                      type="button"
                      disabled={selectingPlanId === plan.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        choosePlan(plan);
                      }}
                    >
                      {selectingPlanId === plan.id ? "Loading..." : "View"}
                    </button>
                  </td>
                </tr>
              ))}

              {plans.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    No subscription plans match this filter. Create a plan above
                    before assigning subscriptions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
