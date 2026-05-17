import { ApiError } from "./client";

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const details =
      typeof error.body.details === "string"
        ? error.body.details
        : JSON.stringify(error.body.details ?? "");

    return [
      error.body.message,
      details,
      error.body.error ? `Error code: ${error.body.error}` : "",
      `HTTP status: ${error.status}`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return fallback;
}
