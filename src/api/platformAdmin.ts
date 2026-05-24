import { apiRequest } from "./client";

export type PlatformAdminSummary = {
  total_isps: number;
  active_isps: number;
  inactive_isps: number;
  suspended_isps: number;

  total_isp_admins: number;
  active_isp_admins: number;
  inactive_isp_admins: number;
  suspended_isp_admins: number;

  total_app_users: number;
  active_app_users: number;
  inactive_app_users: number;
  suspended_app_users: number;
};

export type ISPStatus = "active" | "inactive" | "suspended";

export type ISP = {
  id: string;
  name: string;
  contact_email: string | null;
  phone_number: string | null;
  address: string | null;
  status: ISPStatus;
  created_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateISPRequest = {
  name: string;
  contact_email?: string | null;
  phone_number?: string | null;
  address?: string | null;
};

export type UpdateISPRequest = {
  name?: string;
  contact_email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  status?: ISPStatus;
};

export type CreateISPAdminInvitationRequest = {
  email: string;
  full_name?: string | null;
  expires_in_days: number;
};

export type ISPAdminInvitationStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired";

export type ISPAdminInvitationFilter = ISPAdminInvitationStatus | "all";

export type ISPAdminInvitation = {
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

export type RevokeISPAdminInvitationResponse = {
  message: string;
  invitation: ISPAdminInvitation;
};


export type PlatformAdminInvitationStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired";

export type PlatformAdminInvitationFilter =
  | PlatformAdminInvitationStatus
  | "all";

export type CreatePlatformAdminInvitationRequest = {
  email: string;
  full_name?: string | null;
  expires_in_days: number;
};

export type PlatformAdminInvitation = {
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

export type RevokePlatformAdminInvitationResponse = {
  message: string;
  invitation: PlatformAdminInvitation;
};

export type PlatformAdminAccount = {
  id: string;
  isp_id: string | null;
  full_name: string;
  email: string;
  username: string | null;
  phone_number: string | null;
  role: "platform_admin";
  status: "active" | "inactive" | "suspended";
  created_by_admin_id: string | null;
  email_verified_at: string | null;
  mfa_enabled: boolean;
  mfa_required: boolean;
  preferred_mfa_method: string | null;
  created_at: string;
  updated_at: string;
};

export type ISPAdminStatus = "active" | "inactive" | "suspended";

export type ISPAdminFilter = ISPAdminStatus | "all";

export type ISPAdmin = {
  id: string;
  isp_id: string | null;
  full_name: string;
  email: string;
  username: string | null;
  phone_number: string | null;
  role: string;
  status: ISPAdminStatus;
  created_by_admin_id: string | null;
  email_verified_at: string | null;
  mfa_enabled: boolean;
  mfa_required: boolean;
  preferred_mfa_method: string | null;
  created_at: string;
  updated_at: string;
};

export type UpdateISPAdminRequest = {
  full_name?: string;
  phone_number?: string | null;
  status?: ISPAdminStatus;
};

export async function getPlatformAdminSummary(): Promise<PlatformAdminSummary> {
  return apiRequest<PlatformAdminSummary>("/platform-admin/summary");
}

export async function listISPs(): Promise<ISP[]> {
  return apiRequest<ISP[]>("/platform-admin/isps");
}

export async function getISP(ispId: string): Promise<ISP> {
  return apiRequest<ISP>(`/platform-admin/isps/${ispId}`);
}

export async function createISP(payload: CreateISPRequest): Promise<ISP> {
  return apiRequest<ISP>("/platform-admin/isps", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateISP(
  ispId: string,
  payload: UpdateISPRequest
): Promise<ISP> {
  return apiRequest<ISP>(`/platform-admin/isps/${ispId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createISPAdminInvitation(
  ispId: string,
  payload: CreateISPAdminInvitationRequest
): Promise<ISPAdminInvitation> {
  return apiRequest<ISPAdminInvitation>(
    `/platform-admin/isps/${ispId}/admin-invitations`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}


export async function listISPAdminInvitations(
  ispId: string,
  status: ISPAdminInvitationStatus | null = null,
  limit = 50,
  offset = 0
): Promise<ISPAdminInvitation[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (status) {
    params.set("status", status);
  }

  return apiRequest<ISPAdminInvitation[]>(
    `/platform-admin/isps/${ispId}/admin-invitations?${params.toString()}`
  );
}

export async function revokeISPAdminInvitation(
  ispId: string,
  invitationId: string
): Promise<RevokeISPAdminInvitationResponse> {
  return apiRequest<RevokeISPAdminInvitationResponse>(
    `/platform-admin/isps/${ispId}/admin-invitations/${invitationId}/revoke`,
    {
      method: "PATCH",
    }
  );
}

export async function listISPAdmins(
  ispId: string,
  status: ISPAdminStatus | null = null,
  limit = 50,
  offset = 0
): Promise<ISPAdmin[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (status) {
    params.set("status", status);
  }

  return apiRequest<ISPAdmin[]>(
    `/platform-admin/isps/${ispId}/admins?${params.toString()}`
  );
}

export async function getISPAdmin(
  ispId: string,
  adminId: string
): Promise<ISPAdmin> {
  return apiRequest<ISPAdmin>(
    `/platform-admin/isps/${ispId}/admins/${adminId}`
  );
}

export async function updateISPAdmin(
  ispId: string,
  adminId: string,
  payload: UpdateISPAdminRequest
): Promise<ISPAdmin> {
  return apiRequest<ISPAdmin>(
    `/platform-admin/isps/${ispId}/admins/${adminId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function createPlatformAdminInvitation(
  payload: CreatePlatformAdminInvitationRequest
): Promise<PlatformAdminInvitation> {
  return apiRequest<PlatformAdminInvitation>(
    "/platform-admin/platform-admin-invitations",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function listPlatformAdminInvitations(
  status: PlatformAdminInvitationStatus | null = null,
  limit = 50,
  offset = 0
): Promise<PlatformAdminInvitation[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (status) {
    params.set("status", status);
  }

  return apiRequest<PlatformAdminInvitation[]>(
    `/platform-admin/platform-admin-invitations?${params.toString()}`
  );
}

export async function revokePlatformAdminInvitation(
  invitationId: string
): Promise<RevokePlatformAdminInvitationResponse> {
  return apiRequest<RevokePlatformAdminInvitationResponse>(
    `/platform-admin/platform-admin-invitations/${invitationId}/revoke`,
    {
      method: "PATCH",
    }
  );
}

export async function listPlatformAdmins(
  status: "active" | "inactive" | "suspended" | null = null,
  limit = 50,
  offset = 0
): Promise<PlatformAdminAccount[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (status) {
    params.set("status", status);
  }

  return apiRequest<PlatformAdminAccount[]>(
    `/platform-admin/platform-admins?${params.toString()}`
  );
}
