import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getErrorMessage } from "../api/errors";
import { getISPAdminSummary } from "../api/ispAdmin";
import type { ISPAdminSummary } from "../api/ispAdmin";
import { clearSession, getAdminName } from "../auth/session";
import { AppUserInvitationManagement } from "../components/AppUserInvitationManagement";
import { AppUserManagement } from "../components/AppUserManagement";
import { SubscriptionPlanManagement } from "../components/SubscriptionPlanManagement";
import { UserSubscriptionManagement } from "../components/UserSubscriptionManagement";
import { RouterManagement } from "../components/RouterManagement";

type ISPSection =
  | "dashboard"
  | "users"
  | "plans"
  | "subscriptions"
  | "routers"
  | "invitations";

const ispSectionCopy: Record<ISPSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: "ISP Overview",
    subtitle: "Monitor users, subscriptions, routers, and ISP activity.",
  },
  users: {
    title: "App Users",
    subtitle: "Create and manage customer app-user accounts.",
  },
  plans: {
    title: "Subscription Plans",
    subtitle: "Manage internet bundles and plan availability.",
  },
  subscriptions: {
    title: "User Subscriptions",
    subtitle: "Assign users to plans and track subscription status.",
  },
  routers: {
    title: "Router Management",
    subtitle: "Register customer routers and manage router metadata.",
  },
  invitations: {
    title: "User Invitations",
    subtitle: "Invite app users and track invitation status.",
  },
};

