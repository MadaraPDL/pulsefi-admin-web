export type AdminRole = "platform_admin" | "isp_admin";

export type AdminLoginResult =
  | {
      kind: "authenticated";
      accessToken: string;
      role: AdminRole;
      identifier: string;
    }
  | {
      kind: "mfa_required";
      challengeToken?: string;
      method?: string;
      expiresAt?: string;
    };

type ApiErrorDetail = {
  msg?: string;
  message?: string;
};

type LoginResponse = {
  access_token?: string;
  token?: string;
  role?: string;
  admin_role?: string;
  account_type?: string;
  mfa_required?: boolean;
  challenge_token?: string;
  mfa_challenge_token?: string;
  method?: string;
  mfa_method?: string;
  expires_at?: string;
  detail?: unknown;
  message?: string;
  details?: ApiErrorDetail[];
};

type MeResponse = {
  id?: string;
  email?: string;
  username?: string | null;
  role?: string;
  admin_role?: string;
  account_type?: string;
  detail?: unknown;
  message?: string;
  details?: ApiErrorDetail[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split(".");

  if (!payload) {
    return {};
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = window.atob(normalizedPayload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function normalizeAdminRole(value: unknown): AdminRole | null {
  if (
    value === "platform_admin" ||
    value === "platform" ||
    value === "platform-admin"
  ) {
    return "platform_admin";
  }

  if (
    value === "isp_admin" ||
    value === "isp" ||
    value === "isp-admin"
  ) {
    return "isp_admin";
  }

  return null;
}

function getErrorMessage(status: number, data: LoginResponse | MeResponse): string {
  if (typeof data.detail === "string") {
    return `${status}: ${data.detail}`;
  }

  if (typeof data.message === "string") {
    return `${status}: ${data.message}`;
  }

  const firstDetail = data.details?.[0]?.msg ?? data.details?.[0]?.message;

  if (firstDetail) {
    return `${status}: ${firstDetail}`;
  }

  return `${status}: Login failed.`;
}

async function getCurrentAdminRole(accessToken: string): Promise<AdminRole | null> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await readJson<MeResponse>(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status, data));
  }

  return normalizeAdminRole(data.role) ?? normalizeAdminRole(data.admin_role);
}

function getRoleFromTokenOrResponse(token: string, response: LoginResponse): AdminRole | null {
  const payload = decodeJwtPayload(token);

  return (
    normalizeAdminRole(response.role) ??
    normalizeAdminRole(response.admin_role) ??
    normalizeAdminRole(payload.role) ??
    normalizeAdminRole(payload.admin_role)
  );
}

export async function loginAdmin(identifier: string, password: string): Promise<AdminLoginResult> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier,
      password,
      account_type: "admin",
    }),
  });

  const data = await readJson<LoginResponse>(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status, data));
  }

  if (data.mfa_required) {
    return {
      kind: "mfa_required",
      challengeToken: data.challenge_token ?? data.mfa_challenge_token,
      method: data.method ?? data.mfa_method,
      expiresAt: data.expires_at,
    };
  }

  const accessToken = data.access_token ?? data.token;

  if (!accessToken) {
    throw new Error("Login succeeded but no access token was returned.");
  }

  const payload = decodeJwtPayload(accessToken);
  const accountType = data.account_type ?? payload.account_type;

  if (accountType !== "admin") {
    throw new Error("This login page is only for admin accounts.");
  }

  const roleFromLogin = getRoleFromTokenOrResponse(accessToken, data);
  const role = roleFromLogin ?? (await getCurrentAdminRole(accessToken));

  if (!role) {
    throw new Error("Admin role was not found from login or /auth/me.");
  }

  return {
    kind: "authenticated",
    accessToken,
    role,
    identifier,
  };
}
