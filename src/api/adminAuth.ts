import { apiRequest } from "./client";

export type AdminRole = "platform_admin" | "isp_admin";

export type AdminSession = {
  access_token: string;
  token_type: string;
  account_type: "admin";
  account_id: string;
  full_name: string;
  email: string;
  username?: string | null;
  role: AdminRole;
};

export type MFAMethod = "email" | "authenticator";

export type MFARequiredResponse = {
  mfa_required: true;
  challenge_token: string;
  method: MFAMethod;
  active_methods: MFAMethod[];
  backup_codes_available: boolean;
  expires_at: string;
  message: string;
  dev_email_code?: string | null;
};

export type MFASetupRequiredResponse = {
  mfa_setup_required: true;
  message: string;
  account_type: "admin" | "app_user";
  account_id: string;
  method: "authenticator";
  mfa_setup_token: string;
  authenticator_secret: string;
  authenticator_uri: string;
};

export type AdminLoginResponse =
  | AdminSession
  | MFARequiredResponse
  | MFASetupRequiredResponse;

export type MFAVerifyRequest = {
  challenge_token: string;
  code: string;
};

export type MFASetupConfirmRequest = {
  mfa_setup_token: string;
  code: string;
};

export type ForgotPasswordResponse = {
  message: string;
  dev_reset_url?: string | null;
};

export type ResetPasswordResponse = {
  message: string;
};

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

export type ProfileUpdateChallengeResponse = {
  challenge_token: string;
  method: "email" | "authenticator";
  expires_at: string;
  message: string;
  dev_email_code?: string | null;
};

export type UpdateAdminIdentityRequest = {
  email?: string;
  username?: string;
  mfa_challenge_token: string;
  mfa_code: string;
};

export type MFAStatusResponse = {
  account_type: "admin" | "app_user";
  mfa_required: boolean;
  mfa_enabled: boolean;
  email_mfa_enabled: boolean;
  authenticator_mfa_enabled: boolean;
  preferred_mfa_method: MFAMethod | null;
  active_methods: MFAMethod[];
  can_disable_email_mfa: boolean;
  can_disable_authenticator_mfa: boolean;
};

export type MFABackupCodeStatusResponse = {
  account_type: "admin" | "app_user";
  backup_codes_available: boolean;
  available_backup_code_count: number;
};

export type MFABackupCodesRegenerateResponse = {
  account_type: "admin" | "app_user";
  backup_codes_available: boolean;
  available_backup_code_count: number;
  backup_codes: string[];
  message: string;
};

export type MFASettingsAction =
  | "enable_email"
  | "disable_email"
  | "disable_authenticator"
  | "prefer_email"
  | "prefer_authenticator";

export type MFASettingsChallengeResponse = {
  challenge_token: string;
  method: MFAMethod;
  expires_at: string;
  message: string;
  dev_email_code?: string | null;
};

export type MFASettingsActionRequest = {
  action: MFASettingsAction;
  challenge_token: string;
  code: string;
};
export type AdminAuthenticatedResult = {
  kind: "authenticated";
  accessToken: string;
  role: AdminRole;
  identifier: string;
  session: AdminSession;
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

export function isMFARequiredResponse(
  response: unknown
): response is MFARequiredResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    (response as { mfa_required?: unknown }).mfa_required === true
  );
}

export function isMFASetupRequiredResponse(
  response: unknown
): response is MFASetupRequiredResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    (response as { mfa_setup_required?: unknown }).mfa_setup_required === true
  );
}

function isAdminRole(role: unknown): role is AdminRole {
  return role === "platform_admin" || role === "isp_admin";
}

export function assertAdminSession(response: unknown): AdminSession {
  const session = response as Partial<AdminSession>;

  if (
    session.account_type !== "admin" ||
    !isAdminRole(session.role) ||
    !session.access_token ||
    !session.account_id ||
    !session.full_name ||
    !session.email
  ) {
    throw new Error(
      "This dashboard is only for Platform Admin and ISP Admin accounts."
    );
  }

  return session as AdminSession;
}

export function buildAdminAuthenticatedResult(
  session: AdminSession,
  identifier = session.email
): AdminAuthenticatedResult {
  return {
    kind: "authenticated",
    accessToken: session.access_token,
    role: session.role,
    identifier,
    session,
  };
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

export async function restoreAdminSession(
  accessToken: string
): Promise<AdminAuthenticatedResult> {
  const currentAdmin = await getCurrentAdmin(accessToken);

  if (currentAdmin.account_type !== "admin" || !isAdminRole(currentAdmin.role)) {
    throw new Error(
      "This dashboard is only for Platform Admin and ISP Admin accounts."
    );
  }

  return buildAdminAuthenticatedResult({
    access_token: accessToken,
    token_type: "bearer",
    account_type: "admin",
    account_id: currentAdmin.account_id,
    full_name: currentAdmin.full_name,
    email: currentAdmin.email,
    username: currentAdmin.username,
    role: currentAdmin.role,
  });
}

export async function loginAsAdmin(
  identifier: string,
  password: string
): Promise<AdminLoginResponse> {
  return apiRequest<AdminLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      account_type: "admin",
      identifier,
      password,
    }),
  });
}

