import { useState } from "react";
import "./pulsefi-white-design.css";

const navItems = [
  "Overview",
  "ISPs",
  "ISP Admins",
  "Invitations",
  "System Health",
  "Settings",
];

const isps = [
  {
    name: "Beirut FiberNet",
    email: "contact@beirutfiber.example",
    phone: "+961 1 000 111",
    status: "Active",
    admins: 4,
    users: 482,
    routers: 421,
    subscriptions: 398,
    created: "Jan 12, 2026",
    address: "Beirut, Lebanon",
  },
  {
    name: "Saida Connect",
    email: "support@saidaconnect.example",
    phone: "+961 7 000 222",
    status: "Active",
    admins: 3,
    users: 319,
    routers: 287,
    subscriptions: 264,
    created: "Feb 4, 2026",
    address: "Saida, Lebanon",
  },
  {
    name: "NorthLine ISP",
    email: "hello@northline.example",
    phone: "+961 6 000 333",
    status: "Inactive",
    admins: 2,
    users: 156,
    routers: 132,
    subscriptions: 119,
    created: "Mar 18, 2026",
    address: "Tripoli, Lebanon",
  },
];

const admins = [
  {
    name: "Hassan Daher",
    email: "hassan@beirutfiber.example",
    username: "hassandaher",
    isp: "Beirut FiberNet",
    status: "Active",
    mfa: "Enabled",
    created: "Jan 14, 2026",
  },
  {
    name: "Maya Saleh",
    email: "maya@saidaconnect.example",
    username: "mayasaleh",
    isp: "Saida Connect",
    status: "Active",
    mfa: "Enabled",
    created: "Feb 6, 2026",
  },
  {
    name: "Omar Nasser",
    email: "omar@northline.example",
    username: "omarnasser",
    isp: "NorthLine ISP",
    status: "Pending",
    mfa: "Not set",
    created: "Mar 20, 2026",
  },
];

const invitations = [
  {
    name: "Rami Haddad",
    email: "rami@beirutfiber.example",
    isp: "Beirut FiberNet",
    status: "Pending",
    expires: "5 days",
    created: "Today",
  },
  {
    name: "Lina Fares",
    email: "lina@saidaconnect.example",
    isp: "Saida Connect",
    status: "Accepted",
    expires: "Completed",
    created: "Yesterday",
  },
  {
    name: "Nour Khalil",
    email: "nour@northline.example",
    isp: "NorthLine ISP",
    status: "Expired",
    expires: "Expired",
    created: "Last week",
  },
];

type ISP = (typeof isps)[number];
type ISPAdmin = (typeof admins)[number];
type Invitation = (typeof invitations)[number];

type DetailPage =
  | { type: "none" }
  | { type: "isp"; isp: ISP }
  | { type: "isp-form"; isp?: ISP }
  | { type: "admin"; admin: ISPAdmin }
  | { type: "invitation"; invitation: Invitation };

function StatusBadge({
  label,
  type,
}: {
  label: string;
  type: "success" | "warning" | "error";
}) {
  return <span className={`pf-status ${type}`}>{label}</span>;
}

function statusType(status: string): "success" | "warning" | "error" {
  if (status === "Active" || status === "Accepted" || status === "Enabled" || status === "Healthy") {
    return "success";
  }

  if (status === "Inactive" || status === "Expired" || status === "Failed" || status === "Not set") {
    return "error";
  }

  return "warning";
}

