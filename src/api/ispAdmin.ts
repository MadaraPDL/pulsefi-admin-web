import { apiRequest } from "./client";

export type StatusCounts = {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  pending: number;
  expired: number;
  cancelled: number;
  maintenance: number;
};

export type ISPAdminSummary = {
  isp_id: string;
  users: StatusCounts;
  plans: StatusCounts;
  subscriptions: StatusCounts;
  routers: StatusCounts;
};

export type AppUserInvitationStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired";

export type AppUserInvitationFilter = AppUserInvitationStatus | "all";

export type CreateAppUserInvitationRequest = {
  email: string;
  full_name?: string | null;
  expires_in_days: number;
};

export type AppUserInvitation = {
  id: string;
  email: string;
  full_name: string | null;
  account_type: string;
  admin_role: string | null;
  isp_id: string | null;
  invited_by_admin_id: string | null;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  dev_invitation_token: string | null;
};

export type RevokeAppUserInvitationResponse = {
  message: string;
  invitation: AppUserInvitation;
};

export async function getISPAdminSummary(): Promise<ISPAdminSummary> {
  return apiRequest<ISPAdminSummary>("/isp-admin/summary");
}

export async function createAppUserInvitation(
  payload: CreateAppUserInvitationRequest
): Promise<AppUserInvitation> {
  return apiRequest<AppUserInvitation>("/isp-admin/user-invitations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listAppUserInvitations(
  status: AppUserInvitationStatus | null = null,
  limit = 50,
  offset = 0
): Promise<AppUserInvitation[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (status) {
    params.set("status", status);
  }

  return apiRequest<AppUserInvitation[]>(
    `/isp-admin/user-invitations?${params.toString()}`
  );
}

export async function revokeAppUserInvitation(
  invitationId: string
): Promise<RevokeAppUserInvitationResponse> {
  return apiRequest<RevokeAppUserInvitationResponse>(
    `/isp-admin/user-invitations/${invitationId}/revoke`,
    {
      method: "PATCH",
    }
  );
}
