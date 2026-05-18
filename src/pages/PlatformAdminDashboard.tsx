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
import { PlatformISPAdminInvitationManagement } from "../components/PlatformISPAdminInvitationManagement";

type PlatformSection =
  | "dashboard"
  | "isps"
  | "admins"
  | "invitations"
  | "system_health"
  | "settings";

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
    subtitle: "Review admin-account surfaces supported by the backend.",
  },
  invitations: {
    title: "ISP Admin Invitations",
    subtitle: "Track ISP Admin invitation workflows.",
  },
  system_health: {
    title: "System Health",
    subtitle: "Monitor API, security, and platform status.",
  },
  settings: {
    title: "Settings",
    subtitle: "Platform configuration area.",
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
    { id: "invitations", label: "ISP Admin Invitations", icon: "mail" },
    { id: "admins", label: "ISP Admin Accounts", icon: "admin_panel_settings" },
    { id: "system_health", label: "System Health", icon: "monitor_heart" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  return (
    <nav className="stitch-sidebar" aria-label="Platform Admin navigation">
      <div className="stitch-sidebar-head">
        <div className="stitch-profile-row">
          <div className="stitch-profile-avatar">
            <span className="material-symbols-outlined">person</span>
          </div>

          <div>
            <h1>PulseFi</h1>
            <p>Platform Owner</p>
          </div>
        </div>

        <button
          className="stitch-quick-action"
          type="button"
          onClick={() => onNavigate("isps")}
        >
          <span className="material-symbols-outlined">add</span>
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

function PlatformTopBar({
  adminName,
  activeSection,
}: {
  adminName: string;
  activeSection: PlatformSection;
}) {
  const copy = platformSectionCopy[activeSection];
  return (
    <header className="stitch-topbar">
      <div className="stitch-topbar-left">
        <div>
          <h2>{copy.title}</h2>
          <p>{copy.subtitle} - {adminName}</p>
        </div>

        <label className="stitch-dashboard-search">
          <span className="material-symbols-outlined">search</span>
          <input placeholder="Search platform..." />
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

function PlatformShell({
  adminName,
  activeSection,
  onNavigate,
  onLogout,
  children,
}: {
  adminName: string;
  activeSection: PlatformSection;
  onNavigate: (section: PlatformSection) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <div className="stitch-dashboard-shell">
      <PlatformSidebar
        activeSection={activeSection}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <PlatformTopBar adminName={adminName} activeSection={activeSection} />

      <main className="stitch-dashboard-main">{children}</main>
    </div>
  );
}

function SummaryCards({ summary }: { summary: PlatformAdminSummary }) {
  const cards = [
    {
      label: "Total ISPs",
      icon: "router",
      value: summary.total_isps,
      detail: `${summary.active_isps} Active`,
      secondDetail: `${summary.total_isps - summary.active_isps} Inactive`,
    },
    {
      label: "ISP Admins",
      icon: "admin_panel_settings",
      value: summary.total_isp_admins,
      detail: `${summary.active_isp_admins} Active`,
      secondDetail: "Platform managed",
    },
    {
      label: "App Users",
      icon: "group",
      value: summary.total_app_users,
      detail: `${summary.active_app_users} Active`,
      secondDetail: "Across all ISPs",
    },
    {
      label: "System Health",
      icon: "monitor_heart",
      value: "Healthy",
      detail: "Local checks OK",
      secondDetail: "API connected",
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

function PlatformAlerts() {
  return (
    <aside className="stitch-alerts-panel">
      <div className="stitch-panel-title-row">
        <h2>Platform Alerts</h2>
        <span className="stitch-critical-pill">2 Critical</span>
      </div>

      <div className="stitch-alert-list">
        <article className="stitch-alert-item stitch-alert-warning">
          <span className="material-symbols-outlined">warning</span>
          <div>
            <h3>API Latency Spike</h3>
            <p>Average response time exceeded the local monitoring target.</p>
            <small>15 mins ago</small>
          </div>
        </article>

        <article className="stitch-alert-item stitch-alert-warning">
          <span className="material-symbols-outlined">storage</span>
          <div>
            <h3>Storage Capacity Warning</h3>
            <p>Database capacity monitor placeholder for production telemetry.</p>
            <small>1 hour ago</small>
          </div>
        </article>

        <article className="stitch-alert-item stitch-alert-info">
          <span className="material-symbols-outlined">verified_user</span>
          <div>
            <h3>Admin MFA Active</h3>
            <p>Admin sessions are routed by backend role and MFA state.</p>
            <small>Security checkpoint</small>
          </div>
        </article>
      </div>
    </aside>
  );
}

function PlatformOverviewRoutes({
  selectedISP,
  onNavigate,
}: {
  selectedISP: ISP | null;
  onNavigate: (section: PlatformSection) => void;
}) {
  const routes: Array<{
    section: PlatformSection;
    icon: string;
    title: string;
    description: string;
    meta: string;
  }> = [
    {
      section: "isps",
      icon: "router",
      title: "ISPs",
      description: "Create ISP records, select an ISP, and update status.",
      meta: selectedISP ? `Selected: ${selectedISP.name}` : "Select ISP",
    },
    {
      section: "invitations",
      icon: "mail",
      title: "ISP Admin Invitations",
      description: "Review and revoke invitations for the selected ISP.",
      meta: selectedISP ? "Scoped" : "Needs ISP",
    },
    {
      section: "admins",
      icon: "admin_panel_settings",
      title: "ISP Admin Accounts",
      description: "Reserved for account listing once the backend route exists.",
      meta: "No route yet",
    },
    {
      section: "system_health",
      icon: "monitor_heart",
      title: "System Health",
      description: "View platform health placeholders and admin-session signals.",
      meta: "Status",
    },
  ];

  return (
    <section className="stitch-content-card stitch-overview-route-panel">
      <div className="stitch-panel-title-row">
        <div>
          <h2>Platform Sections</h2>
          <p>Use one section at a time for a cleaner admin workflow.</p>
        </div>
      </div>

      <div className="stitch-overview-route-list">
        {routes.map((route) => (
          <button
            className="stitch-overview-route-row"
            key={route.section}
            type="button"
            onClick={() => onNavigate(route.section)}
          >
            <span className="material-symbols-outlined">{route.icon}</span>
            <span className="stitch-overview-route-copy">
              <strong>{route.title}</strong>
              <span>{route.description}</span>
            </span>
            <span className="stitch-overview-route-meta">{route.meta}</span>
          </button>
        ))}
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
    <section className="stitch-content-card">
      <div className="stitch-panel-title-row">
        <div>
          <h2>Recent ISP Activity</h2>
          <p>Manage ISP records, admin invitations, and ISP status.</p>
        </div>

        <button className="stitch-view-link" type="button" onClick={loadISPs}>
          Refresh
        </button>
      </div>

      <div className="stitch-selected-strip">
        <strong>Selected ISP:</strong>{" "}
        {selectedISP ? selectedISP.name : "None selected yet"}
      </div>

      <div className="stitch-management-grid">
        <form className="stitch-management-form" onSubmit={handleCreateISP}>
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

        <form className="stitch-management-form" onSubmit={handleInviteISPAdmin}>
          <h3>Invite ISP Admin</h3>
          <p>The invited admin accepts the link and creates their login.</p>

          {!selectedISP && (
            <p className="stitch-warning-text">Select an ISP from the table first.</p>
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
            <div className="stitch-dev-box">
              <strong>Local DEBUG invitation token</strong>
              <code>{latestInvitation.dev_invitation_token}</code>
              <small>
                In production, this is sent by email. Locally, use this token
                with the invitation accept screen/API.
              </small>
            </div>
          )}
        </form>

        <form className="stitch-management-form" onSubmit={handleUpdateISP}>
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

      {errorMessage && <div className="stitch-error-box">{errorMessage}</div>}
      {successMessage && <div className="stitch-success-box">{successMessage}</div>}

      {isLoading && <p className="stitch-loading-text">Loading ISPs...</p>}

      {!isLoading && (
        <div className="stitch-table-wrap">
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
                    selectedISP?.id === isp.id ? "selected-row" : "clickable-row"
                  }
                  onClick={() => chooseISP(isp)}
                >
                  <td>
                    <span className="stitch-table-icon">
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
                  <td colSpan={5}>No ISPs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PlatformPlaceholder({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <section className="stitch-content-card stitch-placeholder-card">
      <span className="material-symbols-outlined">{icon}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

export default function PlatformAdminDashboard({
  onLogout,
}: {
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
      onNavigate={setActiveSection}
      onLogout={handleLogout}
    >
      {errorMessage && <div className="stitch-error-box">{errorMessage}</div>}

      {!summary && !errorMessage && (
        <p className="stitch-loading-text">Loading summary...</p>
      )}

      {activeSection === "dashboard" && (
        <>
          {summary && <SummaryCards summary={summary} />}

          <section className="stitch-bento-grid">
            <PlatformOverviewRoutes
              selectedISP={selectedISP}
              onNavigate={setActiveSection}
            />
            <PlatformAlerts />
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
        <PlatformPlaceholder
          icon="admin_panel_settings"
          title="ISP Admin Accounts"
          description="This section will list ISP Admin accounts once a dedicated backend route exists."
        />
      )}

      {activeSection === "invitations" && (
        <PlatformISPAdminInvitationManagement selectedISP={selectedISP} />
      )}

      {activeSection === "system_health" && (
        <section className="stitch-bento-grid">
          <PlatformPlaceholder
            icon="monitor_heart"
            title="System Health"
            description="This section will connect to live platform health, API, database, and job status checks later."
          />
          <PlatformAlerts />
        </section>
      )}

      {activeSection === "settings" && (
        <PlatformPlaceholder
          icon="settings"
          title="Platform Settings"
          description="This section will hold platform-level settings after the backend settings contract is added."
        />
      )}
    </PlatformShell>
  );
}