export async function loginAdmin(
  identifier: string,
  password: string
): Promise<AdminLoginResult> {
  const response = await loginAsAdmin(identifier, password);

  if (isMFARequiredResponse(response)) {
    return {
      kind: "mfa_required",
      challenge: response,
      identifier,
    };
  }

  if (isMFASetupRequiredResponse(response)) {
    return {
      kind: "mfa_setup_required",
      setup: response,
      identifier,
    };
  }

  return buildAdminAuthenticatedResult(assertAdminSession(response), identifier);
}

export async function changeAdminMFAChallengeMethod(payload: {
  challenge_token: string;
  method: MFAMethod;
}): Promise<MFARequiredResponse> {
  return apiRequest<MFARequiredResponse>("/auth/mfa/challenge-method", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function verifyAdminMFA(
  payload: MFAVerifyRequest
): Promise<AdminSession> {
  const response = await apiRequest<unknown>("/auth/mfa/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return assertAdminSession(response);
}

export async function confirmAdminMFASetup(
  payload: MFASetupConfirmRequest
): Promise<AdminSession> {
  const response = await apiRequest<unknown>("/auth/mfa/setup/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return assertAdminSession(response);
}

export async function requestAdminPasswordReset(
  identifier: string
): Promise<ForgotPasswordResponse> {
  return apiRequest<ForgotPasswordResponse>("/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({
      account_type: "admin",
      identifier,
    }),
  });
}

export async function requestAdminIdentityVerification(): Promise<ProfileUpdateChallengeResponse> {
  return apiRequest<ProfileUpdateChallengeResponse>(
    "/auth/me/profile-update-challenge",
    {
      method: "POST",
    }
  );
}

export async function updateAdminIdentity(
  payload: UpdateAdminIdentityRequest
): Promise<CurrentAdminResponse> {
  return apiRequest<CurrentAdminResponse>("/auth/me/identity", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function resetAdminPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResponse> {
  return apiRequest<ResetPasswordResponse>("/auth/password/reset", {
    method: "POST",
    body: JSON.stringify({
      token,
      new_password: newPassword,
    }),
  });
}
export async function getAdminMFABackupCodeStatus(): Promise<MFABackupCodeStatusResponse> {
  return apiRequest<MFABackupCodeStatusResponse>("/auth/me/mfa/backup-codes/status");
}

export async function regenerateAdminMFABackupCodes(payload: {
  challenge_token: string;
  code: string;
}): Promise<MFABackupCodesRegenerateResponse> {
  return apiRequest<MFABackupCodesRegenerateResponse>(
    "/auth/me/mfa/backup-codes/regenerate",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function getAdminMFAStatus(): Promise<MFAStatusResponse> {
  return apiRequest<MFAStatusResponse>("/auth/me/mfa/status");
}

export async function enableAdminEmailMFA(): Promise<MFAStatusResponse> {
  return apiRequest<MFAStatusResponse>("/auth/me/mfa/email/enable", {
    method: "POST",
  });
}

export async function disableAdminEmailMFA(): Promise<MFAStatusResponse> {
  return apiRequest<MFAStatusResponse>("/auth/me/mfa/email/disable", {
    method: "PATCH",
  });
}

export async function disableAdminAuthenticatorMFA(): Promise<MFAStatusResponse> {
  return apiRequest<MFAStatusResponse>("/auth/me/mfa/authenticator/disable", {
    method: "PATCH",
  });
}

export async function setAdminPreferredMFAMethod(
  method: MFAMethod
): Promise<MFAStatusResponse> {
  return apiRequest<MFAStatusResponse>("/auth/me/mfa/preferred-method", {
    method: "PATCH",
    body: JSON.stringify({ method }),
  });
}
export async function createAdminMFASettingsChallenge(
  method: MFAMethod
): Promise<MFASettingsChallengeResponse> {
  return apiRequest<MFASettingsChallengeResponse>("/auth/me/mfa/settings-challenge", {
    method: "POST",
    body: JSON.stringify({ method }),
  });
}

export async function applyAdminMFASettingsAction(
  payload: MFASettingsActionRequest
): Promise<MFAStatusResponse> {
  return apiRequest<MFAStatusResponse>("/auth/me/mfa/settings-action", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
