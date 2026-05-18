import { useState } from "react";
import "./pulsefi-white-design.css";

const tabs = ["Home", "Usage", "Devices", "Recommendations", "Alerts", "Profile"];

const devices = [
  {
    name: "Samsung Phone",
    type: "Phone",
    usage: "42 GB",
    status: "Active",
    lastSeen: "Now",
    mac: "A4:91:B1:22:7C:10",
    policy: "No bandwidth limit",
  },
  {
    name: "Laptop",
    type: "Computer",
    usage: "38 GB",
    status: "Active",
    lastSeen: "5 minutes ago",
    mac: "C8:4D:9A:18:33:FA",
    policy: "No bandwidth limit",
  },
  {
    name: "Smart TV",
    type: "TV",
    usage: "86 GB",
    status: "Active",
    lastSeen: "20 minutes ago",
    mac: "90:2B:34:AA:71:09",
    policy: "Limited to 20 Mbps",
  },
  {
    name: "Unknown Device",
    type: "Unknown",
    usage: "18 GB",
    status: "Review",
    lastSeen: "1 hour ago",
    mac: "Unknown",
    policy: "Blocked until trusted",
  },
];

const alerts = [
  {
    title: "Plan limit almost reached",
    text: "You used 182 GB of your 250 GB plan. You have 68 GB left for 9 days.",
    severity: "Warning",
    time: "Today",
  },
  {
    title: "New unknown device",
    text: "A new device connected to your router. Review it if you do not recognize it.",
    severity: "Review",
    time: "Yesterday",
  },
  {
    title: "Router sync completed",
    text: "Your router data was updated 8 minutes ago.",
    severity: "Healthy",
    time: "8 minutes ago",
  },
];

const usageBars = [32, 46, 38, 58, 74, 82, 64];

type Device = (typeof devices)[number];

function StatusBadge({
  label,
  type,
}: {
  label: string;
  type: "success" | "warning" | "error";
}) {
  return <span className={`pf-status ${type}`}>{label}</span>;
}

function MobileHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="pf-mobile-header">
      <div>
        <div className="pf-eyebrow">PulseFi App</div>
        <h1 className="pf-mobile-title">{title}</h1>
        <p className="pf-mobile-description">{description}</p>
      </div>
    </div>
  );
}

function HomeScreen({ onOpenRecommendations }: { onOpenRecommendations: () => void }) {
  return (
    <>
      <MobileHeader
        title="Hi, Ali"
        description="Here is your home internet usage for this month."
      />

      <section className="pf-mobile-card pf-hero-card">
        <div className="pf-mobile-row">
          <div>
            <div className="pf-metric-label">Current plan</div>
            <div className="pf-mobile-plan">Home 250 GB</div>
          </div>
          <StatusBadge label="Online" type="success" />
        </div>

        <div className="pf-mobile-usage-number">182 GB</div>
        <div className="pf-metric-note">used of 250 GB</div>

        <div className="pf-progress pf-mobile-progress">
          <div className="pf-progress-fill" />
        </div>

        <div className="pf-mobile-split">
          <div>
            <strong>68 GB</strong>
            <span>Remaining</span>
          </div>
          <div>
            <strong>9</strong>
            <span>Days left</span>
          </div>
          <div>
            <strong>8 min</strong>
            <span>Last sync</span>
          </div>
        </div>
      </section>

      <section className="pf-mobile-card pf-recommendation-mini">
        <div className="pf-mobile-row">
          <div>
            <h2 className="pf-card-title">Plan recommendation</h2>
            <p className="pf-mobile-description">
              You may exceed your current plan this month.
            </p>
          </div>
          <StatusBadge label="Review" type="warning" />
        </div>

        <div className="pf-mobile-plan-comparison">
          <div>
            <span>Current</span>
            <strong>250 GB</strong>
          </div>
          <div>
            <span>Recommended</span>
            <strong>350 GB</strong>
          </div>
        </div>

        <button className="pf-button primary pf-full-button" onClick={onOpenRecommendations}>
          View recommendation
        </button>
      </section>

      <section className="pf-mobile-card">
        <div className="pf-mobile-row">
          <h2 className="pf-card-title">Quick alerts</h2>
          <button className="pf-small-link">View all</button>
        </div>

        <div className="pf-mobile-list">
          <div className="pf-mobile-list-item">
            <div>
              <strong>Plan limit almost reached</strong>
              <p>You have 68 GB left for 9 days.</p>
            </div>
            <StatusBadge label="Warning" type="warning" />
          </div>

          <div className="pf-mobile-list-item">
            <div>
              <strong>New unknown device</strong>
              <p>Review the device connected yesterday.</p>
            </div>
            <StatusBadge label="Review" type="warning" />
          </div>
        </div>
      </section>

      <section className="pf-mobile-card">
        <div className="pf-mobile-row">
          <h2 className="pf-card-title">Connected devices</h2>
          <button className="pf-small-link">Manage</button>
        </div>

        <div className="pf-mobile-device-strip">
          <div>
            <strong>7</strong>
            <span>Total</span>
          </div>
          <div>
            <strong>4</strong>
            <span>Active</span>
          </div>
          <div>
            <strong>1</strong>
            <span>Unknown</span>
          </div>
        </div>
      </section>
    </>
  );
}