function ISPSidebar({
  activeSection,
  onNavigate,
  onLogout,
}: {
  activeSection: ISPSection;
  onNavigate: (section: ISPSection) => void;
  onLogout: () => void;
}) {
  const navItems: Array<{
    id: ISPSection;
    label: string;
    icon: string;
  }> = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "users", label: "Users", icon: "group" },
    { id: "plans", label: "Plans", icon: "package_2" },
    { id: "subscriptions", label: "Subscriptions", icon: "assignment" },
    { id: "routers", label: "Routers", icon: "router" },
    { id: "invitations", label: "Invitations", icon: "mail" },
  ];

  return (
    <nav className="stitch-sidebar" aria-label="ISP Admin navigation">
      <div className="stitch-sidebar-head">
        <div className="stitch-profile-row">
          <div className="stitch-profile-avatar">
            <span className="material-symbols-outlined">wifi</span>
          </div>

          <div>
            <h1>PulseFi</h1>
            <p>ISP Admin</p>
          </div>
        </div>

        <button
          className="stitch-quick-action"
          type="button"
          onClick={() => onNavigate("users")}
        >
          <span className="material-symbols-outlined">person_add</span>
          Quick Action
        </button>
      </div>

      <ul className="stitch-nav-list">
        {navItems.map((item) => (
          <li key={item.label}>
            <button
              className={
                item.id === activeSection
                  ? "stitch-sidebar-link stitch-sidebar-link-active"
                  : "stitch-sidebar-link"
              }
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="stitch-sidebar-bottom">
        <button className="stitch-sidebar-link" type="button">
          <span className="material-symbols-outlined">help</span>
          <span>Support</span>
        </button>

        <button className="stitch-sidebar-link" type="button" onClick={onLogout}>
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}

function ISPTopBar({
  adminName,
  activeSection,
}: {
  adminName: string;
  activeSection: ISPSection;
}) {
  const copy = ispSectionCopy[activeSection];

  return (
    <header className="stitch-topbar">
      <div className="stitch-topbar-left">
        <div>
          <h2>{copy.title}</h2>
          <p>
            {copy.subtitle} · {adminName}
          </p>
        </div>

        <label className="stitch-dashboard-search">
          <span className="material-symbols-outlined">search</span>
          <input placeholder="Search ISP data..." />
        </label>
      </div>

      <div className="stitch-topbar-actions">
        <button type="button" aria-label="Notifications">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <button type="button" aria-label="Settings">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  );
}

function ISPShell({
  adminName,
  activeSection,
  onNavigate,
  onLogout,
  children,
}: {
  adminName: string;
  activeSection: ISPSection;
  onNavigate: (section: ISPSection) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <div className="stitch-dashboard-shell">
      <ISPSidebar
        activeSection={activeSection}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <ISPTopBar adminName={adminName} activeSection={activeSection} />

      <main className="stitch-dashboard-main">{children}</main>
    </div>
  );
}

function ISPSummaryCards({ summary }: { summary: ISPAdminSummary }) {
  const cards = [
    {
      label: "Users",
      icon: "group",
      value: summary.users.total,
      detail: `${summary.users.active} Active`,
      secondDetail: `${summary.users.total - summary.users.active} Inactive`,
    },
    {
      label: "Plans",
      icon: "package_2",
      value: summary.plans.total,
      detail: `${summary.plans.active} Active`,
      secondDetail: "ISP catalog",
    },
    {
      label: "Subscriptions",
      icon: "assignment",
      value: summary.subscriptions.total,
      detail: `${summary.subscriptions.active} Active`,
      secondDetail: "Assigned plans",
    },
    {
      label: "Routers",
      icon: "router",
      value: summary.routers.total,
      detail: `${summary.routers.active} Active`,
      secondDetail: "Customer CPE",
    },
  ];

  return (
    <section className="stitch-kpi-grid">
      {cards.map((card) => (
        <article className="stitch-kpi-card" key={card.label}>
          <div className="stitch-kpi-top">
            <span>{card.label}</span>
            <span className="material-symbols-outlined">{card.icon}</span>
          </div>

          <div>
            <strong>{card.value}</strong>
            <div className="stitch-kpi-meta">
              <span>{card.detail}</span>
              <span>{card.secondDetail}</span>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function ISPInsightsPanel({ summary }: { summary: ISPAdminSummary }) {
  return (
    <aside className="stitch-alerts-panel">
      <div className="stitch-panel-title-row">
        <h2>ISP Insights</h2>
        <span className="stitch-health-pill">Scoped</span>
      </div>

      <div className="stitch-alert-list">
        <article className="stitch-alert-item stitch-alert-info">
          <span className="material-symbols-outlined">verified_user</span>
          <div>
            <h3>ISP Isolation Active</h3>
            <p>
              ISP Admin data is loaded through backend routes scoped to the
              current admin ISP.
            </p>
            <small>ISP ID: {summary.isp_id}</small>
          </div>
        </article>

        <article className="stitch-alert-item stitch-alert-warning">
          <span className="material-symbols-outlined">router</span>
          <div>
            <h3>Router Credentials Reminder</h3>
            <p>
              Router passwords should stay out of storage until encryption is
              implemented.
            </p>
            <small>Security rule</small>
          </div>
        </article>

        <article className="stitch-alert-item stitch-alert-info">
          <span className="material-symbols-outlined">monitoring</span>
          <div>
            <h3>Usage Analytics Pending</h3>
            <p>
              Usage records, alerts, and predictions will become the next
              network-data dashboard layer.
            </p>
            <small>Future step</small>
          </div>
        </article>
      </div>
    </aside>
  );
}

function SectionCard({ children }: { children: ReactNode }) {
  return <div className="stitch-section-stack">{children}</div>;
}

export default function ISPAdminDashboard({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [summary, setSummary] = useState<ISPAdminSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeSection, setActiveSection] = useState<ISPSection>("dashboard");

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
    <ISPShell
      activeSection={activeSection}
      adminName={adminName}
      onNavigate={setActiveSection}
      onLogout={handleLogout}
    >
      {errorMessage && <div className="stitch-error-box">{errorMessage}</div>}

      {!summary && !errorMessage && (
        <p className="stitch-loading-text">Loading ISP summary...</p>
      )}

      {summary && activeSection === "dashboard" && (
        <>
          <div className="stitch-selected-strip">
            <strong>ISP ID:</strong> {summary.isp_id}
          </div>

          <ISPSummaryCards summary={summary} />

          <section className="stitch-bento-grid">
            <SectionCard>
              <SubscriptionPlanManagement />
              <AppUserManagement />
              <RouterManagement />
            </SectionCard>

            <ISPInsightsPanel summary={summary} />
          </section>
        </>
      )}

      {activeSection === "users" && (
        <SectionCard>
          <AppUserManagement />
        </SectionCard>
      )}

      {activeSection === "plans" && (
        <SectionCard>
          <SubscriptionPlanManagement />
        </SectionCard>
      )}

      {activeSection === "subscriptions" && (
        <SectionCard>
          <UserSubscriptionManagement />
        </SectionCard>
      )}

      {activeSection === "routers" && (
        <SectionCard>
          <RouterManagement />
        </SectionCard>
      )}

      {activeSection === "invitations" && (
        <SectionCard>
          <AppUserInvitationManagement />
        </SectionCard>
      )}
    </ISPShell>
  );
}
