import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getErrorMessage } from "../api/errors";
import {
  getISPAdminSummary,
  listISPAdminDeviceConnectionLogs,
  listISPAdminRouterActionLogs,
  listISPAdminUsageRecords,
} from "../api/ispAdmin";
import type {
  ISPAdminDeviceConnectionLog,
  ISPAdminRouterActionLog,
  ISPAdminSummary,
  ISPAdminUsageRecord,
} from "../api/ispAdmin";
import { clearSession, getAdminName } from "../auth/session";
import { AppUserInvitationManagement } from "../components/AppUserInvitationManagement";
import { ISPAdminInvitationManagement } from "../components/ISPAdminInvitationManagement";
import { AppUserManagement } from "../components/AppUserManagement";
import { SubscriptionPlanManagement } from "../components/SubscriptionPlanManagement";
import { UserSubscriptionManagement } from "../components/UserSubscriptionManagement";
import { RouterManagement } from "../components/RouterManagement";
import { ISPAdminMonitoringCenter } from "../components/ISPAdminMonitoringCenter";
import { ISPAdminOperationsCenter } from "../components/ISPAdminOperationsCenter";
import { ISPAdminNetworkActivityCenter } from "../components/ISPAdminNetworkActivityCenter";
import { ISPAdminIntelligenceCenter } from "../components/ISPAdminIntelligenceCenter";
import type { AdminTheme } from "../App.real";

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
  | "app_invitations"
  | "admin_invitations";

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
  app_invitations: {
    title: "App User Invitations",
    subtitle: "Invite customers and track invitation status.",
  },
  admin_invitations: {
    title: "ISP Admin Invitations",
    subtitle: "Invite ISP Admins for the same ISP.",
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
    { id: "app_invitations", label: "User Invites", icon: "person_add" },
    { id: "admin_invitations", label: "Admin Invites", icon: "mail" },
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
          onClick={() => onNavigate("app_invitations")}
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
  theme,
  onToggleTheme,
}: {
  adminName: string;
  activeSection: ISPSection;
  theme: AdminTheme;
  onToggleTheme: () => void;
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
        <button
          className="pf-theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>

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
  theme,
  onNavigate,
  onToggleTheme,
  onLogout,
  children,
}: {
  adminName: string;
  activeSection: ISPSection;
  theme: AdminTheme;
  onNavigate: (section: ISPSection) => void;
  onToggleTheme: () => void;
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
      <ISPTopBar
        adminName={adminName}
        activeSection={activeSection}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

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

function formatLabel(value: string | null) {
  if (!value) {
    return "-";
  }

  return value.replaceAll("_", " ");
}

function formatMegabytes(value: string | number | null) {
  if (value === null) {
    return "-";
  }

  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  if (Number.isNaN(numericValue)) {
    return `${value} MB`;
  }

  return `${numericValue.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} MB`;
}

function getRouterActionStatusClass(statusValue: string) {
  if (statusValue === "success") {
    return "status-completed";
  }

  if (statusValue === "failed") {
    return "status-failed";
  }

  return "status-pending";
}

function OverviewActionCenter({
  onNavigate,
}: {
  onNavigate: (section: ISPSection) => void;
}) {
  const actions: Array<{
    section: ISPSection;
    icon: string;
    title: string;
    description: string;
  }> = [
    {
      section: "app_invitations",
      icon: "person_add",
      title: "Invite App User",
      description: "Send a customer invitation.",
    },
    {
      section: "admin_invitations",
      icon: "mail",
      title: "Invite ISP Admin",
      description: "Add another admin to this ISP.",
    },
    {
      section: "plans",
      icon: "package_2",
      title: "Create Plan",
      description: "Open the ISP plan catalog.",
    },
    {
      section: "subscriptions",
      icon: "assignment",
      title: "Assign Subscription",
      description: "Connect users to plans.",
    },
    {
      section: "routers",
      icon: "router",
      title: "Register Router",
      description: "Add router metadata.",
    },
    {
      section: "intelligence",
      icon: "psychology",
      title: "Run Intelligence",
      description: "Open prediction workflows.",
    },
    {
      section: "monitoring",
      icon: "monitoring",
      title: "View Monitoring",
      description: "Review alerts and analytics.",
    },
    {
      section: "network",
      icon: "lan",
      title: "View Network Activity",
      description: "Inspect usage and router logs.",
    },
  ];

  return (
    <section className="pf-content-card pf-overview-action-center">
      <div className="pf-panel-title-row">
        <div>
          <h2>Overview Action Center</h2>
          <p>Jump into the admin workflows that are useful from the overview.</p>
        </div>
      </div>

      <div className="pf-overview-action-grid">
        {actions.map((action) => (
          <button
            className="pf-overview-action-button"
            key={action.title}
            type="button"
            onClick={() => onNavigate(action.section)}
          >
            <span className="material-symbols-outlined">{action.icon}</span>
            <span>
              <strong>{action.title}</strong>
              <small>{action.description}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function NeedsAttentionPanel() {
  return (
    <section className="pf-content-card pf-needs-attention-panel">
      <div className="pf-panel-title-row">
        <div>
          <h2>Needs Attention</h2>
          <p>Only backend-backed overview issues are shown here.</p>
        </div>
      </div>

      <div className="pf-empty-state">
        <span className="material-symbols-outlined">task_alt</span>
        <h3>No urgent overview issues shown here</h3>
        <p>Open Monitoring or Operations for detailed records.</p>
      </div>
    </section>
  );
}

function RecentUsagePreview({
  records,
}: {
  records: ISPAdminUsageRecord[];
}) {
  return (
    <article className="pf-network-panel pf-overview-table-panel">
      <div className="pf-monitoring-panel-header">
        <h3>Recent Usage Records</h3>
      </div>

      {records.length === 0 ? (
        <div className="pf-empty-state">
          <span className="material-symbols-outlined">bar_chart</span>
          <h3>No recent usage</h3>
          <p>Usage records will appear here after the backend has data.</p>
        </div>
      ) : (
        <div className="pf-table-wrap">
          <table className="pf-usage-records-table">
            <thead>
              <tr>
                <th>Record Start</th>
                <th className="pf-total-mb-heading">Total MB</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="pf-time-cell">
                    {formatDateTime(record.record_start)}
                  </td>
                  <td className="pf-total-mb-cell">
                    {formatMegabytes(record.total_mb)}
                  </td>
                  <td>{record.source ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function RecentDeviceLogPreview({
  logs,
}: {
  logs: ISPAdminDeviceConnectionLog[];
}) {
  return (
    <article className="pf-network-panel pf-overview-table-panel">
      <div className="pf-monitoring-panel-header">
        <h3>Device Connection Logs</h3>
      </div>

      {logs.length === 0 ? (
        <div className="pf-empty-state">
          <span className="material-symbols-outlined">devices</span>
          <h3>No device events</h3>
          <p>Connection events will appear here after devices report activity.</p>
        </div>
      ) : (
        <div className="pf-table-wrap">
          <table className="pf-device-connection-log-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>IP Address</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatLabel(log.event_type)}</td>
                  <td>{log.ip_address ?? "-"}</td>
                  <td className="pf-time-cell">{formatDateTime(log.event_time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function RecentRouterActionPreview({
  logs,
}: {
  logs: ISPAdminRouterActionLog[];
}) {
  return (
    <article className="pf-network-panel pf-overview-table-panel pf-overview-table-panel-wide">
      <div className="pf-monitoring-panel-header">
        <h3>Router Action Logs</h3>
      </div>

      {logs.length === 0 ? (
        <div className="pf-empty-state">
          <span className="material-symbols-outlined">rule_settings</span>
          <h3>No router actions</h3>
          <p>Router policy action logs will appear here after actions run.</p>
        </div>
      ) : (
        <div className="pf-table-wrap">
          <table className="pf-router-action-log-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Status</th>
                <th>Executed</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatLabel(log.action_type)}</td>
                  <td>
                    <span
                      className={`status-pill ${getRouterActionStatusClass(
                        log.status
                      )}`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="pf-time-cell">
                    {formatDateTime(log.executed_at)}
                  </td>
                  <td className="pf-log-message-cell">
                    {log.error_message ?? "No message"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function OverviewRecentActivity() {
  const [usageRecords, setUsageRecords] = useState<ISPAdminUsageRecord[]>([]);
  const [deviceLogs, setDeviceLogs] = useState<ISPAdminDeviceConnectionLog[]>(
    []
  );
  const [routerActionLogs, setRouterActionLogs] = useState<
    ISPAdminRouterActionLog[]
  >([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadRecentActivity() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [usageData, deviceData, routerActionData] = await Promise.all([
        listISPAdminUsageRecords(5, 0),
        listISPAdminDeviceConnectionLogs(5, 0),
        listISPAdminRouterActionLogs(null, 5, 0),
      ]);

      setUsageRecords(usageData);
      setDeviceLogs(deviceData);
      setRouterActionLogs(routerActionData);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not load recent activity.")
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRecentActivity();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const hasRecentActivity =
    usageRecords.length > 0 ||
    deviceLogs.length > 0 ||
    routerActionLogs.length > 0;

  return (
    <section className="pf-content-card pf-overview-recent-activity">
      <div className="pf-panel-title-row">
        <div>
          <h2>Recent Activity</h2>
          <p>Latest usage, device, and router action records from the backend.</p>
        </div>

        <button
          className="pf-view-link pf-refresh-button"
          type="button"
          onClick={() => void loadRecentActivity()}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {errorMessage && <div className="pf-error-box">{errorMessage}</div>}

      {isLoading && <p className="pf-loading-text">Loading recent activity...</p>}

      {!isLoading && !errorMessage && !hasRecentActivity && (
        <div className="pf-empty-state">
          <span className="material-symbols-outlined">history</span>
          <h3>No recent activity yet</h3>
          <p>Usage records, device events, and router actions will appear here.</p>
        </div>
      )}

      {!isLoading && !errorMessage && hasRecentActivity && (
        <div className="pf-overview-recent-grid">
          <RecentUsagePreview records={usageRecords} />
          <RecentDeviceLogPreview logs={deviceLogs} />
          <RecentRouterActionPreview logs={routerActionLogs} />
        </div>
      )}
    </section>
  );
}

function SectionCard({ children }: { children: ReactNode }) {
  return <div className="pf-section-stack">{children}</div>;
}

export default function ISPAdminDashboard({
  theme,
  onToggleTheme,
  onLogout,
}: {
  theme: AdminTheme;
  onToggleTheme: () => void;
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
      theme={theme}
      onNavigate={setActiveSection}
      onToggleTheme={onToggleTheme}
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

          <section className="pf-overview-grid">
            <OverviewActionCenter onNavigate={setActiveSection} />
            <NeedsAttentionPanel />
          </section>

          <OverviewRecentActivity />
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

      {activeSection === "app_invitations" && (
        <SectionCard>
          <AppUserInvitationManagement />
        </SectionCard>
      )}

      {activeSection === "admin_invitations" && (
        <SectionCard>
          <ISPAdminInvitationManagement />
        </SectionCard>
      )}
    </ISPShell>
  );
}
