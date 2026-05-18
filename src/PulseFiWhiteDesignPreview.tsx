import { useState } from "react";
import "./pulsefi-white-design.css";

const navItems = [
  "Overview",
  "Users",
  "User Invitations",
  "Subscriptions",
  "Routers",
  "Devices",
  "Usage",
  "Alerts",
  "Recommendations",
  "Reports",
  "Settings",
];

const users = [
  {
    name: "Ali Hassan",
    email: "ali.hassan@example.com",
    username: "alihassan",
    phone: "+961 70 111 222",
    plan: "Home 250 GB",
    router: "Router Beirut-104",
    routerStatus: "Online",
    usage: "182 GB",
    status: "Active",
  },
  {
    name: "Maya Nasser",
    email: "maya.nasser@example.com",
    username: "mayanasser",
    phone: "+961 71 333 444",
    plan: "Home 350 GB",
    router: "Router Saida-221",
    routerStatus: "Offline",
    usage: "296 GB",
    status: "Active",
  },
  {
    name: "Karim Daher",
    email: "karim.daher@example.com",
    username: "karimdaher",
    phone: "+961 76 555 666",
    plan: "Starter 120 GB",
    router: "Router Tripoli-078",
    routerStatus: "Online",
    usage: "118 GB",
    status: "High usage",
  },
];

const routers = [
  {
    name: "Router Beirut-104",
    user: "Ali Hassan",
    status: "Online",
    sync: "8 minutes ago",
    devices: "7",
    ip: "192.168.1.1",
  },
  {
    name: "Router Saida-221",
    user: "Maya Nasser",
    status: "Offline",
    sync: "2 hours ago",
    devices: "4",
    ip: "192.168.1.1",
  },
  {
    name: "Router Tripoli-078",
    user: "Karim Daher",
    status: "Online",
    sync: "14 minutes ago",
    devices: "5",
    ip: "192.168.0.1",
  },
];

const devices = [
  {
    name: "Samsung Phone",
    user: "Ali Hassan",
    router: "Router Beirut-104",
    type: "Phone",
    usage: "42 GB",
    lastSeen: "Now",
    trust: "Trusted",
    mac: "A4:91:B1:22:7C:10",
    policy: "No bandwidth limit",
  },
  {
    name: "Smart TV",
    user: "Maya Nasser",
    router: "Router Saida-221",
    type: "TV",
    usage: "86 GB",
    lastSeen: "20 minutes ago",
    trust: "Trusted",
    mac: "90:2B:34:AA:71:09",
    policy: "Limited to 20 Mbps",
  },
  {
    name: "Unknown Device",
    user: "Karim Daher",
    router: "Router Tripoli-078",
    type: "Unknown",
    usage: "18 GB",
    lastSeen: "1 hour ago",
    trust: "Review",
    mac: "Unknown",
    policy: "Blocked until trusted",
  },
];

const alerts = [
  {
    title: "Router offline",
    target: "Maya Nasser",
    severity: "High",
    time: "2 hours ago",
    action: "Check router sync",
  },
  {
    title: "Plan limit almost reached",
    target: "Karim Daher",
    severity: "Medium",
    time: "Today",
    action: "Review subscription",
  },
  {
    title: "New unknown device",
    target: "Ali Hassan",
    severity: "Medium",
    time: "Yesterday",
    action: "Review device",
  },
];

const bars = [44, 62, 38, 80, 56, 92, 74];

type User = (typeof users)[number];
type Router = (typeof routers)[number];
type Device = (typeof devices)[number];

type DetailPage =
  | { type: "none" }
  | { type: "user"; user: User }
  | { type: "router"; router: Router }
  | { type: "device"; device: Device }
  | { type: "assign-subscription"; user?: User }
  | { type: "plan-form" };