function UsageScreen() {
  return (
    <>
      <MobileHeader
        title="Usage analytics"
        description="Check daily usage and see if you may exceed your plan."
      />

      <section className="pf-mobile-card">
        <div className="pf-mobile-row">
          <h2 className="pf-card-title">Daily usage</h2>
          <div className="pf-mobile-toggle">
            <button className="active">Week</button>
            <button>Month</button>
          </div>
        </div>

        <div className="pf-chart-bars pf-mobile-chart">
          {usageBars.map((height, index) => (
            <div key={index} className="pf-chart-bar">
              <strong style={{ height: `${height}%` }} />
            </div>
          ))}
        </div>
      </section>

      <section className="pf-grid pf-mobile-stats-grid">
        <div className="pf-mobile-card">
          <div className="pf-metric-label">Used this month</div>
          <div className="pf-mobile-stat">182 GB</div>
        </div>

        <div className="pf-mobile-card">
          <div className="pf-metric-label">Projected usage</div>
          <div className="pf-mobile-stat">268 GB</div>
        </div>
      </section>

      <section className="pf-mobile-card">
        <h2 className="pf-card-title">Usage risk</h2>
        <p className="pf-mobile-description">
          At your current rate, you may pass your 250 GB plan before the month ends.
        </p>
        <div style={{ marginTop: 12 }}>
          <StatusBadge label="High chance of exceeding plan" type="warning" />
        </div>
      </section>
    </>
  );
}

