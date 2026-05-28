import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getErrorMessage } from "../api/errors";
import { AdminTablePagination } from "../components/AdminTablePagination";
import { paginateRows } from "../components/adminPaginationUtils";
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
import {
  clearSession,
  getAdminEmail,
  getAdminName,
  getAdminUsername,
} from "../auth/session";
import { AdminSettingsPanel } from "../components/AdminSettingsPanel";
import { AppUserInvitationManagement } from "../components/AppUserInvitationManagement";
import { ISPAdminInvitationManagement } from "../components/ISPAdminInvitationManagement";
import { ISPNotificationsPanel } from "../components/ISPNotificationsPanel";
import { AppUserManagement } from "../components/AppUserManagement";
import { SubscriptionPlanManagement } from "../components/SubscriptionPlanManagement";
import { RouterManagement } from "../components/RouterManagement";
import { ISPAdminMonitoringCenter } from "../components/ISPAdminMonitoringCenter";
import { ISPAdminOperationsCenter } from "../components/ISPAdminOperationsCenter";
import { ISPAdminNetworkActivityCenter } from "../components/ISPAdminNetworkActivityCenter";
import { ISPAdminIntelligenceCenter } from "../components/ISPAdminIntelligenceCenter";
import type { AdminTheme } from "../App.real";
import type { CurrentAdminResponse } from "../api/adminAuth";

type ISPSection =
  | "dashboard"
  | "monitoring"
  | "operations"
  | "network"
  | "intelligence"
  | "users"
  | "plans"
  | "routers"
  | "app_invitations"
  | "admin_invitations"
  | "settings";

const ISP_ACTIVE_SECTION_STORAGE_KEY = "pulsefi-isp-active-section";
const ISP_SETTINGS_RETURN_SECTION_STORAGE_KEY =
  "pulsefi-isp-settings-return-section";

const ispSectionIds: ISPSection[] = [
  "dashboard",
  "monitoring",
  "operations",
  "network",
  "intelligence",
  "users",
  "plans",
  "routers",
  "app_invitations",
  "admin_invitations",
  "settings",
];

function getInitialISPSection(): ISPSection {
  // Always open the ISP Admin dashboard on Overview after login.
  // Section persistence caused admins to land on the last saved section,
  // such as Routers, instead of starting from the main dashboard.
  return "dashboard";
}

function storeISPSection(section: ISPSection) {
  try {
    window.localStorage.setItem(ISP_ACTIVE_SECTION_STORAGE_KEY, section);
  } catch {
    // Ignore storage failures.
  }
}

function getInitialISPSettingsReturnSection(): Exclude<ISPSection, "settings"> {
  try {
    const savedSection = window.localStorage.getItem(
      ISP_SETTINGS_RETURN_SECTION_STORAGE_KEY
    );

    if (
      savedSection &&
      savedSection !== "settings" &&
      ispSectionIds.includes(savedSection as ISPSection)
    ) {
      return savedSection as Exclude<ISPSection, "settings">;
    }
  } catch {
    // Fall back to overview if storage is unavailable.
  }

  return "dashboard";
}

function storeISPSettingsReturnSection(section: ISPSection) {
  if (section === "settings") {
    return;
  }

  try {
    window.localStorage.setItem(ISP_SETTINGS_RETURN_SECTION_STORAGE_KEY, section);
  } catch {
    // Ignore storage failures.
  }
}

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
  settings: {
    title: "Settings",
    subtitle: "Manage appearance, account identity, and recovery.",
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
        <button
          className="pf-profile-row pf-brand-button"
          type="button"
          onClick={() => onNavigate("dashboard")}
          aria-label="Go to ISP Overview"
        >
          <div className="pf-profile-avatar">
            <span className="material-symbols-outlined">wifi</span>
          </div>

          <div>
            <h1>PulseFi</h1>
            <p>ISP Admin</p>
          </div>
        </button>

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
  onNavigate,
}: {
  adminName: string;
  activeSection: ISPSection;
  onNavigate: (section: ISPSection) => void;
}) {
  const copy = ispSectionCopy[activeSection];
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  function toggleNotifications() {
    setIsNotificationsOpen((current) => !current);
  }

  return (
    <header className="pf-topbar">
      <div className="pf-topbar-left">
        <div>
          <h2>{copy.title}</h2>
          <p>
            {copy.subtitle} - {adminName}
          </p>
        </div>
      </div>

      <div className="pf-topbar-actions">
        <button
          className={
            isNotificationsOpen
              ? "pf-icon-button pf-icon-button-active"
              : "pf-icon-button"
          }
          type="button"
          aria-label="Notifications"
          onClick={toggleNotifications}
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <button
          className={
            activeSection === "settings"
              ? "pf-icon-button pf-icon-button-active"
              : "pf-icon-button"
          }
          type="button"
          aria-label="Settings"
          onClick={() => onNavigate("settings")}
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      {isNotificationsOpen && (
        <ISPNotificationsPanel
          onClose={() => setIsNotificationsOpen(false)}
          onOpenMonitoring={() => onNavigate("monitoring")}
        />
      )}
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
      <ISPTopBar
        adminName={adminName}
        activeSection={activeSection}
        onNavigate={onNavigate}
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
      label: "Service Lines",
      icon: "assignment",
      value: summary.subscriptions.total,
      detail: `${summary.subscriptions.active} Active`,
      secondDetail: "Router-linked plans",
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
  page,
  pageCount,
  onPageChange,
}: {
  records: ISPAdminUsageRecord[];
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
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
        <>
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
          <AdminTablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={onPageChange}
          />
        </>
      )}
    </article>
  );
}

