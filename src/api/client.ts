const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "http://127.0.0.1:8000/api/v1";

export type ApiErrorBody = {
  error?: string;
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || "API request failed");
    this.status = status;
    this.body = body;
  }
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