function PageHeader({
  eyebrow,
  title,
  description,
  primaryAction,
  onPrimaryAction,
}: {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction?: string;
  onPrimaryAction?: () => void;
}) {
  return (
    <header className="pf-header">
      <div>
        <div className="pf-eyebrow">{eyebrow}</div>
        <h1 className="pf-title">{title}</h1>
        <p className="pf-description">{description}</p>
      </div>

      <div className="pf-actions">
        <button className="pf-button">Export</button>
        {primaryAction ? (
          <button
            className="pf-button primary"
            data-design-route={onPrimaryAction ? "true" : undefined}
            onClick={onPrimaryAction}
          >
            {primaryAction}
          </button>
        ) : null}
      </div>
    </header>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button className="pf-back-button pf-web-back-button" data-design-route="true" onClick={onBack}>
      ← Back
    </button>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="pf-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OverviewPage({ onCreateISP }: { onCreateISP: () => void }) {
  return (
    <>
      <PageHeader
        eyebrow="Platform Admin Dashboard"
        title="Platform overview"
        description="Monitor ISPs, ISP admin accounts, invitations, and platform health across PulseFi."
        primaryAction="Create ISP"
        onPrimaryAction={onCreateISP}
      />

      <section className="pf-grid cols-4">
        <div className="pf-card">
          <div className="pf-metric-label">Total ISPs</div>
          <div className="pf-metric-value">8</div>
          <div className="pf-metric-note">7 active, 1 inactive</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">ISP admins</div>
          <div className="pf-metric-value">21</div>
          <div className="pf-metric-note">Across all ISPs</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">Pending invitations</div>
          <div className="pf-metric-value">4</div>
          <div className="pf-metric-note">Waiting for admin setup</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">API status</div>
          <div className="pf-metric-value">Healthy</div>
          <div className="pf-metric-note">Last checked 2 minutes ago</div>
        </div>
      </section>

      <section className="pf-section pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">Recent ISP activity</h2>
          <table className="pf-table">
            <tbody>
              <tr>
                <td>Beirut FiberNet added a new ISP admin</td>
                <td>Today</td>
              </tr>
              <tr>
                <td>Saida Connect accepted an invitation</td>
                <td>Yesterday</td>
              </tr>
              <tr>
                <td>NorthLine ISP changed status to inactive</td>
                <td>2 days ago</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Platform alerts</h2>
          <table className="pf-table">
            <tbody>
              <tr>
                <td>Email service check</td>
                <td>
                  <StatusBadge label="Healthy" type="success" />
                </td>
              </tr>
              <tr>
                <td>Database status</td>
                <td>
                  <StatusBadge label="Healthy" type="success" />
                </td>
              </tr>
              <tr>
                <td>Expired invitations</td>
                <td>
                  <StatusBadge label="Review" type="warning" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ISPsPage({
  onOpenISP,
  onCreateISP,
  onEditISP,
}: {
  onOpenISP: (isp: ISP) => void;
  onCreateISP: () => void;
  onEditISP: (isp: ISP) => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="ISPs"
        title="ISP management"
        description="Create, review, edit, suspend, or reactivate ISPs using clear status controls."
        primaryAction="Create ISP"
        onPrimaryAction={onCreateISP}
      />

      <div className="pf-card">
        <div className="pf-filter-row">
          <button className="pf-filter active">All</button>
          <button className="pf-filter">Active</button>
          <button className="pf-filter">Inactive</button>
          <button className="pf-filter">Suspended</button>
        </div>

        <div className="pf-table-wrap">
          <table className="pf-table">
            <thead>
              <tr>
                <th>ISP name</th>
                <th>Contact email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Admins</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isps.map((isp) => (
                <tr key={isp.name}>
                  <td>{isp.name}</td>
                  <td>{isp.email}</td>
                  <td className="pf-mono">{isp.phone}</td>
                  <td>
                    <StatusBadge label={isp.status} type={statusType(isp.status)} />
                  </td>
                  <td className="pf-mono">{isp.admins}</td>
                  <td>{isp.created}</td>
                  <td>
                    <div className="pf-row-actions">
                      <button data-design-route="true" onClick={() => onOpenISP(isp)}>
                        View
                      </button>
                      <button data-design-route="true" onClick={() => onEditISP(isp)}>
                        Edit
                      </button>
                      <button>{isp.status === "Active" ? "Suspend" : "Reactivate"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function ISPAdminsPage({ onOpenAdmin }: { onOpenAdmin: (admin: ISPAdmin) => void }) {
  return (
    <>
      <PageHeader
        eyebrow="ISP Admins"
        title="ISP admin accounts"
        description="Review ISP admin users, their assigned ISP, account status, and MFA setup."
        primaryAction="Invite ISP admin"
      />

      <div className="pf-table-wrap">
        <table className="pf-table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Email</th>
              <th>ISP</th>
              <th>Status</th>
              <th>MFA</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.email}>
                <td>{admin.name}</td>
                <td>{admin.email}</td>
                <td>{admin.isp}</td>
                <td>
                  <StatusBadge label={admin.status} type={statusType(admin.status)} />
                </td>
                <td>
                  <StatusBadge label={admin.mfa} type={statusType(admin.mfa)} />
                </td>
                <td>
                  <div className="pf-row-actions">
                    <button data-design-route="true" onClick={() => onOpenAdmin(admin)}>
                      View
                    </button>
                    <button>Send reset</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function InvitationsPage({ onOpenInvitation }: { onOpenInvitation: (invitation: Invitation) => void }) {
  return (
    <>
      <PageHeader
        eyebrow="Invitations"
        title="ISP admin invitations"
        description="Invite ISP admins and track pending, accepted, expired, and revoked invitations."
        primaryAction="Send invitation"
      />

      <section className="pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">Create invitation</h2>

          <div className="pf-form-grid">
            <label className="pf-field">
              ISP
              <select>
                <option>Beirut FiberNet</option>
                <option>Saida Connect</option>
                <option>NorthLine ISP</option>
              </select>
            </label>

            <label className="pf-field">
              Full name
              <input placeholder="Example: Rami Haddad" />
            </label>

            <label className="pf-field">
              Email
              <input placeholder="rami@example.com" />
            </label>

            <label className="pf-field">
              Role
              <input value="ISP Admin" readOnly />
            </label>

            <button className="pf-button primary">Send invitation</button>
          </div>
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Invitation status guide</h2>
          <p className="pf-description">
            Pending means the admin has not accepted yet. Accepted means the account was created.
            Expired means the invitation can no longer be used. Revoked means it was cancelled.
          </p>
        </div>
      </section>

      <section className="pf-section">
        <div className="pf-table-wrap">
          <table className="pf-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Email</th>
                <th>ISP</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invite) => (
                <tr key={invite.email}>
                  <td>{invite.name}</td>
                  <td>{invite.email}</td>
                  <td>{invite.isp}</td>
                  <td>
                    <StatusBadge label={invite.status} type={statusType(invite.status)} />
                  </td>
                  <td>{invite.expires}</td>
                  <td>
                    <div className="pf-row-actions">
                      <button data-design-route="true" onClick={() => onOpenInvitation(invite)}>
                        View
                      </button>
                      {invite.status === "Pending" ? <button>Revoke</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function SystemHealthPage() {
  return (
    <>
      <PageHeader
        eyebrow="System Health"
        title="Platform health"
        description="Review API, database, background jobs, and email service status."
      />

      <section className="pf-grid cols-4">
        <div className="pf-card">
          <div className="pf-metric-label">API</div>
          <div className="pf-metric-value">Healthy</div>
          <div className="pf-metric-note">200 OK</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">Database</div>
          <div className="pf-metric-value">Healthy</div>
          <div className="pf-metric-note">Connected</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">Email service</div>
          <div className="pf-metric-value">Ready</div>
          <div className="pf-metric-note">Placeholder</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">Jobs</div>
          <div className="pf-metric-value">Idle</div>
          <div className="pf-metric-note">Placeholder</div>
        </div>
      </section>

      <section className="pf-section">
        <div className="pf-card">
          <h2 className="pf-card-title">Recent platform checks</h2>
          <table className="pf-table">
            <tbody>
              <tr>
                <td>API health check</td>
                <td className="pf-mono">2 minutes ago</td>
                <td>
                  <StatusBadge label="Healthy" type="success" />
                </td>
              </tr>
              <tr>
                <td>Database connection</td>
                <td className="pf-mono">3 minutes ago</td>
                <td>
                  <StatusBadge label="Healthy" type="success" />
                </td>
              </tr>
              <tr>
                <td>Email service placeholder</td>
                <td className="pf-mono">10 minutes ago</td>
                <td>
                  <StatusBadge label="Review" type="warning" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Platform admin settings"
        description="Manage platform admin profile, security, MFA status, and password settings."
      />

      <section className="pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">Profile</h2>
          <p className="pf-description">Platform Admin · platform@pulsefi.example</p>
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Security</h2>
          <p className="pf-description">MFA is enabled for this platform admin account.</p>
          <div style={{ marginTop: 12 }}>
            <StatusBadge label="MFA enabled" type="success" />
          </div>
        </div>
      </section>
    </>
  );
}

function ISPDetailsPage({
  isp,
  onBack,
  onEdit,
}: {
  isp: ISP;
  onBack: () => void;
  onEdit: () => void;
}) {
  return (
    <>
      <BackButton onBack={onBack} />

      <PageHeader
        eyebrow="ISP Details"
        title={isp.name}
        description="Review ISP profile, admin accounts, app users, routers, subscriptions, recent activity, and status controls."
        primaryAction="Edit ISP"
        onPrimaryAction={onEdit}
      />

      <section className="pf-grid cols-4">
        <div className="pf-card">
          <div className="pf-metric-label">App users</div>
          <div className="pf-metric-value">{isp.users}</div>
          <div className="pf-metric-note">Visible for platform overview</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">Routers</div>
          <div className="pf-metric-value">{isp.routers}</div>
          <div className="pf-metric-note">Assigned under this ISP</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">Subscriptions</div>
          <div className="pf-metric-value">{isp.subscriptions}</div>
          <div className="pf-metric-note">Active user subscriptions</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">ISP admins</div>
          <div className="pf-metric-value">{isp.admins}</div>
          <div className="pf-metric-note">Admin accounts</div>
        </div>
      </section>

      <section className="pf-section pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">ISP profile</h2>
          <InfoRow label="Contact email" value={isp.email} />
          <InfoRow label="Phone" value={<span className="pf-mono">{isp.phone}</span>} />
          <InfoRow label="Address" value={isp.address} />
          <InfoRow label="Created" value={isp.created} />
          <InfoRow label="Status" value={<StatusBadge label={isp.status} type={statusType(isp.status)} />} />
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Status controls</h2>
          <p className="pf-description">
            Platform Admin can control ISP status. ISP Admins manage their own users, routers,
            subscriptions, usage, devices, alerts, and recommendations.
          </p>

          <div className="pf-action-stack pf-section">
            <button className="pf-button primary">Reactivate ISP</button>
            <button className="pf-button pf-danger-button">Suspend ISP</button>
          </div>
        </div>
      </section>

      <section className="pf-section">
        <div className="pf-card">
          <h2 className="pf-card-title">Recent ISP activity</h2>
          <table className="pf-table">
            <tbody>
              <tr>
                <td>New ISP admin accepted invitation</td>
                <td className="pf-mono">Today</td>
                <td>
                  <StatusBadge label="Completed" type="success" />
                </td>
              </tr>
              <tr>
                <td>ISP status reviewed</td>
                <td className="pf-mono">Yesterday</td>
                <td>
                  <StatusBadge label="Review" type="warning" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function ISPFormPage({
  isp,
  onBack,
}: {
  isp?: ISP;
  onBack: () => void;
}) {
  const isEdit = Boolean(isp);

  return (
    <>
      <BackButton onBack={onBack} />

      <PageHeader
        eyebrow={isEdit ? "Edit ISP" : "Create ISP"}
        title={isEdit ? `Edit ${isp?.name}` : "Create new ISP"}
        description="Create or update the ISP organization profile only. ISP Admin accounts are invited separately after the ISP exists."
        primaryAction={isEdit ? "Save changes" : "Create ISP"}
      />

      <section className="pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">ISP information</h2>

          <div className="pf-form-grid">
            <label className="pf-field">
              ISP name
              <input defaultValue={isp?.name} placeholder="Example: Beirut FiberNet" />
            </label>

            <label className="pf-field">
              Contact email
              <input defaultValue={isp?.email} placeholder="contact@example.com" />
            </label>

            <label className="pf-field">
              Phone number
              <input defaultValue={isp?.phone} placeholder="+961 ..." />
            </label>

            <label className="pf-field">
              Address
              <input defaultValue={isp?.address} placeholder="City, country" />
            </label>

            <label className="pf-field">
              Status
              <select defaultValue={isp?.status || "Active"}>
                <option>Active</option>
                <option>Inactive</option>
                <option>Suspended</option>
              </select>
            </label>

            <label className="pf-field">
              Notes
              <textarea rows={4} placeholder="Optional internal notes about this ISP." />
            </label>

            <div className="pf-auth-helper">
              This creates the ISP profile only. No ISP Admin account is created here. After saving, the next step is to invite an ISP Admin for this ISP.
            </div>
          </div>
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Preview</h2>
          <div className="pf-metric-label">ISP profile</div>
          <div className="pf-metric-value">{isp?.name || "New ISP"}</div>
          <div className="pf-section">
            <InfoRow label="Status" value={<StatusBadge label={isp?.status || "Active"} type={statusType(isp?.status || "Active")} />} />
            <InfoRow label="Admins" value={<span className="pf-mono">{isp?.admins || 0}</span>} />
            <InfoRow label="Created" value={isp?.created || "After saving"} />
          </div>

          <div className="pf-next-step-card">
            <div>
              <strong>Next step</strong>
              <span>
                After the ISP is saved, invite the first ISP Admin from the Invitations page.
              </span>
            </div>
            <button className="pf-button primary">Invite ISP Admin</button>
          </div>
        </div>
      </section>
    </>
  );
}

function ISPAdminDetailsPage({
  admin,
  onBack,
}: {
  admin: ISPAdmin;
  onBack: () => void;
}) {
  return (
    <>
      <BackButton onBack={onBack} />

      <PageHeader
        eyebrow="ISP Admin Details"
        title={admin.name}
        description="Review ISP admin account status, assigned ISP, MFA setup, and account actions."
        primaryAction="Send reset password"
      />

      <section className="pf-grid cols-3">
        <div className="pf-card">
          <h2 className="pf-card-title">Account</h2>
          <InfoRow label="Email" value={admin.email} />
          <InfoRow label="Username" value={<span className="pf-mono">{admin.username}</span>} />
          <InfoRow label="Created" value={admin.created} />
          <InfoRow label="Status" value={<StatusBadge label={admin.status} type={statusType(admin.status)} />} />
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">ISP assignment</h2>
          <InfoRow label="ISP" value={admin.isp} />
          <InfoRow label="Role" value="ISP Admin" />
          <InfoRow label="Data scope" value="Own ISP only" />
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Security</h2>
          <InfoRow label="MFA status" value={<StatusBadge label={admin.mfa} type={statusType(admin.mfa)} />} />
          <InfoRow label="Password reset" value="Available" />
          <div className="pf-action-stack pf-section">
            <button className="pf-button primary">Send reset password</button>
            <button className="pf-button pf-danger-button">Suspend admin</button>
          </div>
        </div>
      </section>
    </>
  );
}

function InvitationDetailsPage({
  invitation,
  onBack,
}: {
  invitation: Invitation;
  onBack: () => void;
}) {
  return (
    <>
      <BackButton onBack={onBack} />

      <PageHeader
        eyebrow="Invitation Details"
        title={invitation.name}
        description="Review invitation status, assigned ISP, expiry, and available invitation actions."
        primaryAction={invitation.status === "Pending" ? "Revoke invitation" : undefined}
      />

      <section className="pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">Invitation</h2>
          <InfoRow label="Email" value={invitation.email} />
          <InfoRow label="ISP" value={invitation.isp} />
          <InfoRow label="Role" value="ISP Admin" />
          <InfoRow label="Created" value={invitation.created} />
          <InfoRow label="Expires" value={invitation.expires} />
          <InfoRow label="Status" value={<StatusBadge label={invitation.status} type={statusType(invitation.status)} />} />
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Status meaning</h2>
          <div className="pf-info-list">
            <div>
              <strong>Pending</strong>
              <span>The invited admin has not accepted yet. This is the only state where revoke is available.</span>
            </div>
            <div>
              <strong>Accepted</strong>
              <span>The invitation was used and the admin account was created.</span>
            </div>
            <div>
              <strong>Expired</strong>
              <span>The invitation can no longer be used.</span>
            </div>
          </div>

          {invitation.status === "Pending" ? (
            <div className="pf-action-stack pf-section">
              <button className="pf-button primary">Resend invitation</button>
              <button className="pf-button pf-danger-button">Revoke invitation</button>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

function CurrentPage({
  page,
  setDetailPage,
}: {
  page: string;
  setDetailPage: (detail: DetailPage) => void;
}) {
  if (page === "Overview") return <OverviewPage onCreateISP={() => setDetailPage({ type: "isp-form" })} />;
  if (page === "ISPs") {
    return (
      <ISPsPage
        onOpenISP={(isp) => setDetailPage({ type: "isp", isp })}
        onCreateISP={() => setDetailPage({ type: "isp-form" })}
        onEditISP={(isp) => setDetailPage({ type: "isp-form", isp })}
      />
    );
  }
  if (page === "ISP Admins") {
    return <ISPAdminsPage onOpenAdmin={(admin) => setDetailPage({ type: "admin", admin })} />;
  }
  if (page === "Invitations") {
    return (
      <InvitationsPage
        onOpenInvitation={(invitation) => setDetailPage({ type: "invitation", invitation })}
      />
    );
  }
  if (page === "System Health") return <SystemHealthPage />;
  if (page === "Settings") return <SettingsPage />;

  return <OverviewPage onCreateISP={() => setDetailPage({ type: "isp-form" })} />;
}

export default function PulseFiPlatformAdminWhitePreview() {
  const [activePage, setActivePage] = useState("Overview");
  const [detailPage, setDetailPage] = useState<DetailPage>({ type: "none" });
  const [clickedMessage, setClickedMessage] = useState("");

  function showMockAction(action: string) {
    setClickedMessage(`${action} is a design-only action for now.`);
    window.setTimeout(() => setClickedMessage(""), 2200);
  }

  function handleDesignClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const button = target.closest("button");

    if (!button) {
      return;
    }

    if (button.classList.contains("pf-nav-item") || button.dataset.designRoute === "true") {
      return;
    }

    showMockAction(button.textContent?.trim() || "This button");
  }

  function backToList() {
    setDetailPage({ type: "none" });
  }

  function renderContent() {
    if (detailPage.type === "isp") {
      return (
        <ISPDetailsPage
          isp={detailPage.isp}
          onBack={backToList}
          onEdit={() => setDetailPage({ type: "isp-form", isp: detailPage.isp })}
        />
      );
    }

    if (detailPage.type === "isp-form") {
      return <ISPFormPage isp={detailPage.isp} onBack={backToList} />;
    }

    if (detailPage.type === "admin") {
      return <ISPAdminDetailsPage admin={detailPage.admin} onBack={backToList} />;
    }

    if (detailPage.type === "invitation") {
      return <InvitationDetailsPage invitation={detailPage.invitation} onBack={backToList} />;
    }

    return <CurrentPage page={activePage} setDetailPage={setDetailPage} />;
  }

  return (
    <div className="pf-design-shell" onClick={handleDesignClick}>
      <div className="pf-layout">
        <aside className="pf-sidebar">
          <div className="pf-brand">
            <div className="pf-brand-mark">P</div>
            <div className="pf-brand-text">
              <span className="pf-brand-title">PulseFi</span>
              <span className="pf-brand-subtitle">Platform Admin</span>
            </div>
          </div>

          <nav className="pf-nav">
            {navItems.map((item) => (
              <button
                key={item}
                className={`pf-nav-item ${item === activePage && detailPage.type === "none" ? "active" : ""}`}
                onClick={() => {
                  setDetailPage({ type: "none" });
                  setActivePage(item);
                }}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="pf-main">{renderContent()}</main>

        {clickedMessage ? <div className="pf-toast">{clickedMessage}</div> : null}
      </div>
    </div>
  );
}