function DevicesScreen({ onOpenDevice }: { onOpenDevice: (device: Device) => void }) {
  return (
    <>
      <MobileHeader
        title="Connected devices"
        description="See which devices are connected to your router and how much they used."
      />

      <div className="pf-mobile-filter-row">
        <button className="active">All</button>
        <button>Active</button>
        <button>Unknown</button>
        <button>High Usage</button>
      </div>

      <section className="pf-mobile-list">
        {devices.map((device) => (
          <div className="pf-mobile-card" key={device.name}>
            <div className="pf-mobile-row">
              <div>
                <h2 className="pf-card-title">{device.name}</h2>
                <p className="pf-mobile-description">
                  {device.type} · Last seen {device.lastSeen}
                </p>
              </div>

              {device.status === "Review" ? (
                <StatusBadge label="Review" type="warning" />
              ) : (
                <StatusBadge label="Active" type="success" />
              )}
            </div>

            <div className="pf-mobile-row pf-mobile-device-footer">
              <span>{device.usage} this month</span>
              <button className="pf-button" onClick={() => onOpenDevice(device)}>
                Manage
              </button>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

function DeviceDetailsScreen({
  device,
  onBack,
}: {
  device: Device;
  onBack: () => void;
}) {
  return (
    <>
      <button className="pf-back-button" onClick={onBack}>
        ← Back to devices
      </button>

      <MobileHeader
        title={device.name}
        description="Review device usage, connection status, trust status, and bandwidth policy."
      />

      <section className="pf-mobile-card">
        <div className="pf-mobile-row">
          <div>
            <div className="pf-metric-label">Device type</div>
            <div className="pf-mobile-plan">{device.type}</div>
          </div>

          {device.status === "Review" ? (
            <StatusBadge label="Review" type="warning" />
          ) : (
            <StatusBadge label="Active" type="success" />
          )}
        </div>

        <div className="pf-mobile-profile-row">
          <span>Monthly usage</span>
          <strong className="pf-mono">{device.usage}</strong>
        </div>

        <div className="pf-mobile-profile-row">
          <span>Last seen</span>
          <strong>{device.lastSeen}</strong>
        </div>

        <div className="pf-mobile-profile-row">
          <span>MAC address</span>
          <strong className="pf-mono">{device.mac}</strong>
        </div>

        <div className="pf-mobile-profile-row">
          <span>Bandwidth policy</span>
          <strong>{device.policy}</strong>
        </div>
      </section>

      <section className="pf-mobile-card">
        <h2 className="pf-card-title">Bandwidth control</h2>
        <p className="pf-mobile-description">
          Limit how much speed this device can use. This helps reduce heavy usage from one device.
        </p>

        <div className="pf-mobile-action-grid">
          <button className="pf-button">Rename</button>
          <button className="pf-button">Mark trusted</button>
          <button className="pf-button">Limit bandwidth</button>
          <button className="pf-button pf-danger-button">Block device</button>
        </div>
      </section>

      <section className="pf-mobile-card">
        <h2 className="pf-card-title">Connection history</h2>
        <div className="pf-mobile-list">
          <div className="pf-mobile-list-item">
            <div>
              <strong>Connected</strong>
              <p>Today at 10:42 AM</p>
            </div>
            <StatusBadge label="Online" type="success" />
          </div>
          <div className="pf-mobile-list-item">
            <div>
              <strong>Disconnected</strong>
              <p>Yesterday at 11:18 PM</p>
            </div>
            <StatusBadge label="Offline" type="error" />
          </div>
        </div>
      </section>
    </>
  );
}

function RecommendationsScreen() {
  return (
    <>
      <MobileHeader
        title="Plan recommendation"
        description="PulseFi compares your current usage with your subscription plan."
      />

      <section className="pf-mobile-card pf-hero-card">
        <div className="pf-mobile-row">
          <div>
            <div className="pf-metric-label">Recommendation</div>
            <div className="pf-mobile-plan">Move to Home 350 GB</div>
          </div>
          <StatusBadge label="Recommended" type="warning" />
        </div>

        <p className="pf-mobile-description" style={{ marginTop: 12 }}>
          You may exceed your current 250 GB plan this month. A 350 GB plan may fit your usage better.
        </p>

        <div className="pf-mobile-plan-comparison">
          <div>
            <span>Current plan</span>
            <strong>250 GB</strong>
          </div>
          <div>
            <span>Projected usage</span>
            <strong>268 GB</strong>
          </div>
          <div>
            <span>Recommended</span>
            <strong>350 GB</strong>
          </div>
        </div>
      </section>

      <section className="pf-mobile-card">
        <h2 className="pf-card-title">Why this is recommended</h2>
        <div className="pf-mobile-list">
          <div className="pf-mobile-list-item">
            <div>
              <strong>Your usage is rising</strong>
              <p>You used more internet during the last 7 days.</p>
            </div>
          </div>
          <div className="pf-mobile-list-item">
            <div>
              <strong>Your projected usage is above your limit</strong>
              <p>Projected usage is 268 GB, which is higher than your 250 GB plan.</p>
            </div>
          </div>
          <div className="pf-mobile-list-item">
            <div>
              <strong>Smart TV is using the most data</strong>
              <p>Smart TV used 86 GB this month.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pf-mobile-card">
        <h2 className="pf-card-title">Estimated benefit</h2>
        <p className="pf-mobile-description">
          A 350 GB plan gives more room for streaming and gaming without reaching the limit early.
        </p>

        <div className="pf-mobile-action-grid">
          <button className="pf-button primary">Request plan change</button>
          <button className="pf-button">Contact ISP</button>
        </div>
      </section>
    </>
  );
}

function AlertsScreen() {
  return (
    <>
      <MobileHeader
        title="Alerts"
        description="Review important network, usage, router, and device alerts."
      />

      <section className="pf-mobile-list">
        {alerts.map((alert) => (
          <div className="pf-mobile-card" key={alert.title}>
            <div className="pf-mobile-row">
              <h2 className="pf-card-title">{alert.title}</h2>
              <span className="pf-mobile-time">{alert.time}</span>
            </div>
            <p className="pf-mobile-description">{alert.text}</p>
            <div style={{ marginTop: 12 }}>
              {alert.severity === "Healthy" ? (
                <StatusBadge label="Healthy" type="success" />
              ) : (
                <StatusBadge label={alert.severity} type="warning" />
              )}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

function ProfileScreen() {
  return (
    <>
      <MobileHeader
        title="Profile"
        description="Manage your account, security, subscription, and router status."
      />

      <section className="pf-mobile-card">
        <h2 className="pf-card-title">Account</h2>
        <div className="pf-mobile-profile-row">
          <span>Name</span>
          <strong>Ali Hassan</strong>
        </div>
        <div className="pf-mobile-profile-row">
          <span>Email</span>
          <strong>ali@example.com</strong>
        </div>
        <div className="pf-mobile-profile-row">
          <span>Username</span>
          <strong className="pf-mono">alihassan</strong>
        </div>
      </section>

      <section className="pf-mobile-card">
        <h2 className="pf-card-title">Subscription</h2>
        <div className="pf-mobile-profile-row">
          <span>Current plan</span>
          <strong>Home 250 GB</strong>
        </div>
        <div className="pf-mobile-profile-row">
          <span>Router status</span>
          <StatusBadge label="Online" type="success" />
        </div>
      </section>

      <section className="pf-mobile-card">
        <h2 className="pf-card-title">Notifications</h2>
        <div className="pf-mobile-profile-row">
          <span>High usage alerts</span>
          <StatusBadge label="On" type="success" />
        </div>
        <div className="pf-mobile-profile-row">
          <span>New device alerts</span>
          <StatusBadge label="On" type="success" />
        </div>
        <div className="pf-mobile-profile-row">
          <span>Router offline alerts</span>
          <StatusBadge label="On" type="success" />
        </div>
      </section>

      <section className="pf-mobile-card">
        <h2 className="pf-card-title">Security</h2>
        <div className="pf-mobile-profile-row">
          <span>MFA status</span>
          <StatusBadge label="Enabled" type="success" />
        </div>
        <button className="pf-button">Change password</button>
      </section>
    </>
  );
}

export default function PulseFiAppUserWhitePreview() {
  const [activeTab, setActiveTab] = useState("Home");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
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

    if (
      button.classList.contains("pf-mobile-tab") ||
      button.classList.contains("pf-back-button") ||
      button.textContent?.trim() === "Manage" ||
      button.textContent?.trim() === "View recommendation"
    ) {
      return;
    }

    showMockAction(button.textContent?.trim() || "This button");
  }

  function renderScreen() {
    if (selectedDevice) {
      return <DeviceDetailsScreen device={selectedDevice} onBack={() => setSelectedDevice(null)} />;
    }

    if (activeTab === "Home") {
      return <HomeScreen onOpenRecommendations={() => setActiveTab("Recommendations")} />;
    }

    if (activeTab === "Usage") {
      return <UsageScreen />;
    }

    if (activeTab === "Devices") {
      return <DevicesScreen onOpenDevice={setSelectedDevice} />;
    }

    if (activeTab === "Recommendations") {
      return <RecommendationsScreen />;
    }

    if (activeTab === "Alerts") {
      return <AlertsScreen />;
    }

    if (activeTab === "Profile") {
      return <ProfileScreen />;
    }

    return <HomeScreen onOpenRecommendations={() => setActiveTab("Recommendations")} />;
  }

  return (
    <div className="pf-mobile-preview-page" onClick={handleDesignClick}>
      <div className="pf-phone-frame">
        <main className="pf-phone-screen">{renderScreen()}</main>

        <nav className="pf-mobile-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`pf-mobile-tab ${tab === activeTab ? "active" : ""}`}
              onClick={() => {
                setSelectedDevice(null);
                setActiveTab(tab);
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {clickedMessage ? <div className="pf-toast">{clickedMessage}</div> : null}
    </div>
  );
}
