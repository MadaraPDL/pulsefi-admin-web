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
import { ISPAdminMonitoringCenter } from "../components/ISPAdminMonitoringCenter";
import { ISPAdminOperationsCenter } from "../components/ISPAdminOperationsCenter";
import { ISPAdminNetworkActivityCenter } from "../components/ISPAdminNetworkActivityCenter";
import { ISPAdminIntelligenceCenter } from "../components/ISPAdminIntelligenceCenter";

type ISPSection =
  | "dashboard"
  | "monitoring"
  | "operations"
  | "network"
  | "intelligence"
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
  monitoring: {
    title: "Monitoring Center",
    subtitle: "Review analytics, alerts, usage totals, and ISP activity signals.",
  },
  operations: {
    title: "Operations Center",
    subtitle: "Generate reports and review customer plan change requests.",
  },
  network: {
    title: "Network Activity",
    subtitle: "Review usage records, device events, and router policy action logs.",
  },
  intelligence: {
    title: "Intelligence Center",
    subtitle: "Generate usage predictions and plan recommendations.",
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
    { id: "dashboard", label: "Overview", icon: "dashboard" },
    { id: "users", label: "Users", icon: "group" },
    { id: "plans", label: "Plans", icon: "package_2" },
    { id: "subscriptions", label: "Subscriptions", icon: "assignment" },
    { id: "routers", label: "Routers", icon: "router" },
    { id: "intelligence", label: "Intelligence", icon: "psychology" },
    { id: "invitations", label: "Invitations", icon: "mail" },
    { id: "monitoring", label: "Monitoring", icon: "monitoring" },
    { id: "operations", label: "Operations", icon: "assignment_turned_in" },
    { id: "network", label: "Network", icon: "lan" },
  ];

  return (
    <nav className="pf-sidebar" aria-label="ISP Admin navigation">
      <div className="pf-sidebar-head">
        <div className="pf-profile-row">
          <div className="pf-profile-avatar">
            <span className="material-symbols-outlined">wifi</span>
          </div>

          <div>
            <h1>PulseFi</h1>
            <p>ISP Admin</p>
          </div>
        </div>

        <button
          className="pf-quick-action"
          type="button"
          onClick={() => onNavigate("invitations")}
        >
          <span className="material-symbols-outlined">person_add</span>
          Invite User
        </button>
      </div>

      <ul className="pf-nav-list">
        {navItems.map((item) => (
          <li key={item.label}>
            <button
              className={
                item.id === activeSection
                  ? "pf-sidebar-link pf-sidebar-link-active"
                  : "pf-sidebar-link"
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

      <div className="pf-sidebar-bottom">
        <button className="pf-sidebar-link" type="button">
          <span className="material-symbols-outlined">help</span>
          <span>Support</span>
        </button>

        <button className="pf-sidebar-link" type="button" onClick={onLogout}>
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
    <header className="pf-topbar">
      <div className="pf-topbar-left">
        <div>
          <h2>{copy.title}</h2>
          <p>
            {copy.subtitle} - {adminName}
          </p>
        </div>

        <label className="pf-dashboard-search">
          <span className="material-symbols-outlined">search</span>
          <input placeholder="Search ISP data..." />
        </label>
      </div>

      <div className="pf-topbar-actions">
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
    <div className="pf-dashboard-shell">
      <ISPSidebar
        activeSection={activeSection}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <ISPTopBar adminName={adminName} activeSection={activeSection} />

      <main className="pf-dashboard-main">{children}</main>
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
    <section className="pf-kpi-grid">
      {cards.map((card) => (
        <article className="pf-kpi-card" key={card.label}>
          <div className="pf-kpi-top">
            <span>{card.label}</span>
            <span className="material-symbols-outlined">{card.icon}</span>
          </div>

          <div>
            <strong>{card.value}</strong>
            <div className="pf-kpi-meta">
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
    <aside className="pf-alerts-panel">
      <div className="pf-panel-title-row">
        <h2>ISP Insights</h2>
        <span className="pf-health-pill">Scoped</span>
      </div>

      <div className="pf-alert-list">
        <article className="pf-alert-item pf-alert-info">
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

        <article className="pf-alert-item pf-alert-warning">
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

        <article className="pf-alert-item pf-alert-info">
          <span className="material-symbols-outlined">monitoring</span>
          <div>
            <h3>Intelligence Ready</h3>
            <p>
              Analytics, reports, predictions, and recommendations are now
              available from the Intelligence tab.
            </p>
            <small>Step 27D connected</small>
          </div>
        </article>
      </div>
    </aside>
  );
}

function ISPOverviewRoutes({
  onNavigate,
}: {
  onNavigate: (section: ISPSection) => void;
}) {
  const routes: Array<{
    section: ISPSection;
    icon: string;
    title: string;
    description: string;
    meta: string;
  }> = [
    {
      section: "users",
      icon: "group",
      title: "Users",
      description: "Review ISP-scoped customer accounts and support fields.",
      meta: "Accounts",
    },
    {
      section: "plans",
      icon: "package_2",
      title: "Plans",
      description: "Create and update internet bundles for this ISP.",
      meta: "Catalog",
    },
    {
      section: "subscriptions",
      icon: "assignment",
      title: "Subscriptions",
      description: "Assign plans and manage customer subscription state.",
      meta: "Assignments",
    },
    {
      section: "routers",
      icon: "router",
      title: "Routers",
      description: "Register router metadata without collecting passwords.",
      meta: "CPE",
    },
    {
      section: "intelligence",
      icon: "psychology",
      title: "Intelligence",
      description: "Open analytics, recommendations, reports, and generation flows.",
      meta: "AI",
    },
    {
      section: "invitations",
      icon: "mail",
      title: "Invitations",
      description: "Create and track App User invitations for this ISP.",
      meta: "Access",
    },
    {
      section: "monitoring",
      icon: "monitoring",
      title: "Monitoring",
      description: "Review ISP activity signals, usage totals, and alerts.",
      meta: "Signals",
    },
    {
      section: "operations",
      icon: "assignment_turned_in",
      title: "Operations",
      description: "Generate reports and review plan-change requests.",
      meta: "Workflows",
    },
    {
      section: "network",
      icon: "lan",
      title: "Network Activity",
      description: "Inspect usage records, device events, and router policy logs.",
      meta: "Network",
    },
  ];

  return (
    <section className="pf-content-card pf-overview-route-panel">
      <div className="pf-panel-title-row">
        <div>
          <h2>Dashboard Sections</h2>
          <p>Choose one area at a time to keep the dashboard focused.</p>
        </div>
      </div>

      <div className="pf-overview-route-list">
        {routes.map((route) => (
          <button
            className="pf-overview-route-row"
            key={route.section}
            type="button"
            onClick={() => onNavigate(route.section)}
          >
            <span className="material-symbols-outlined">{route.icon}</span>
            <span className="pf-overview-route-copy">
              <strong>{route.title}</strong>
              <span>{route.description}</span>
            </span>
            <span className="pf-overview-route-meta">{route.meta}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SectionCard({ children }: { children: ReactNode }) {
  return <div className="pf-section-stack">{children}</div>;
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
      {errorMessage && <div className="pf-error-box">{errorMessage}</div>}

      {!summary && !errorMessage && (
        <p className="pf-loading-text">Loading ISP summary...</p>
      )}

      {summary && activeSection === "dashboard" && (
        <>
          <div className="pf-selected-strip">
            <strong>ISP ID:</strong> {summary.isp_id}
          </div>

          <ISPSummaryCards summary={summary} />

          <section className="pf-bento-grid">
            <ISPOverviewRoutes onNavigate={setActiveSection} />

            <ISPInsightsPanel summary={summary} />
          </section>
        </>
      )}

      {activeSection === "monitoring" && (
        <SectionCard>
          <ISPAdminMonitoringCenter />
        </SectionCard>
      )}

      {activeSection === "operations" && (
        <SectionCard>
          <ISPAdminOperationsCenter />
        </SectionCard>
      )}

      {activeSection === "network" && (
        <SectionCard>
          <ISPAdminNetworkActivityCenter />
        </SectionCard>
      )}

      {activeSection === "intelligence" && (
        <SectionCard>
          <ISPAdminIntelligenceCenter />
        </SectionCard>
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
