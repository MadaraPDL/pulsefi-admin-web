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
          const location =
            "loc" in item ? (item as { loc?: unknown }).loc : undefined;
          const fieldLabel =
            Array.isArray(location)
              ? location
                  .filter((part: unknown) => part !== "body")
                  .map((part: unknown) => String(part))
                  .join(" ")
              : "";

          return fieldLabel ? `${fieldLabel}: ${item.msg}` : item.msg;
        }

        return "";
      })
      .filter(Boolean)
      .join(" ");
  }

  if (
    details &&
    typeof details === "object" &&
    "msg" in details &&
    typeof details.msg === "string"
  ) {
    return details.msg;
  }

  return "";
}

function friendlyApiMessage(
  status: number,
  errorCode: string,
  rawMessage: string,
  rawDetails: string
) {
  const combined = `${errorCode} ${rawMessage} ${rawDetails}`.toLowerCase();

  if (status === 401) {
    if (
      combined.includes("invalid credentials") ||
      combined.includes("incorrect") ||
      combined.includes("password")
    ) {
      return "Email/username or password is incorrect.";
    }

    return "Your session expired. Log in again.";
  }

  if (status === 403) {
    return "This action requires a different admin role.";
  }

  if (status === 409 && combined.includes("isp") && combined.includes("name")) {
    return "An ISP with this name already exists. Choose a different ISP name.";
  }

  if (
    status === 409 &&
    (combined.includes("admin account") || combined.includes("admin with this email"))
  ) {
    return "An admin with this email already exists.";
  }

  if (status === 409 && combined.includes("pending invitation")) {
    return "There is already a pending invitation for this email.";
  }

  if (status === 409 && combined.includes("conflict")) {
    return "This record changed or conflicts with existing data. Refresh and try again.";
  }

  if (combined.includes("inactive") || combined.includes("suspended")) {
    return "This ISP is inactive or suspended. Activate it before inviting admins.";
  }

  if (combined.includes("email delivery failed") || combined.includes("smtp")) {
    return "Invitation email could not be sent. Check backend SMTP settings.";
  }

  if (
    combined.includes("cannot be revoked") ||
    (combined.includes("revoke") && combined.includes("pending"))
  ) {
    return "Only pending invitations can be revoked. Refresh the invitation list.";
  }

  if (status === 429 || combined.includes("rate_limited")) {
    return "Too many attempts. Wait a few minutes and try again.";
  }

  if (status === 422 || errorCode === "validation_error") {
    const detailsText = rawDetails ? ` ${rawDetails}` : "";
    return `Check the form fields and try again.${detailsText}`;
  }

  if (combined.includes("invalid or expired invitation")) {
    return "This invitation link is invalid or expired. Request a new invitation.";
  }

  if (combined.includes("invalid credentials")) {
    return "Email/username or password is incorrect.";
  }

  if (status === 400 && combined.includes("invalid")) {
    return rawMessage || "Check the submitted values and try again.";
  }

  return rawMessage || rawDetails || "Something went wrong.";
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const rawMessage = error.body.message || fallback;
    const rawDetails = stringifyDetails(error.body.details);
    const errorCode = error.body.error || "";

    return friendlyApiMessage(error.status, errorCode, rawMessage, rawDetails);
  }

  if (error instanceof TypeError) {
    return "Backend is not reachable. Make sure the API server is running.";
  }

  return fallback;
}