function RecentDeviceLogPreview({
  records,
  page,
  pageCount,
  onPageChange,
}: {
  records: ISPAdminDeviceConnectionLog[];
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <article className="pf-network-panel pf-overview-table-panel">
      <div className="pf-monitoring-panel-header">
        <h3>Device Connection Logs</h3>
      </div>

      {records.length === 0 ? (
        <div className="pf-empty-state">
          <span className="material-symbols-outlined">devices</span>
          <h3>No device events</h3>
          <p>Connection events will appear here after devices report activity.</p>
        </div>
      ) : (
        <>
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
              {records.map((log) => (
                <tr key={log.id}>
                  <td>{formatLabel(log.event_type)}</td>
                  <td>{log.ip_address ?? "-"}</td>
                  <td className="pf-time-cell">{formatDateTime(log.event_time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          <AdminTablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={onPageChange}
          />
        </>
      )}
    </article>
  );
}

function RecentRouterActionPreview({
  records,
  page,
  pageCount,
  onPageChange,
}: {
  records: ISPAdminRouterActionLog[];
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <article className="pf-network-panel pf-overview-table-panel pf-overview-table-panel-wide">
      <div className="pf-monitoring-panel-header">
        <h3>Router Action Logs</h3>
      </div>

      {records.length === 0 ? (
        <div className="pf-empty-state">
          <span className="material-symbols-outlined">rule_settings</span>
          <h3>No router actions</h3>
          <p>Router policy action logs will appear here after actions run.</p>
        </div>
      ) : (
        <>
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
              {records.map((log) => (
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
          <AdminTablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={onPageChange}
          />
        </>
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
  const [usagePage, setUsagePage] = useState(1);
  const [deviceLogPage, setDeviceLogPage] = useState(1);
  const [routerActionPage, setRouterActionPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadRecentActivity() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [usageData, deviceData, routerActionData] = await Promise.all([
        listISPAdminUsageRecords(25, 0),
        listISPAdminDeviceConnectionLogs(25, 0),
        listISPAdminRouterActionLogs(null, 25, 0),
      ]);

      setUsageRecords(usageData);
      setDeviceLogs(deviceData);
      setRouterActionLogs(routerActionData);
      setUsagePage(1);
      setDeviceLogPage(1);
      setRouterActionPage(1);
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

  const usagePagination = paginateRows(usageRecords, usagePage);
  const deviceLogPagination = paginateRows(deviceLogs, deviceLogPage);
  const routerActionPagination = paginateRows(
    routerActionLogs,
    routerActionPage
  );

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
          <RecentUsagePreview
            records={usagePagination.pageRows}
            page={usagePagination.safePage}
            pageCount={usagePagination.pageCount}
            onPageChange={setUsagePage}
          />
          <RecentDeviceLogPreview
            records={deviceLogPagination.pageRows}
            page={deviceLogPagination.safePage}
            pageCount={deviceLogPagination.pageCount}
            onPageChange={setDeviceLogPage}
          />
          <RecentRouterActionPreview
            records={routerActionPagination.pageRows}
            page={routerActionPagination.safePage}
            pageCount={routerActionPagination.pageCount}
            onPageChange={setRouterActionPage}
          />
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
  onSetTheme,
  onAdminUpdated,
  onLogout,
}: {
  theme: AdminTheme;
  onSetTheme: (theme: AdminTheme) => void;
  onAdminUpdated: (admin: CurrentAdminResponse) => void;
  onLogout: () => void;
}) {
  const [summary, setSummary] = useState<ISPAdminSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeSection, setActiveSection] = useState<ISPSection>(getInitialISPSection);
  const [settingsReturnSection, setSettingsReturnSection] = useState<
    Exclude<ISPSection, "settings">
  >(getInitialISPSettingsReturnSection);

  const adminName = getAdminName("ISP Admin");

  useEffect(() => {
    storeISPSection(activeSection);
  }, [activeSection]);

  function handleNavigate(section: ISPSection) {
    if (section === "settings") {
      if (activeSection === "settings") {
        setActiveSection(settingsReturnSection);
        return;
      }

      setSettingsReturnSection(activeSection);
      storeISPSettingsReturnSection(activeSection);

      setActiveSection("settings");
      return;
    }

    setActiveSection(section);
  }

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
      onNavigate={handleNavigate}
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
            <OverviewActionCenter onNavigate={handleNavigate} />
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

      {activeSection === "settings" && (
        <AdminSettingsPanel
          adminName={getAdminName("ISP Admin")}
          adminEmail={getAdminEmail()}
          adminUsername={getAdminUsername()}
          roleLabel="ISP Admin"
          activeSectionLabel={ispSectionCopy[settingsReturnSection].title}
          theme={theme}
          shortcuts={[
            { label: "Overview", section: "dashboard" },
            { label: "Users", section: "users" },
            { label: "App User Invitations", section: "app_invitations" },
            { label: "Monitoring", section: "monitoring" },
            { label: "Network Activity", section: "network" },
          ]}
          onSetTheme={onSetTheme}
          onNavigate={handleNavigate}
          onAdminUpdated={onAdminUpdated}
          onLogout={handleLogout}
        />
      )}
    </ISPShell>
  );
}
