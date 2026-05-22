const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

function getDefaultApiBaseUrl() {
  if (typeof window === "undefined") {
    return "http://127.0.0.1:8000/api/v1";
  }

  return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
}

const API_BASE_URL = envApiBaseUrl || getDefaultApiBaseUrl();

console.log("PulseFi admin API:", API_BASE_URL);

export type ApiErrorBody = {
  error?: string;
  message?: string;
  details?: unknown;
  detail?: unknown;
};

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    const fallbackMessage = parseApiErrorMessage(body);
    super(fallbackMessage);
    this.status = status;
    this.body = body;
  }
}

function parseApiErrorMessage(body: ApiErrorBody) {
  if (typeof body.message === "string") {
    return body.message;
  }

  if (typeof body.detail === "string") {
    return body.detail;
  }

  if (Array.isArray(body.detail)) {
    return body.detail
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
      .join("\n");
  }

  return "API request failed";
}

function getAccessToken(): string | null {
  return localStorage.getItem("pulsefi_access_token");
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, data as ApiErrorBody);
  }

  return data as T;
}
