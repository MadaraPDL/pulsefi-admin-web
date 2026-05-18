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

export type AppUserStatus = "active" | "inactive" | "suspended";

export type AppUserFilter = AppUserStatus | "all";

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

export type AppUser = {
  id: string;
  isp_id: string;
  full_name: string;
  email: string;
  username: string | null;
  phone_number: string | null;
  status: AppUserStatus;
  created_by_admin_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  email_verified_at: string | null;
  mfa_enabled: boolean;
  mfa_required: boolean;
  preferred_mfa_method: string | null;
};

export type UpdateAppUserRequest = {
  full_name?: string;
  phone_number?: string | null;
  status?: AppUserStatus;
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

export async function listISPAdminAppUsers(
  status: AppUserStatus | null = null,
  limit = 50,
  offset = 0
): Promise<AppUser[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (status) {
    params.set("status", status);
  }

  return apiRequest<AppUser[]>(`/isp-admin/users?${params.toString()}`);
}

export async function getISPAdminAppUser(userId: string): Promise<AppUser> {
  return apiRequest<AppUser>(`/isp-admin/users/${userId}`);
}

export async function updateISPAdminAppUser(
  userId: string,
  payload: UpdateAppUserRequest
): Promise<AppUser> {
  return apiRequest<AppUser>(`/isp-admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export type SubscriptionPlanActiveFilter = "all" | "active" | "inactive";

export type SubscriptionPlan = {
  id: string;
  isp_id: string;
  plan_name: string;
  monthly_price: string | number;
  data_limit_gb: string | number;
  speed_limit_mbps: string | number | null;
  description: string | null;
  is_active: boolean;
  created_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateSubscriptionPlanRequest = {
  plan_name: string;
  monthly_price: string | number;
  data_limit_gb: string | number;
  speed_limit_mbps?: string | number | null;
  description?: string | null;
  is_active: boolean;
};

export type UpdateSubscriptionPlanRequest = {
  plan_name?: string;
  monthly_price?: string | number;
  data_limit_gb?: string | number;
  speed_limit_mbps?: string | number | null;
  description?: string | null;
  is_active?: boolean;
};

export async function createSubscriptionPlan(
  payload: CreateSubscriptionPlanRequest
): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>("/isp-admin/plans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listSubscriptionPlans(
  isActive: boolean | null = null,
  limit = 50,
  offset = 0
): Promise<SubscriptionPlan[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (isActive !== null) {
    params.set("is_active", String(isActive));
  }

  return apiRequest<SubscriptionPlan[]>(`/isp-admin/plans?${params.toString()}`);
}

export async function getSubscriptionPlan(
  planId: string
): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>(`/isp-admin/plans/${planId}`);
}

export async function updateSubscriptionPlan(
  planId: string,
  payload: UpdateSubscriptionPlanRequest
): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>(`/isp-admin/plans/${planId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export type UserSubscriptionStatus =
  | "pending"
  | "active"
  | "suspended"
  | "expired"
  | "cancelled";

export type UserSubscriptionFilter = UserSubscriptionStatus | "all";

export type UserSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  subscription_label: string | null;
  assigned_by_admin_id: string | null;
  start_date: string;
  end_date: string | null;
  status: UserSubscriptionStatus;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateUserSubscriptionRequest = {
  user_id: string;
  plan_id: string;
  subscription_label?: string | null;
  start_date: string;
  end_date?: string | null;
  status: UserSubscriptionStatus;
  auto_renew: boolean;
};

export type UpdateUserSubscriptionRequest = {
  plan_id?: string;
  subscription_label?: string | null;
  start_date?: string;
  end_date?: string | null;
  status?: UserSubscriptionStatus;
  auto_renew?: boolean;
};

export async function createUserSubscription(
  payload: CreateUserSubscriptionRequest
): Promise<UserSubscription> {
  return apiRequest<UserSubscription>("/isp-admin/subscriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listUserSubscriptions(
  status: UserSubscriptionStatus | null = null,
  userId: string | null = null,
  limit = 50,
  offset = 0
): Promise<UserSubscription[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (status) {
    params.set("status", status);
  }

  if (userId) {
    params.set("user_id", userId);
  }

  return apiRequest<UserSubscription[]>(
    `/isp-admin/subscriptions?${params.toString()}`
  );
}

export async function getUserSubscription(
  subscriptionId: string
): Promise<UserSubscription> {
  return apiRequest<UserSubscription>(
    `/isp-admin/subscriptions/${subscriptionId}`
  );
}

export async function updateUserSubscription(
  subscriptionId: string,
  payload: UpdateUserSubscriptionRequest
): Promise<UserSubscription> {
  return apiRequest<UserSubscription>(
    `/isp-admin/subscriptions/${subscriptionId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export type RouterStatus = "active" | "inactive" | "maintenance";

export type RouterFilter = RouterStatus | "all";

export type ISPAdminRouter = {
  id: string;
  isp_id: string;
  user_subscription_id: string | null;
  assigned_by_admin_id: string | null;
  router_name: string | null;
  router_model: string | null;
  router_ip: string | null;
  mac_address: string | null;
  api_endpoint: string | null;
  username: string | null;
  status: RouterStatus;
  created_at: string;
  updated_at: string;
};

export type CreateRouterRequest = {
  user_subscription_id: string;
  router_name?: string | null;
  router_model?: string | null;
  router_ip?: string | null;
  mac_address?: string | null;
  api_endpoint?: string | null;
  username?: string | null;
  status: RouterStatus;
};

export type UpdateRouterRequest = {
  user_subscription_id?: string;
  router_name?: string | null;
  router_model?: string | null;
  router_ip?: string | null;
  mac_address?: string | null;
  api_endpoint?: string | null;
  username?: string | null;
  status?: RouterStatus;
};

export async function createRouter(
  payload: CreateRouterRequest
): Promise<ISPAdminRouter> {
  return apiRequest<ISPAdminRouter>("/isp-admin/routers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listRouters(
  status: RouterStatus | null = null,
  userSubscriptionId: string | null = null,
  limit = 50,
  offset = 0
): Promise<ISPAdminRouter[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (status) {
    params.set("status", status);
  }

  if (userSubscriptionId) {
    params.set("user_subscription_id", userSubscriptionId);
  }

  return apiRequest<ISPAdminRouter[]>(`/isp-admin/routers?${params.toString()}`);
}

export async function getRouter(routerId: string): Promise<ISPAdminRouter> {
  return apiRequest<ISPAdminRouter>(`/isp-admin/routers/${routerId}`);
}

export async function updateRouter(
  routerId: string,
  payload: UpdateRouterRequest
): Promise<ISPAdminRouter> {
  return apiRequest<ISPAdminRouter>(`/isp-admin/routers/${routerId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
