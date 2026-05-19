import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { getErrorMessage } from "../api/errors";
import {
  createISP,
  createISPAdminInvitation,
  getPlatformAdminSummary,
  listISPs,
  updateISP,
} from "../api/platformAdmin";
import type {
  CreateISPRequest,
  ISP,
  ISPAdminInvitation,
  ISPStatus,
  PlatformAdminSummary,
  UpdateISPRequest,
} from "../api/platformAdmin";
import { clearSession, getAdminName } from "../auth/session";
import { PlatformISPAdminManagement } from "../components/PlatformISPAdminManagement";
import { PlatformISPAdminInvitationManagement } from "../components/PlatformISPAdminInvitationManagement";
import type { AdminTheme } from "../App.real";

type PlatformSection =
  | "dashboard"
  | "isps"
  | "admins"
  | "system_health";

const platformSectionCopy: Record<
  PlatformSection,
  { title: string; subtitle: string }
> = {
  dashboard: {
    title: "Platform Overview",
    subtitle: "Signed in as Platform Admin",
  },
  isps: {
    title: "ISP Management",
    subtitle: "Create, update, and review ISP records.",
  },
  admins: {
    title: "ISP Admin Accounts",
    subtitle: "Review and update ISP Admin accounts for the selected ISP.",
  },
  system_health: {
    title: "System Health",
    subtitle: "Review admin-session and backend-readiness signals.",
  },
};

