import { useState } from "react";
import "./pulsefi-white-design.css";

const stateGroups = ["Platform Admin", "ISP Admin", "App User", "Errors"];

const platformStates = [
  {
    title: "No ISPs found",
    text: "No ISP organizations have been created yet. Create the first ISP profile before inviting ISP admins.",
    action: "Create ISP",
    type: "empty",
  },
  {
    title: "No ISP admins invited yet",
    text: "This ISP does not have any admin invitations. Invite an ISP Admin so they can manage users and routers.",
    action: "Invite ISP Admin",
    type: "empty",
  },
  {
    title: "No pending invitations",
    text: "There are no pending ISP admin invitations right now.",
    action: "View all invitations",
    type: "empty",
  },
];

const ispStates = [
  {
    title: "No users found",
    text: "No app users match the current search or filter. Try clearing filters or invite a new app user.",
    action: "Invite user",
    type: "empty",
  },
  {
    title: "No routers assigned",
    text: "This user does not have an assigned router yet. Assign a router before usage and device data can sync.",
    action: "Assign router",
    type: "empty",
  },
  {
    title: "No usage data for this date range",
    text: "PulseFi has not received usage records for the selected date range.",
    action: "Change date range",
    type: "empty",
  },
  {
    title: "No recommendations yet",
    text: "There is not enough usage history to recommend a better plan for this user.",
    action: "View usage",
    type: "empty",
  },
];

const appStates = [
  {
    title: "No devices found",
    text: "No connected devices were found for your router. Try syncing again or check your router connection.",
    action: "Sync router",
    type: "empty",
  },
  {
    title: "Router not connected",
    text: "PulseFi cannot reach your router right now. Some usage and device data may be outdated.",
    action: "Check router status",
    type: "warning",
  },
  {
    title: "No alerts yet",
    text: "You do not have any alerts right now. PulseFi will notify you when something needs attention.",
    action: "Back to home",
    type: "empty",
  },
];

const errorStates = [
  {
    title: "Failed to load data",
    text: "Something went wrong while loading this page. Check your connection and try again.",
    action: "Try again",
    type: "error",
  },
  {
    title: "Permission denied",
    text: "You do not have permission to view this page. Contact an administrator if you think this is a mistake.",
    action: "Go back",
    type: "error",
  },
  {
    title: "Session expired",
    text: "Your session ended for security. Sign in again to continue using PulseFi.",
    action: "Back to login",
    type: "warning",
  },
  {
    title: "Unable to sync data",
    text: "PulseFi could not sync the latest router data. The dashboard may show older values.",
    action: "Retry sync",
    type: "warning",
  },
];

function stateTone(type: string) {
  if (type === "error") return "error";
  if (type === "warning") return "warning";
  return "empty";
}

function StateCard({
  title,
  text,
  action,
  type,
}: {
  title: string;
  text: string;
  action: string;
  type: string;
}) {
  return (
    <div className={`pf-state-card ${stateTone(type)}`}>
      <div className="pf-state-icon">
        {type === "error" ? "!" : type === "warning" ? "?" : "—"}
      </div>

      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>

      <button className={type === "error" ? "pf-button pf-danger-button" : "pf-button primary"}>
        {action}
      </button>
    </div>
  );
}

function CurrentStates({ group }: { group: string }) {
  const states =
    group === "Platform Admin"
      ? platformStates
      : group === "ISP Admin"
        ? ispStates
        : group === "App User"
          ? appStates
          : errorStates;

  return (
    <section className="pf-grid cols-2">
      {states.map((state) => (
        <StateCard
          key={state.title}
          title={state.title}
          text={state.text}
          action={state.action}
          type={state.type}
        />
      ))}
    </section>
  );
}

export default function PulseFiStatesPreview() {
  const [activeGroup, setActiveGroup] = useState("Platform Admin");
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

    if (button.classList.contains("pf-state-tab")) {
      return;
    }

    showMockAction(button.textContent?.trim() || "This button");
  }

  return (
    <div className="pf-states-page" onClick={handleDesignClick}>
      <header className="pf-header">
        <div>
          <div className="pf-eyebrow">PulseFi UI States</div>
          <h1 className="pf-title">Empty and error states</h1>
          <p className="pf-description">
            Design-only examples for missing data, permission issues, expired sessions,
            failed loading, and router sync problems across PulseFi roles.
          </p>
        </div>
      </header>

      <div className="pf-state-tabs">
        {stateGroups.map((group) => (
          <button
            key={group}
            type="button"
            className={`pf-state-tab ${group === activeGroup ? "active" : ""}`}
            onClick={() => setActiveGroup(group)}
          >
            {group}
          </button>
        ))}
      </div>

      <CurrentStates group={activeGroup} />

      {clickedMessage ? <div className="pf-toast">{clickedMessage}</div> : null}
    </div>
  );
}
