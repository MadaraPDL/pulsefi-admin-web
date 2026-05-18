import { apiRequest } from "./client";
import {
  confirmMFASetup,
  loginAsAdmin,
  verifyMFA,
} from "./auth";
import type {
  AuthTokenResponse,
  MFARequiredResponse,
  MFASetupRequiredResponse,
} from "./auth";

export type AdminRole = "platform_admin" | "isp_admin";

export type CurrentAdminResponse = {
  account_type: "admin" | "app_user";
  account_id: string;
  full_name: string;
  email: string;
  username: string | null;
  role: string | null;
  status: string;
  email_verified_at: string | null;
  mfa_enabled: boolean;
  mfa_required: boolean;
  preferred_mfa_method: string | null;
};

export type AdminAuthenticatedResult = {
  kind: "authenticated";
  accessToken: string;
  role: AdminRole;
  identifier: string;
  session: AuthTokenResponse;
};

export type AdminLoginResult =
  | AdminAuthenticatedResult
  | {
      kind: "mfa_required";
      challenge: MFARequiredResponse;
      identifier: string;
    }
  | {
      kind: "mfa_setup_required";
      setup: MFASetupRequiredResponse;
      identifier: string;
    };

function isMFASetupRequiredResponse(
  response: unknown
): response is MFASetupRequiredResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "mfa_setup_required" in response
  );
}

function isMFARequiredResponse(response: unknown): response is MFARequiredResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "mfa_required" in response
  );
}

function normalizeAdminRole(value: unknown): AdminRole | null {
  if (value === "platform_admin") {
    return "platform_admin";
  }

  if (value === "isp_admin") {
    return "isp_admin";
  }

  return null;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split(".");

  if (!payload) {
    return {};
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "="
    );
    const decoded = window.atob(paddedPayload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function getRoleFromTokenOrResponse(session: AuthTokenResponse): AdminRole | null {
  const payload = decodeJwtPayload(session.access_token);

  return normalizeAdminRole(session.role) ?? normalizeAdminRole(payload.role);
}

export async function getCurrentAdmin(
  accessToken: string
): Promise<CurrentAdminResponse> {
  return apiRequest<CurrentAdminResponse>("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

function buildAuthenticatedResultFromCurrentAdmin(
  currentAdmin: CurrentAdminResponse,
  accessToken: string
): AdminAuthenticatedResult {
  if (currentAdmin.account_type !== "admin") {
    throw new Error("This login page is only for admin accounts.");
  }

  const role = normalizeAdminRole(currentAdmin.role);

  if (!role) {
    throw new Error("Admin role was not found from /auth/me.");
  }

  return {
    kind: "authenticated",
    accessToken,
    role,
    identifier: currentAdmin.email,
    session: {
      access_token: accessToken,
      token_type: "bearer",
      account_type: "admin",
      account_id: currentAdmin.account_id,
      full_name: currentAdmin.full_name,
      email: currentAdmin.email,
      role,
    },
  };
}

async function buildAuthenticatedResult(
  session: AuthTokenResponse,
  identifier: string
): Promise<AdminAuthenticatedResult> {
  if (session.account_type !== "admin") {
    throw new Error("This login page is only for admin accounts.");
  }

  const roleFromTokenOrResponse = getRoleFromTokenOrResponse(session);
  const currentAdmin = roleFromTokenOrResponse
    ? null
    : await getCurrentAdmin(session.access_token);
  const role =
    roleFromTokenOrResponse ?? normalizeAdminRole(currentAdmin?.role);

  if (!role) {
    throw new Error("Admin role was not found from login response or /auth/me.");
  }

  return {
    kind: "authenticated",
    accessToken: session.access_token,
    role,
    identifier,
    session: {
      ...session,
      role,
    },
  };
}

export async function restoreAdminSession(
  accessToken: string
): Promise<AdminAuthenticatedResult> {
  const currentAdmin = await getCurrentAdmin(accessToken);

  return buildAuthenticatedResultFromCurrentAdmin(currentAdmin, accessToken);
}

export async function loginAdmin(
  identifier: string,
  password: string
): Promise<AdminLoginResult> {
  const response = await loginAsAdmin(identifier, password);

  if (isMFASetupRequiredResponse(response)) {
    return {
      kind: "mfa_setup_required",
      setup: response,
      identifier,
    };
  }

  if (isMFARequiredResponse(response)) {
    return {
      kind: "mfa_required",
      challenge: response,
      identifier,
    };
  }

  return buildAuthenticatedResult(response, identifier);
}

export async function verifyAdminMFA(
  challengeToken: string,
  code: string,
  identifier: string
): Promise<AdminAuthenticatedResult> {
  const session = await verifyMFA({
    challenge_token: challengeToken,
    code,
  });

  return buildAuthenticatedResult(session, identifier);
}

export async function confirmAdminMFASetup(
  mfaSetupToken: string,
  code: string,
  identifier: string
): Promise<AdminAuthenticatedResult> {
  const session = await confirmMFASetup({
    mfa_setup_token: mfaSetupToken,
    code,
  });

  return buildAuthenticatedResult(session, identifier);
}