function StatusBadge({
  label,
  type,
}: {
  label: string;
  type: "success" | "warning" | "error";
}) {
  return <span className={`pf-status ${type}`}>{label}</span>;
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

function OverviewPage() {
  return (
    <>
      <PageHeader
        eyebrow="ISP Admin Dashboard"
        title="Network overview"
        description="Monitor app users, subscriptions, routers, connected devices, usage, alerts, and plan recommendations for your ISP."
        primaryAction="Invite user"
      />

      <section className="pf-grid cols-4">
        <div className="pf-card">
          <div className="pf-metric-label">Total app users</div>
          <div className="pf-metric-value">1,248</div>
          <div className="pf-metric-note">1,102 active users</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">Active subscriptions</div>
          <div className="pf-metric-value">987</div>
          <div className="pf-metric-note">Across 6 active plans</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">Routers online</div>
          <div className="pf-metric-value">914</div>
          <div className="pf-metric-note">73 routers offline</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">Open alerts</div>
          <div className="pf-metric-value">42</div>
          <div className="pf-metric-note">18 high-usage users</div>
        </div>
      </section>

      <section className="pf-section pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">Monthly usage</h2>
          <div className="pf-metric-label">Current ISP total</div>
          <div className="pf-metric-value">84.6 TB</div>
          <div className="pf-progress" style={{ marginTop: 16 }}>
            <div className="pf-progress-fill" />
          </div>
          <div className="pf-metric-note">Usage is 73% of the expected monthly total.</div>

          <div className="pf-chart-bars">
            {bars.map((height, index) => (
              <div key={index} className="pf-chart-bar">
                <strong style={{ height: `${height}%` }} />
              </div>
            ))}
          </div>
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Recent alerts</h2>

          <table className="pf-table">
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.title}>
                  <td>{alert.title}</td>
                  <td>{alert.target}</td>
                  <td>
                    <StatusBadge
                      label={alert.severity}
                      type={alert.severity === "High" ? "error" : "warning"}
                    />
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

function UsersPage({
  onOpenUser,
  onAssignSubscription,
}: {
  onOpenUser: (user: User) => void;
  onAssignSubscription: (user: User) => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Users"
        title="App user management"
        description="Search, review, and manage app users, subscriptions, router status, usage, and account status."
        primaryAction="Invite user"
      />

      <div className="pf-card">
        <div className="pf-filter-row">
          <button className="pf-filter active">All</button>
          <button className="pf-filter">Active</button>
          <button className="pf-filter">Suspended</button>
          <button className="pf-filter">High usage</button>
          <button className="pf-filter">Router offline</button>
        </div>

        <div className="pf-table-wrap">
          <table className="pf-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Username</th>
                <th>Plan</th>
                <th>Router</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td className="pf-mono">{user.username}</td>
                  <td>{user.plan}</td>
                  <td>
                    {user.routerStatus === "Online" ? (
                      <StatusBadge label="Online" type="success" />
                    ) : (
                      <StatusBadge label="Offline" type="error" />
                    )}
                  </td>
                  <td className="pf-mono">{user.usage}</td>
                  <td>
                    {user.status === "High usage" ? (
                      <StatusBadge label="High usage" type="warning" />
                    ) : (
                      <StatusBadge label="Active" type="success" />
                    )}
                  </td>
                  <td>
                    <div className="pf-row-actions">
                      <button data-design-route="true" onClick={() => onOpenUser(user)}>
                        View
                      </button>
                      <button data-design-route="true" onClick={() => onAssignSubscription(user)}>
                        Subscription
                      </button>
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

function UserInvitationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="User Invitations"
        title="Invite app users"
        description="Create invitations for new app users and track pending, accepted, revoked, and expired invitations."
        primaryAction="Send invitation"
      />

      <section className="pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">Create invitation</h2>

          <div className="pf-form-grid">
            <label className="pf-field">
              Full name
              <input placeholder="Example: Nour Ahmad" />
            </label>

            <label className="pf-field">
              Email
              <input placeholder="nour@example.com" />
            </label>

            <label className="pf-field">
              Phone number
              <input placeholder="+961 ..." />
            </label>

            <label className="pf-field">
              Assigned plan
              <select>
                <option>Home 250 GB</option>
                <option>Home 350 GB</option>
                <option>Starter 120 GB</option>
              </select>
            </label>

            <button className="pf-button primary">Send invitation</button>
          </div>
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Invitation status guide</h2>
          <p className="pf-description">
            Pending means the user has not accepted yet. Accepted means the account was created.
            Revoked means the invitation was cancelled. Expired means it can no longer be used.
          </p>
        </div>
      </section>

      <section className="pf-section">
        <div className="pf-table-wrap">
          <table className="pf-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nour Ahmad</td>
                <td>nour@example.com</td>
                <td>Home 250 GB</td>
                <td>
                  <StatusBadge label="Pending" type="warning" />
                </td>
                <td>6 days</td>
              </tr>
              <tr>
                <td>Rami Saleh</td>
                <td>rami@example.com</td>
                <td>Home 350 GB</td>
                <td>
                  <StatusBadge label="Accepted" type="success" />
                </td>
                <td>Completed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function SubscriptionsPage({
  onCreatePlan,
  onAssignSubscription,
}: {
  onCreatePlan: () => void;
  onAssignSubscription: () => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Subscriptions"
        title="Subscription plans"
        description="Manage internet plans, monthly data limits, speeds, prices, and active user counts."
        primaryAction="Create plan"
        onPrimaryAction={onCreatePlan}
      />

      <div className="pf-actions pf-section">
        <button className="pf-button primary" data-design-route="true" onClick={onAssignSubscription}>
          Assign user subscription
        </button>
      </div>

      <div className="pf-section pf-table-wrap">
        <table className="pf-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Data limit</th>
              <th>Download</th>
              <th>Upload</th>
              <th>Price</th>
              <th>Active users</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Starter 120 GB</td>
              <td className="pf-mono">120 GB</td>
              <td className="pf-mono">30 Mbps</td>
              <td className="pf-mono">10 Mbps</td>
              <td>$18</td>
              <td>284</td>
              <td>
                <StatusBadge label="Active" type="success" />
              </td>
            </tr>
            <tr>
              <td>Home 250 GB</td>
              <td className="pf-mono">250 GB</td>
              <td className="pf-mono">60 Mbps</td>
              <td className="pf-mono">20 Mbps</td>
              <td>$28</td>
              <td>493</td>
              <td>
                <StatusBadge label="Active" type="success" />
              </td>
            </tr>
            <tr>
              <td>Home 350 GB</td>
              <td className="pf-mono">350 GB</td>
              <td className="pf-mono">90 Mbps</td>
              <td className="pf-mono">30 Mbps</td>
              <td>$38</td>
              <td>210</td>
              <td>
                <StatusBadge label="Active" type="success" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function RoutersPage({ onOpenRouter }: { onOpenRouter: (router: Router) => void }) {
  return (
    <>
      <PageHeader
        eyebrow="Routers"
        title="Router management"
        description="Track assigned routers, online status, sync time, connected devices, and safe router actions."
        primaryAction="Add router"
      />

      <div className="pf-table-wrap">
        <table className="pf-table">
          <thead>
            <tr>
              <th>Router</th>
              <th>Assigned user</th>
              <th>Status</th>
              <th>Last sync</th>
              <th>Devices</th>
              <th>Firmware</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routers.map((router) => (
              <tr key={router.name}>
                <td>{router.name}</td>
                <td>{router.user}</td>
                <td>
                  {router.status === "Online" ? (
                    <StatusBadge label="Online" type="success" />
                  ) : (
                    <StatusBadge label="Offline" type="error" />
                  )}
                </td>
                <td>{router.sync}</td>
                <td className="pf-mono">{router.devices}</td>
                <td className="pf-mono">v1.0 placeholder</td>
                <td>
                  <div className="pf-row-actions">
                    <button data-design-route="true" onClick={() => onOpenRouter(router)}>
                      View
                    </button>
                    <button>Sync</button>
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

function DevicesPage({ onOpenDevice }: { onOpenDevice: (device: Device) => void }) {
  return (
    <>
      <PageHeader
        eyebrow="Devices"
        title="Connected devices"
        description="Review connected devices, owner, router, usage, trust status, and bandwidth policy actions."
        primaryAction="Review unknown"
      />

      <div className="pf-grid cols-3">
        {devices.map((device) => (
          <div className="pf-card" key={device.name}>
            <h2 className="pf-card-title">{device.name}</h2>
            <div className="pf-metric-label">{device.user}</div>
            <div className="pf-metric-value">{device.usage}</div>
            <div className="pf-metric-note">
              {device.type} · Last seen {device.lastSeen}
            </div>
            <div style={{ marginTop: 14 }}>
              {device.trust === "Trusted" ? (
                <StatusBadge label="Trusted" type="success" />
              ) : (
                <StatusBadge label="Review" type="warning" />
              )}
            </div>
            <button
              className="pf-button pf-full-button"
              data-design-route="true"
              onClick={() => onOpenDevice(device)}
            >
              View device
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function UsagePage() {
  return (
    <>
      <PageHeader
        eyebrow="Usage"
        title="Usage monitoring"
        description="Analyze ISP usage totals, top users, high usage warnings, and daily usage records."
        primaryAction="Export report"
      />

      <section className="pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">Daily usage</h2>
          <div className="pf-chart-bars">
            {[30, 52, 48, 72, 64, 90, 76, 84, 58, 68].map((height, index) => (
              <div key={index} className="pf-chart-bar">
                <strong style={{ height: `${height}%` }} />
              </div>
            ))}
          </div>
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Top users by usage</h2>
          <table className="pf-table">
            <tbody>
              <tr>
                <td>Maya Nasser</td>
                <td className="pf-mono">296 GB</td>
              </tr>
              <tr>
                <td>Ali Hassan</td>
                <td className="pf-mono">182 GB</td>
              </tr>
              <tr>
                <td>Karim Daher</td>
                <td className="pf-mono">118 GB</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AlertsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Alerts"
        title="Alerts management"
        description="Review open network, usage, router, device, and subscription alerts."
      />

      <div className="pf-grid">
        {alerts.map((alert) => (
          <div className="pf-card" key={alert.title}>
            <h2 className="pf-card-title">{alert.title}</h2>
            <p className="pf-description">
              Affected target: {alert.target}. Recommended action: {alert.action}.
            </p>
            <div style={{ marginTop: 12 }}>
              <StatusBadge
                label={alert.severity}
                type={alert.severity === "High" ? "error" : "warning"}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function RecommendationsPage() {
  const recommendations = [
    {
      user: "Karim Daher",
      currentPlan: "Starter 120 GB",
      averageUsage: "142 GB",
      projectedUsage: "168 GB",
      recommendedPlan: "Home 250 GB",
      reason: "Projected usage is above the current plan limit.",
      status: "Needs review",
    },
    {
      user: "Ali Hassan",
      currentPlan: "Home 250 GB",
      averageUsage: "231 GB",
      projectedUsage: "268 GB",
      recommendedPlan: "Home 350 GB",
      reason: "User may exceed the 250 GB plan before the month ends.",
      status: "Recommended",
    },
    {
      user: "Maya Nasser",
      currentPlan: "Home 350 GB",
      averageUsage: "302 GB",
      projectedUsage: "318 GB",
      recommendedPlan: "Keep current plan",
      reason: "Current plan still fits the user’s monthly usage.",
      status: "Stable",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Recommendations"
        title="Plan recommendations"
        description="Review users who may need a better subscription plan based on their current usage, projected usage, and plan limits."
        primaryAction="Create change request"
      />

      <section className="pf-grid cols-3">
        <div className="pf-card">
          <div className="pf-metric-label">Users reviewed</div>
          <div className="pf-metric-value">126</div>
          <div className="pf-metric-note">Based on the last 30 days</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">Plan changes suggested</div>
          <div className="pf-metric-value">18</div>
          <div className="pf-metric-note">Users may exceed their plan</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">Stable users</div>
          <div className="pf-metric-value">108</div>
          <div className="pf-metric-note">Current plans fit usage</div>
        </div>
      </section>

      <section className="pf-section pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">Highlighted recommendation</h2>
          <p className="pf-description">
            Ali may exceed the 250 GB plan this month. A 350 GB plan may fit better based on the last 30 days.
          </p>

          <div className="pf-recommendation-compare">
            <div>
              <span>Current plan</span>
              <strong>250 GB</strong>
            </div>
            <div>
              <span>Projected usage</span>
              <strong>268 GB</strong>
            </div>
            <div>
              <span>Recommended plan</span>
              <strong>350 GB</strong>
            </div>
          </div>

          <div className="pf-action-stack pf-section">
            <button className="pf-button primary">Create subscription change request</button>
            <button className="pf-button">View user profile</button>
            <button className="pf-button">Contact user</button>
          </div>
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Why this matters</h2>
          <div className="pf-info-list">
            <div>
              <strong>Prevent over-limit issues</strong>
              <span>Admins can contact users before they exceed their monthly plan.</span>
            </div>
            <div>
              <strong>Improve plan fit</strong>
              <span>Users with stable usage can stay on their current plan.</span>
            </div>
            <div>
              <strong>Use clear reasoning</strong>
              <span>Each recommendation explains the usage pattern behind it.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="pf-section">
        <div className="pf-card">
          <div className="pf-mobile-row">
            <h2 className="pf-card-title">Recommendation queue</h2>
            <div className="pf-filter-row" style={{ marginBottom: 0 }}>
              <button className="pf-filter active">All</button>
              <button className="pf-filter">Needs review</button>
              <button className="pf-filter">Stable</button>
              <button className="pf-filter">High risk</button>
            </div>
          </div>

          <div className="pf-section pf-table-wrap">
            <table className="pf-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Current plan</th>
                  <th>Average usage</th>
                  <th>Projected usage</th>
                  <th>Recommended plan</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((item) => (
                  <tr key={item.user}>
                    <td>{item.user}</td>
                    <td>{item.currentPlan}</td>
                    <td className="pf-mono">{item.averageUsage}</td>
                    <td className="pf-mono">{item.projectedUsage}</td>
                    <td>{item.recommendedPlan}</td>
                    <td>{item.reason}</td>
                    <td>
                      {item.status === "Stable" ? (
                        <StatusBadge label="Stable" type="success" />
                      ) : (
                        <StatusBadge label={item.status} type="warning" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

function ReportsPage() {
  const recentReports = [
    {
      name: "Monthly usage report",
      type: "Usage report",
      range: "May 1 - May 31",
      created: "Today",
      status: "Ready",
    },
    {
      name: "Router status report",
      type: "Router status report",
      range: "Last 7 days",
      created: "Yesterday",
      status: "Ready",
    },
    {
      name: "High usage users",
      type: "User report",
      range: "Last 30 days",
      created: "2 days ago",
      status: "Ready",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Reports"
        description="Generate usage, user, subscription, router status, and alerts reports for the ISP."
        primaryAction="Generate report"
      />

      <section className="pf-grid cols-3">
        <div className="pf-card">
          <div className="pf-metric-label">Reports generated</div>
          <div className="pf-metric-value">24</div>
          <div className="pf-metric-note">This month</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">Most used report</div>
          <div className="pf-metric-value">Usage</div>
          <div className="pf-metric-note">Monthly usage export</div>
        </div>

        <div className="pf-card">
          <div className="pf-metric-label">Last report</div>
          <div className="pf-metric-value">Today</div>
          <div className="pf-metric-note">Ready to download</div>
        </div>
      </section>

      <section className="pf-section pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">Generate report</h2>

          <div className="pf-form-grid">
            <label className="pf-field">
              Report type
              <select>
                <option>Usage report</option>
                <option>User report</option>
                <option>Subscription report</option>
                <option>Router status report</option>
                <option>Alerts report</option>
              </select>
            </label>

            <label className="pf-field">
              Date range
              <select>
                <option>This month</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Custom range</option>
              </select>
            </label>

            <label className="pf-field">
              From
              <input type="date" />
            </label>

            <label className="pf-field">
              To
              <input type="date" />
            </label>

            <label className="pf-field">
              Include
              <select>
                <option>Summary and table</option>
                <option>Summary only</option>
                <option>Detailed table only</option>
              </select>
            </label>

            <button className="pf-button primary">Generate report</button>
          </div>
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Report preview</h2>
          <p className="pf-description">
            The generated report should summarize the selected date range and include the most useful operational data.
          </p>

          <div className="pf-info-list pf-section">
            <div>
              <strong>Usage report</strong>
              <span>Total usage, top users, high usage warnings, and daily totals.</span>
            </div>
            <div>
              <strong>Router status report</strong>
              <span>Online routers, offline routers, sync problems, and last sync times.</span>
            </div>
            <div>
              <strong>Alerts report</strong>
              <span>Open alerts, resolved alerts, severity, affected user, and recommended action.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="pf-section">
        <div className="pf-card">
          <h2 className="pf-card-title">Recent reports</h2>

          <div className="pf-table-wrap">
            <table className="pf-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Type</th>
                  <th>Date range</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr key={report.name}>
                    <td>{report.name}</td>
                    <td>{report.type}</td>
                    <td>{report.range}</td>
                    <td>{report.created}</td>
                    <td>
                      <StatusBadge label={report.status} type="success" />
                    </td>
                    <td>
                      <div className="pf-row-actions">
                        <button>Download</button>
                        <button>View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        title="ISP admin settings"
        description="Manage profile, security, MFA status, ISP information, notifications, and password settings."
      />

      <section className="pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">Profile</h2>
          <p className="pf-description">Hussien Admin · admin@isp.example.com</p>
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Security</h2>
          <p className="pf-description">MFA is enabled for this admin account.</p>
          <div style={{ marginTop: 12 }}>
            <StatusBadge label="MFA enabled" type="success" />
          </div>
        </div>
      </section>
    </>
  );
}

function UserDetailsPage({
  user,
  onBack,
  onAssignSubscription,
}: {
  user: User;
  onBack: () => void;
  onAssignSubscription: () => void;
}) {
  return (
    <>
      <BackButton onBack={onBack} />

      <PageHeader
        eyebrow="User Details"
        title={user.name}
        description="Review account status, subscription, usage, assigned router, connected devices, recent alerts, and account actions."
        primaryAction="Change subscription"
        onPrimaryAction={onAssignSubscription}
      />

      <section className="pf-grid cols-3">
        <div className="pf-card">
          <h2 className="pf-card-title">Profile</h2>
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Username" value={<span className="pf-mono">{user.username}</span>} />
          <InfoRow label="Phone" value={<span className="pf-mono">{user.phone}</span>} />
          <InfoRow label="Status" value={<StatusBadge label={user.status} type={user.status === "High usage" ? "warning" : "success"} />} />
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Subscription</h2>
          <InfoRow label="Current plan" value={user.plan} />
          <InfoRow label="Usage this month" value={<span className="pf-mono">{user.usage}</span>} />
          <InfoRow label="Billing cycle" value="9 days left" />
          <InfoRow label="Recommendation" value={<StatusBadge label="Review plan" type="warning" />} />
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Router</h2>
          <InfoRow label="Assigned router" value={user.router} />
          <InfoRow
            label="Router status"
            value={
              user.routerStatus === "Online" ? (
                <StatusBadge label="Online" type="success" />
              ) : (
                <StatusBadge label="Offline" type="error" />
              )
            }
          />
          <InfoRow label="Connected devices" value={<span className="pf-mono">7</span>} />
          <InfoRow label="Last sync" value="8 minutes ago" />
        </div>
      </section>

      <section className="pf-section pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">Recent usage records</h2>
          <table className="pf-table">
            <tbody>
              <tr>
                <td>Today</td>
                <td className="pf-mono">8.4 GB</td>
              </tr>
              <tr>
                <td>Yesterday</td>
                <td className="pf-mono">11.2 GB</td>
              </tr>
              <tr>
                <td>2 days ago</td>
                <td className="pf-mono">6.9 GB</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Recent alerts</h2>
          <div className="pf-info-list">
            <div>
              <strong>Plan limit almost reached</strong>
              <span>User may exceed current plan before month end.</span>
            </div>
            <div>
              <strong>New unknown device</strong>
              <span>One device needs review before marking trusted.</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function RouterDetailsPage({
  router,
  onBack,
}: {
  router: Router;
  onBack: () => void;
}) {
  return (
    <>
      <BackButton onBack={onBack} />

      <PageHeader
        eyebrow="Router Details"
        title={router.name}
        description="Review router status, assigned user, sync history, network placeholders, and safe router actions."
        primaryAction="Sync now"
      />

      <section className="pf-grid cols-3">
        <div className="pf-card">
          <h2 className="pf-card-title">Router summary</h2>
          <InfoRow label="Assigned user" value={router.user} />
          <InfoRow
            label="Status"
            value={
              router.status === "Online" ? (
                <StatusBadge label="Online" type="success" />
              ) : (
                <StatusBadge label="Offline" type="error" />
              )
            }
          />
          <InfoRow label="Last sync" value={router.sync} />
          <InfoRow label="Connected devices" value={<span className="pf-mono">{router.devices}</span>} />
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Network information</h2>
          <InfoRow label="IP placeholder" value={<span className="pf-mono">{router.ip}</span>} />
          <InfoRow label="Firmware" value={<span className="pf-mono">v1.0 placeholder</span>} />
          <InfoRow label="Sync source" value="Router API placeholder" />
          <InfoRow label="Password" value="Not shown in UI" />
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Safe actions</h2>
          <div className="pf-action-stack">
            <button className="pf-button primary">Sync now</button>
            <button className="pf-button">Edit router details</button>
            <button className="pf-button">View connected devices</button>
          </div>
        </div>
      </section>

      <section className="pf-section">
        <div className="pf-card">
          <h2 className="pf-card-title">Router action history</h2>
          <table className="pf-table">
            <tbody>
              <tr>
                <td>Sync completed</td>
                <td className="pf-mono">8 minutes ago</td>
                <td>
                  <StatusBadge label="Healthy" type="success" />
                </td>
              </tr>
              <tr>
                <td>Device list refreshed</td>
                <td className="pf-mono">1 hour ago</td>
                <td>
                  <StatusBadge label="Healthy" type="success" />
                </td>
              </tr>
              <tr>
                <td>Router offline detected</td>
                <td className="pf-mono">2 hours ago</td>
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

function DeviceDetailsPage({
  device,
  onBack,
}: {
  device: Device;
  onBack: () => void;
}) {
  return (
    <>
      <BackButton onBack={onBack} />

      <PageHeader
        eyebrow="Device Details"
        title={device.name}
        description="Review device owner, router, MAC placeholder, usage, trust status, connection history, and bandwidth policy."
        primaryAction="Apply bandwidth limit"
      />

      <section className="pf-grid cols-3">
        <div className="pf-card">
          <h2 className="pf-card-title">Device summary</h2>
          <InfoRow label="Owner" value={device.user} />
          <InfoRow label="Router" value={device.router} />
          <InfoRow label="Type" value={device.type} />
          <InfoRow label="MAC" value={<span className="pf-mono">{device.mac}</span>} />
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Usage and status</h2>
          <InfoRow label="Usage this month" value={<span className="pf-mono">{device.usage}</span>} />
          <InfoRow label="Last seen" value={device.lastSeen} />
          <InfoRow
            label="Trust status"
            value={
              device.trust === "Trusted" ? (
                <StatusBadge label="Trusted" type="success" />
              ) : (
                <StatusBadge label="Review" type="warning" />
              )
            }
          />
          <InfoRow label="Policy" value={device.policy} />
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Device actions</h2>
          <p className="pf-description">
            Limit how much speed this device can use, or block it if the user does not recognize it.
          </p>
          <div className="pf-action-stack pf-section">
            <button className="pf-button">Rename device</button>
            <button className="pf-button">Mark trusted</button>
            <button className="pf-button primary">Limit bandwidth</button>
            <button className="pf-button pf-danger-button">Block device</button>
          </div>
        </div>
      </section>

      <section className="pf-section">
        <div className="pf-card">
          <h2 className="pf-card-title">Connection history</h2>
          <table className="pf-table">
            <tbody>
              <tr>
                <td>Connected</td>
                <td className="pf-mono">Today at 10:42 AM</td>
                <td>
                  <StatusBadge label="Online" type="success" />
                </td>
              </tr>
              <tr>
                <td>Disconnected</td>
                <td className="pf-mono">Yesterday at 11:18 PM</td>
                <td>
                  <StatusBadge label="Offline" type="error" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AssignSubscriptionPage({
  user,
  onBack,
}: {
  user?: User;
  onBack: () => void;
}) {
  return (
    <>
      <BackButton onBack={onBack} />

      <PageHeader
        eyebrow="Subscription Assignment"
        title="Assign or change user subscription"
        description="Choose a user, review their current plan, select a new plan, and record why the change is being made."
        primaryAction="Save change"
      />

      <section className="pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">Change subscription</h2>

          <div className="pf-form-grid">
            <label className="pf-field">
              User
              <select defaultValue={user?.name || "Ali Hassan"}>
                {users.map((item) => (
                  <option key={item.email}>{item.name}</option>
                ))}
              </select>
            </label>

            <label className="pf-field">
              Current plan
              <input value={user?.plan || "Home 250 GB"} readOnly />
            </label>

            <label className="pf-field">
              New plan
              <select>
                <option>Home 350 GB</option>
                <option>Home 250 GB</option>
                <option>Starter 120 GB</option>
              </select>
            </label>

            <label className="pf-field">
              Start date
              <input type="date" />
            </label>

            <label className="pf-field">
              End date
              <input type="date" />
            </label>

            <label className="pf-field">
              Reason for change
              <textarea placeholder="Example: User is projected to exceed current plan." rows={4} />
            </label>

            <div className="pf-auth-warning">
              Warning: this user already has an active subscription. Saving this change should close
              or replace the current active plan in the real app.
            </div>
          </div>
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Subscription history</h2>
          <table className="pf-table">
            <tbody>
              <tr>
                <td>Home 250 GB</td>
                <td>Active</td>
                <td className="pf-mono">182 GB used</td>
              </tr>
              <tr>
                <td>Starter 120 GB</td>
                <td>Ended</td>
                <td className="pf-mono">Last month</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function PlanFormPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <BackButton onBack={onBack} />

      <PageHeader
        eyebrow="Plan Form"
        title="Create or edit subscription plan"
        description="Define the monthly data limit, speed, price, description, and status for an ISP subscription plan."
        primaryAction="Save plan"
      />

      <section className="pf-grid cols-2">
        <div className="pf-card">
          <h2 className="pf-card-title">Plan details</h2>

          <div className="pf-form-grid">
            <label className="pf-field">
              Plan name
              <input placeholder="Home 350 GB" />
            </label>

            <label className="pf-field">
              Data limit in GB
              <input placeholder="350" />
            </label>

            <label className="pf-field">
              Download speed
              <input placeholder="90 Mbps" />
            </label>

            <label className="pf-field">
              Upload speed
              <input placeholder="30 Mbps" />
            </label>

            <label className="pf-field">
              Monthly price
              <input placeholder="$38" />
            </label>

            <label className="pf-field">
              Status
              <select>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>

            <label className="pf-field">
              Description
              <textarea placeholder="Describe who this plan is best for." rows={4} />
            </label>
          </div>
        </div>

        <div className="pf-card">
          <h2 className="pf-card-title">Preview</h2>
          <div className="pf-metric-label">Plan name</div>
          <div className="pf-metric-value">Home 350 GB</div>
          <div className="pf-section pf-grid cols-2">
            <div>
              <div className="pf-metric-label">Download</div>
              <strong className="pf-mono">90 Mbps</strong>
            </div>
            <div>
              <div className="pf-metric-label">Upload</div>
              <strong className="pf-mono">30 Mbps</strong>
            </div>
            <div>
              <div className="pf-metric-label">Limit</div>
              <strong className="pf-mono">350 GB</strong>
            </div>
            <div>
              <div className="pf-metric-label">Price</div>
              <strong>$38</strong>
            </div>
          </div>
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
  if (page === "Overview") return <OverviewPage />;
  if (page === "Users") {
    return (
      <UsersPage
        onOpenUser={(user) => setDetailPage({ type: "user", user })}
        onAssignSubscription={(user) => setDetailPage({ type: "assign-subscription", user })}
      />
    );
  }
  if (page === "User Invitations") return <UserInvitationsPage />;
  if (page === "Subscriptions") {
    return (
      <SubscriptionsPage
        onCreatePlan={() => setDetailPage({ type: "plan-form" })}
        onAssignSubscription={() => setDetailPage({ type: "assign-subscription" })}
      />
    );
  }
  if (page === "Routers") {
    return <RoutersPage onOpenRouter={(router) => setDetailPage({ type: "router", router })} />;
  }
  if (page === "Devices") {
    return <DevicesPage onOpenDevice={(device) => setDetailPage({ type: "device", device })} />;
  }
  if (page === "Usage") return <UsagePage />;
  if (page === "Alerts") return <AlertsPage />;
  if (page === "Recommendations") return <RecommendationsPage />;
  if (page === "Reports") return <ReportsPage />;
  if (page === "Settings") return <SettingsPage />;

  return <OverviewPage />;
}

export default function PulseFiWhiteDesignPreview() {
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
    if (detailPage.type === "user") {
      return (
        <UserDetailsPage
          user={detailPage.user}
          onBack={backToList}
          onAssignSubscription={() =>
            setDetailPage({ type: "assign-subscription", user: detailPage.user })
          }
        />
      );
    }

    if (detailPage.type === "router") {
      return <RouterDetailsPage router={detailPage.router} onBack={backToList} />;
    }

    if (detailPage.type === "device") {
      return <DeviceDetailsPage device={detailPage.device} onBack={backToList} />;
    }

    if (detailPage.type === "assign-subscription") {
      return <AssignSubscriptionPage user={detailPage.user} onBack={backToList} />;
    }

    if (detailPage.type === "plan-form") {
      return <PlanFormPage onBack={backToList} />;
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
              <span className="pf-brand-subtitle">ISP Admin</span>
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