function PlatformSidebar({
  activeSection,
  onNavigate,
  onLogout,
}: {
  activeSection: PlatformSection;
  onNavigate: (section: PlatformSection) => void;
  onLogout: () => void;
}) {
  const navItems: Array<{
    id: PlatformSection;
    label: string;
    icon: string;
  }> = [
    { id: "dashboard", label: "Overview", icon: "dashboard" },
    { id: "isps", label: "ISPs", icon: "router" },
    { id: "admins", label: "ISP Admin Accounts", icon: "admin_panel_settings" },
    { id: "system_health", label: "System Health", icon: "monitor_heart" },
  ];

  return (
    <nav className="pf-sidebar" aria-label="Platform Admin navigation">
      <div className="pf-sidebar-head">
        <div className="pf-profile-row">
          <div className="pf-profile-avatar">
            <span className="material-symbols-outlined">person</span>
          </div>

          <div>
            <h1>PulseFi</h1>
            <p>Platform Owner</p>
          </div>
        </div>

        <button
          className="pf-quick-action"
          type="button"
          onClick={() => onNavigate("isps")}
        >
          <span className="material-symbols-outlined">add</span>
          New ISP
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

function PlatformTopBar({
  adminName,
  activeSection,
  theme,
  onToggleTheme,
}: {
  adminName: string;
  activeSection: PlatformSection;
  theme: AdminTheme;
  onToggleTheme: () => void;
}) {
  const copy = platformSectionCopy[activeSection];
  return (
    <header className="pf-topbar">
      <div className="pf-topbar-left">
        <div>
          <h2>{copy.title}</h2>
          <p>{copy.subtitle} - {adminName}</p>
        </div>

        <label className="pf-dashboard-search">
          <span className="material-symbols-outlined">search</span>
          <input placeholder="Search platform..." />
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

function PlatformShell({
  adminName,
  activeSection,
  theme,
  onNavigate,
  onToggleTheme,
  onLogout,
  children,
}: {
  adminName: string;
  activeSection: PlatformSection;
  theme: AdminTheme;
  onNavigate: (section: PlatformSection) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <div className="pf-dashboard-shell">
      <PlatformSidebar
        activeSection={activeSection}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <PlatformTopBar
        adminName={adminName}
        activeSection={activeSection}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <main className="pf-dashboard-main">{children}</main>
    </div>
  );
}

function SummaryCards({ summary }: { summary: PlatformAdminSummary }) {
  const cards: Array<{
    label: string;
    icon: string;
    value: string | number;
    details: string[];
  }> = [
    {
      label: "Total ISPs",
      icon: "router",
      value: summary.total_isps,
      details: [
        `${summary.active_isps} Active`,
        `${summary.inactive_isps} Inactive`,
        `${summary.suspended_isps} Suspended`,
      ],
    },
    {
      label: "ISP Admins",
      icon: "admin_panel_settings",
      value: summary.total_isp_admins,
      details: [
        `${summary.active_isp_admins} Active`,
        `${summary.inactive_isp_admins} Inactive`,
        `${summary.suspended_isp_admins} Suspended`,
      ],
    },
    {
      label: "App Users",
      icon: "group",
      value: summary.total_app_users,
      details: [
        `${summary.active_app_users} Active`,
        `${summary.inactive_app_users} Inactive`,
        `${summary.suspended_app_users} Suspended`,
      ],
    },
    {
      label: "Platform Readiness",
      icon: "monitor_heart",
      value: "Review",
      details: ["Auth/API notes", "No synthetic metrics"],
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
              {card.details.map((detail) => (
                <span key={detail}>{detail}</span>
              ))}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function PlatformReadinessPanel() {
  return (
    <section className="pf-content-card pf-platform-readiness-panel">
      <div className="pf-panel-title-row">
        <div>
          <h2>Platform Readiness</h2>
          <p>Honest admin-web readiness notes from the current frontend contract.</p>
        </div>
        <span className="pf-health-pill">Backend-backed</span>
      </div>

      <div className="pf-alert-list">
        <article className="pf-alert-item pf-alert-info">
          <span className="material-symbols-outlined">verified_user</span>
          <div>
            <h3>Admin Session Guarded</h3>
            <p>Only backend-authenticated Platform Admins reach this dashboard.</p>
            <small>Auth route: /auth/me</small>
          </div>
        </article>

        <article className="pf-alert-item pf-alert-info">
          <span className="material-symbols-outlined">router</span>
          <div>
            <h3>ISP Management Connected</h3>
            <p>ISP records, ISP Admin invitations, and ISP Admin accounts use backend routes.</p>
            <small>Platform Admin API</small>
          </div>
        </article>

        <article className="pf-alert-item pf-alert-info">
          <span className="material-symbols-outlined">mail</span>
          <div>
            <h3>Invitation Tokens Protected</h3>
            <p>Invitation tokens are only shown when the backend returns a local DEBUG token.</p>
            <small>Email delivery contract</small>
          </div>
        </article>

        <article className="pf-alert-item pf-alert-info">
          <span className="material-symbols-outlined">analytics</span>
          <div>
            <h3>No Synthetic Health Metrics</h3>
            <p>
              This panel does not invent latency, incident, or critical alert
              counts that are not returned by the backend.
            </p>
            <small>Readiness notes only</small>
          </div>
        </article>
      </div>
    </section>
  );
}

function PlatformActionCenter({
  selectedISP,
  onNavigate,
}: {
  selectedISP: ISP | null;
  onNavigate: (section: PlatformSection) => void;
}) {
  const actions: Array<{
    section: PlatformSection;
    icon: string;
    title: string;
    description: string;
  }> = [
    {
      section: "isps",
      icon: "router",
      title: "ISP Management",
      description: "Create, list, select, and update ISP records.",
    },
    {
      section: "admins",
      icon: "admin_panel_settings",
      title: "ISP Admin Accounts",
      description: selectedISP
        ? `List, select, and update admin accounts for ${selectedISP.name}.`
        : "Select an ISP, then list, select, and update admin accounts.",
    },
    {
      section: "system_health",
      icon: "monitor_heart",
      title: "System Health",
      description: "Read admin-session, API contract, and readiness notes.",
    },
  ];

  return (
    <section className="pf-content-card pf-platform-workflow-panel">
      <div className="pf-panel-title-row">
        <div>
          <h2>Platform Workflows</h2>
          <p>
            These are shortcuts. Full forms, tables, filters, and update flows
            remain inside each section.
          </p>
        </div>
      </div>

      <div className="pf-overview-action-grid pf-platform-action-grid">
        {actions.map((action) => (
          <button
            className="pf-overview-action-button"
            key={action.section}
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

      <div className="pf-platform-feature-strip" aria-label="Platform feature coverage">
        <span>ISP create/list/update</span>
        <span>ISP Admin invitations inside ISPs</span>
        <span>Admin accounts list/select/update</span>
        <span>Readiness notes</span>
      </div>
    </section>
  );
}

function ISPManagement({
  onDataChanged,
  selectedISP,
  onSelectedISPChange,
}: {
  onDataChanged: () => Promise<void>;
  selectedISP: ISP | null;
  onSelectedISPChange: (isp: ISP | null) => void;
}) {
  const [isps, setIsps] = useState<ISP[]>([]);

  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  const [editName, setEditName] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStatus, setEditStatus] = useState<ISPStatus>("active");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteDays, setInviteDays] = useState(7);
  const [latestInvitation, setLatestInvitation] =
    useState<ISPAdminInvitation | null>(null);
  const [invitationRefreshKey, setInvitationRefreshKey] = useState(0);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  async function loadISPs() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await listISPs();
      setIsps(data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load ISPs."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialISPs() {
      try {
        const data = await listISPs();

        if (!isCancelled) {
          setIsps(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error, "Could not load ISPs."));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadInitialISPs();

    return () => {
      isCancelled = true;
    };
  }, []);

  function chooseISP(isp: ISP) {
    onSelectedISPChange(isp);
    setEditName(isp.name);
    setEditContactEmail(isp.contact_email ?? "");
    setEditPhoneNumber(isp.phone_number ?? "");
    setEditAddress(isp.address ?? "");
    setEditStatus(isp.status);
    setLatestInvitation(null);
    setErrorMessage("");
    setSuccessMessage(`Selected ISP: ${isp.name}`);
  }

  async function handleCreateISP(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreating(true);

    const payload: CreateISPRequest = {
      name,
      contact_email: contactEmail || null,
      phone_number: phoneNumber || null,
      address: address || null,
    };

    try {
      const created = await createISP(payload);
      setIsps((current) => [created, ...current]);
      setName("");
      setContactEmail("");
      setPhoneNumber("");
      setAddress("");
      chooseISP(created);
      setSuccessMessage(
        `Created ISP record: ${created.name}. You can now invite its ISP Admin.`
      );
      await onDataChanged();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not create ISP."));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateISP(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedISP) {
      setErrorMessage("Select an ISP first.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsUpdating(true);

    const payload: UpdateISPRequest = {
      name: editName,
      contact_email: editContactEmail || null,
      phone_number: editPhoneNumber || null,
      address: editAddress || null,
      status: editStatus,
    };

    try {
      const updated = await updateISP(selectedISP.id, payload);
      setIsps((current) =>
        current.map((isp) => (isp.id === updated.id ? updated : isp))
      );
      chooseISP(updated);
      setSuccessMessage(`Updated ISP: ${updated.name}`);
      await onDataChanged();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not update ISP."));
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleInviteISPAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedISP) {
      setErrorMessage("Select an ISP before sending an ISP Admin invitation.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setLatestInvitation(null);
    setIsInviting(true);

    try {
      const invitation = await createISPAdminInvitation(selectedISP.id, {
        email: inviteEmail,
        full_name: inviteFullName || null,
        expires_in_days: inviteDays,
      });

      setLatestInvitation(invitation);
      setInviteEmail("");
      setInviteFullName("");
      setInviteDays(7);
      setSuccessMessage(`Invitation created for ${invitation.email}.`);
      setInvitationRefreshKey((current) => current + 1);
      await onDataChanged();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not create ISP Admin invitation.")
      );
    } finally {
      setIsInviting(false);
    }
  }

  return (
    <>
      <section className="pf-content-card pf-platform-isp-management">
        <div className="pf-panel-title-row">
          <div>
            <h2>ISP Management</h2>
            <p>Create ISP records, select an ISP, and invite the first ISP Admin.</p>
          </div>

          <button
            className="pf-view-link pf-refresh-button"
            type="button"
            onClick={loadISPs}
          >
            Refresh
          </button>
        </div>

        <div className="pf-selected-strip">
          <strong>Selected ISP:</strong>{" "}
          {selectedISP ? selectedISP.name : "None selected yet"}
        </div>

        <div className="pf-management-grid pf-platform-isp-form-grid">
          <form className="pf-management-form" onSubmit={handleCreateISP}>
            <h3>Create ISP record</h3>
            <p>This creates the company/ISP container.</p>

            <label>
              ISP name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Example ISP"
                required
              />
            </label>

            <label>
              Contact email
              <input
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="contact@example.com"
                type="email"
              />
            </label>

            <label>
              Phone number
              <input
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+961..."
              />
            </label>

            <label>
              Address
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Lebanon"
              />
            </label>

            <button disabled={isCreating}>
              {isCreating ? "Creating..." : "Create ISP record"}
            </button>
          </form>

          <form className="pf-management-form" onSubmit={handleInviteISPAdmin}>
            <h3>Invite ISP Admin</h3>
            <p>The invited admin accepts the link and creates their login.</p>

            {!selectedISP && (
              <p className="pf-warning-text">Select an ISP from the table first.</p>
            )}

            <label>
              ISP Admin email
              <input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="admin@example.com"
                type="email"
                required
                disabled={!selectedISP}
              />
            </label>

            <label>
              Full name
              <input
                value={inviteFullName}
                onChange={(event) => setInviteFullName(event.target.value)}
                placeholder="Admin full name"
                disabled={!selectedISP}
              />
            </label>

            <label>
              Expires in days
              <input
                value={inviteDays}
                onChange={(event) => setInviteDays(Number(event.target.value))}
                type="number"
                min={1}
                max={30}
                disabled={!selectedISP}
              />
            </label>

            <button disabled={!selectedISP || isInviting}>
              {isInviting ? "Creating invitation..." : "Create invitation"}
            </button>

            {latestInvitation?.dev_invitation_token && (
              <div className="pf-dev-box">
                <strong>Local DEBUG invitation token</strong>
                <code>{latestInvitation.dev_invitation_token}</code>
                <small>
                  In production, this is sent by email. Locally, use this token
                  with the invitation accept screen/API.
                </small>
              </div>
            )}
          </form>

          <form
            className="pf-management-form pf-platform-isp-edit-form"
            onSubmit={handleUpdateISP}
          >
            <h3>Edit selected ISP</h3>

            {!selectedISP && (
              <p>Select an ISP from the table to edit it.</p>
            )}

            {selectedISP && (
              <>
                <label>
                  ISP name
                  <input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Contact email
                  <input
                    value={editContactEmail}
                    onChange={(event) => setEditContactEmail(event.target.value)}
                    type="email"
                  />
                </label>

                <label>
                  Phone number
                  <input
                    value={editPhoneNumber}
                    onChange={(event) => setEditPhoneNumber(event.target.value)}
                  />
                </label>

                <label>
                  Address
                  <input
                    value={editAddress}
                    onChange={(event) => setEditAddress(event.target.value)}
                  />
                </label>

                <label>
                  Status
                  <select
                    value={editStatus}
                    onChange={(event) =>
                      setEditStatus(event.target.value as ISPStatus)
                    }
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="suspended">suspended</option>
                  </select>
                </label>

                <button disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update ISP"}
                </button>
              </>
            )}
          </form>
        </div>

        {errorMessage && <div className="pf-error-box">{errorMessage}</div>}
        {successMessage && <div className="pf-success-box">{successMessage}</div>}

        {isLoading && <p className="pf-loading-text">Loading ISPs...</p>}

        {!isLoading && (
          <div className="pf-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ISP</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {isps.map((isp) => (
                  <tr
                    key={isp.id}
                    className={
                      selectedISP?.id === isp.id
                        ? "selected-row"
                        : "clickable-row"
                    }
                    onClick={() => chooseISP(isp)}
                  >
                    <td>
                      <span className="pf-table-icon">
                        <span className="material-symbols-outlined">router</span>
                      </span>
                      {isp.name}
                    </td>
                    <td>{isp.contact_email ?? "-"}</td>
                    <td>
                      <span className={`status-pill status-${isp.status}`}>
                        {isp.status}
                      </span>
                    </td>
                    <td>{new Date(isp.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="small-button"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          chooseISP(isp);
                        }}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}

                {isps.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      No ISPs yet. Create an ISP record above to start the admin
                      demo flow.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PlatformISPAdminInvitationManagement
        selectedISP={selectedISP}
        refreshKey={invitationRefreshKey}
      />
    </>
  );
}

export default function PlatformAdminDashboard({
  theme,
  onToggleTheme,
  onLogout,
}: {
  theme: AdminTheme;
  onToggleTheme: () => void;
  onLogout: () => void;
}) {
  const [summary, setSummary] = useState<PlatformAdminSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeSection, setActiveSection] =
    useState<PlatformSection>("dashboard");
  const [selectedISP, setSelectedISP] = useState<ISP | null>(null);

  const adminName = getAdminName("Admin");

  async function loadSummary() {
    try {
      const data = await getPlatformAdminSummary();
      setSummary(data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Could not load summary."));
    }
  }

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialSummary() {
      try {
        const data = await getPlatformAdminSummary();

        if (!isCancelled) {
          setSummary(data);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error, "Could not load summary."));
        }
      }
    }

    loadInitialSummary();

    return () => {
      isCancelled = true;
    };
  }, []);

  function handleLogout() {
    clearSession();
    onLogout();
  }

  return (
    <PlatformShell
      activeSection={activeSection}
      adminName={adminName}
      theme={theme}
      onNavigate={setActiveSection}
      onToggleTheme={onToggleTheme}
      onLogout={handleLogout}
    >
      {errorMessage && <div className="pf-error-box">{errorMessage}</div>}

      {!summary && !errorMessage && (
        <p className="pf-loading-text">Loading summary...</p>
      )}

      {activeSection === "dashboard" && (
        <>
          {summary && <SummaryCards summary={summary} />}

          <div className="pf-selected-strip pf-platform-context-strip">
            <strong>Selected ISP:</strong>{" "}
            {selectedISP
              ? `${selectedISP.name} - invitation and admin account workflows are scoped to this ISP.`
              : "None selected. Use ISP Management first for scoped invitation and admin account workflows."}
          </div>

          <section className="pf-overview-grid pf-platform-overview-grid">
            <PlatformActionCenter
              selectedISP={selectedISP}
              onNavigate={setActiveSection}
            />
            <PlatformReadinessPanel />
          </section>
        </>
      )}

      {activeSection === "isps" && (
        <ISPManagement
          onDataChanged={loadSummary}
          selectedISP={selectedISP}
          onSelectedISPChange={setSelectedISP}
        />
      )}

      {activeSection === "admins" && (
        <PlatformISPAdminManagement selectedISP={selectedISP} />
      )}

      {activeSection === "system_health" && (
        <PlatformReadinessPanel />
      )}
    </PlatformShell>
  );
}
