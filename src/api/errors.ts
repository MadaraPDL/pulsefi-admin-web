import { ApiError } from "./client";

function stringifyDetails(details: unknown) {
  if (!details) {
    return "";
  }

  if (typeof details === "string") {
    return details;
  }

  if (Array.isArray(details)) {
    return details
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "msg" in item &&
          typeof item.msg === "string"
        ) {
          return item.msg;
        }

        return JSON.stringify(item);
      })
      .join(" ");
  }

  return JSON.stringify(details);
}

function friendlyApiMessage(status: number, rawMessage: string, rawDetails: string) {
  const combined = `${rawMessage} ${rawDetails}`.toLowerCase();

  if (status === 401) {
    return "Email/username or password is incorrect, or your session expired. Log in again.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 409 && combined.includes("isp") && combined.includes("name")) {
    return "An ISP with this name already exists. Choose a different ISP name.";
  }

  if (status === 409 && combined.includes("admin account")) {
    return "An admin with this email already exists.";
  }

  if (status === 409 && combined.includes("pending invitation")) {
    return "There is already a pending invitation for this email.";
  }

  if (combined.includes("inactive") || combined.includes("suspended")) {
    return "This ISP is inactive or suspended. Activate it before inviting admins.";
  }

  if (combined.includes("email delivery failed") || combined.includes("smtp")) {
    return "Invitation email could not be sent. Check backend SMTP settings.";
  }

  if (status === 429 || combined.includes("rate_limited")) {
    return "Too many attempts. Wait a few minutes and try again.";
  }

  if (combined.includes("invalid or expired invitation")) {
    return "This invitation link is invalid or expired. Request a new invitation.";
  }

  if (combined.includes("invalid credentials")) {
    return "Email/username or password is incorrect.";
  }

  return [rawMessage, rawDetails].filter(Boolean).join(" ") || "Something went wrong.";
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const rawMessage = error.body.message || fallback;
    const rawDetails = stringifyDetails(error.body.details);

    return friendlyApiMessage(error.status, rawMessage, rawDetails);
  }

  if (error instanceof TypeError) {
    return "Backend is not reachable. Make sure the API server is running.";
  }

  return fallback;
}
