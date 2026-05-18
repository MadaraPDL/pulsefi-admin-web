import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/errors";
import { getISPAdminSummary } from "../api/ispAdmin";
import type { ISPAdminSummary } from "../api/ispAdmin";
import { clearSession, getAdminName } from "../auth/session";
import { AppUserInvitationManagement } from "../components/AppUserInvitationManagement";
import { AppUserManagement } from "../components/AppUserManagement";
import { SubscriptionPlanManagement } from "../components/SubscriptionPlanManagement";
import { UserSubscriptionManagement } from "../components/UserSubscriptionManagement";

export default function ISPAdminDashboard({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [summary, setSummary] = useState<ISPAdminSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const adminName = getAdminName("ISP Admin");

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await getISPAdminSummary();
        setSummary(data);
      } catch (error) {
        setErrorMessage(
          getErrorMessage(error, "Could not load ISP Admin summary.")
        );
      }
    }

    loadSummary();
  }, []);

  function handleLogout() {
    clearSession();
    onLogout();
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">PulseFi ISP Admin</p>
          <h1>Welcome, {adminName}</h1>
          <p className="muted">ISP Admin dashboard foundation.</p>
        </div>

        <button className="secondary-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {errorMessage && <div className="error-box">{errorMessage}</div>}

      {!summary && !errorMessage && <p>Loading ISP summary...</p>}

      {summary && (
        <>
          <div className="selected-strip">
            <strong>ISP ID:</strong> {summary.isp_id}
          </div>

          <section className="summary-grid">
            <article className="summary-card">
              <span>Users</span>
              <strong>{summary.users.total}</strong>
              <small>{summary.users.active} active</small>
            </article>

            <article className="summary-card">
              <span>Plans</span>
              <strong>{summary.plans.total}</strong>
              <small>{summary.plans.active} active</small>
            </article>

            <article className="summary-card">
              <span>Subscriptions</span>
              <strong>{summary.subscriptions.total}</strong>
              <small>{summary.subscriptions.active} active</small>
            </article>

            <article className="summary-card">
              <span>Routers</span>
              <strong>{summary.routers.total}</strong>
              <small>{summary.routers.active} active</small>
            </article>
          </section>
        </>
      )}

      <SubscriptionPlanManagement />
      <AppUserManagement />
      <UserSubscriptionManagement />
      <AppUserInvitationManagement />
    </main>
  );
}
