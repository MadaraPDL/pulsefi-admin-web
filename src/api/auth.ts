import { apiRequest } from "./client";

export type AccountType = "admin" | "app_user";
export type MFAMethod = "email" | "authenticator";

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  account_type: AccountType;
  account_id: string;
  full_name: string;
  email: string;
  role: string | null;
};

export type MFASetupRequiredResponse = {
  mfa_setup_required: true;
  message: string;
  account_type: AccountType;
  account_id: string;
  method: "authenticator";
  mfa_setup_token: string;
  authenticator_secret: string;
  authenticator_uri: string;
};

export type MFARequiredResponse = {
  mfa_required: true;
  challenge_token: string;
  method: MFAMethod;
  expires_at: string;
  message: string;
  dev_email_code?: string | null;
};

export type LoginResponse =
  | AuthTokenResponse
  | MFARequiredResponse
  | MFASetupRequiredResponse;

export type AcceptInvitationRequest = {
  token: string;
  username: string;
  password: string;
  preferred_mfa_method?: MFAMethod | null;
};

export type AcceptInvitationResponse = {
  message: string;
  account_type: AccountType;
  account_id: string;
  email: string;
};

export type MFAVerifyRequest = {
  challenge_token: string;
  code: string;
};

export type MFASetupConfirmRequest = {
  mfa_setup_token: string;
  code: string;
};

export async function loginAsAdmin(
  identifier: string,
  password: string
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      account_type: "admin",
      identifier,
      password,
    }),
  });
}

export async function acceptInvitation(
  payload: AcceptInvitationRequest
): Promise<AcceptInvitationResponse> {
  return apiRequest<AcceptInvitationResponse>("/auth/invitations/accept", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyMFA(
  payload: MFAVerifyRequest
): Promise<AuthTokenResponse> {
  return apiRequest<AuthTokenResponse>("/auth/mfa/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function confirmMFASetup(
  payload: MFASetupConfirmRequest
): Promise<AuthTokenResponse> {
  return apiRequest<AuthTokenResponse>("/auth/mfa/setup/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
