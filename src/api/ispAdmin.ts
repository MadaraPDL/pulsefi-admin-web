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


export type ISPAdminAnalyticsSummary = {
  isp_id: string;
  generated_at: string;
  period_start: string | null;
  period_end: string | null;

  total_users: number;
  active_users: number;

  total_subscriptions: number;
  active_subscriptions: number;

  total_routers: number;
  active_routers: number;

  pending_plan_change_requests: number;
  approved_plan_change_requests: number;
  rejected_plan_change_requests: number;

  total_alerts: number;
  unread_alerts: number;
  critical_alerts: number;

  total_recommendations: number;
  new_recommendations: number;
  accepted_recommendations: number;

  total_usage_mb: string | number;
  total_usage_gb: string | number;
};

export type ISPAdminAlert = {
  id: string;
  user_id: string;
  user_subscription_id: string;
  device_id: string | null;
  connection_log_id: string | null;
  usage_id: string | null;
  prediction_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  read_at: string | null;
  created_at: string;
};

export type ISPAdminAlertListParams = {
  user_id?: string;
  user_subscription_id?: string;
  device_id?: string;
  alert_type?: string;
  severity?: string;
  status?: string;
  start_at?: string;
  end_at?: string;
  limit?: number;
  offset?: number;
};

export async function getISPAdminAnalyticsSummary(
  periodStart: string | null = null,
  periodEnd: string | null = null
): Promise<ISPAdminAnalyticsSummary> {
  const params = new URLSearchParams();

  if (periodStart) {
    params.set("period_start", periodStart);
  }

  if (periodEnd) {
    params.set("period_end", periodEnd);
  }

  const query = params.toString();

  return apiRequest<ISPAdminAnalyticsSummary>(
    `/isp-admin/analytics/summary${query ? `?${query}` : ""}`
  );
}

export async function listISPAdminAlerts(
  filters: ISPAdminAlertListParams = {}
): Promise<ISPAdminAlert[]> {
  const params = new URLSearchParams({
    limit: String(filters.limit ?? 10),
    offset: String(filters.offset ?? 0),
  });

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && key !== "limit" && key !== "offset") {
      params.set(key, String(value));
    }
  }

  return apiRequest<ISPAdminAlert[]>(`/isp-admin/alerts?${params.toString()}`);
}


export type ISPAdminReportType =
  | "usage_report"
  | "device_report"
  | "alert_report"
  | "recommendation_report"
  | "network_performance_report";

export type ISPAdminReport = {
  id: string;
  isp_id: string;
  generated_by_admin_id: string | null;
  report_type: ISPAdminReportType | string;
  title: string;
  period_start: string | null;
  period_end: string | null;
  report_data: Record<string, unknown> | null;
  file_url: string | null;
  created_at: string;
};

export type CreateISPAdminReportRequest = {
  report_type: ISPAdminReportType;
  title?: string | null;
  period_start?: string | null;
  period_end?: string | null;
};

export type PlanChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";

export type PlanChangeReviewDecision = "approve" | "reject";

export type ISPAdminPlanChangeRequest = {
  id: string;
  user_id: string;
  user_subscription_id: string;
  current_plan_id: string;
  requested_plan_id: string;
  recommendation_id: string | null;
  request_type: string;
  reason: string | null;
  status: PlanChangeRequestStatus | string;
  requested_at: string;
  reviewed_by_admin_id: string | null;
  reviewed_at: string | null;
  admin_response: string | null;
  updated_at: string;
};

export async function listISPAdminReports(
  reportType: ISPAdminReportType | null = null,
  limit = 20,
  offset = 0
): Promise<ISPAdminReport[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (reportType) {
    params.set("report_type", reportType);
  }

  return apiRequest<ISPAdminReport[]>(`/isp-admin/reports?${params.toString()}`);
}

export async function getISPAdminReport(reportId: string): Promise<ISPAdminReport> {
  return apiRequest<ISPAdminReport>(`/isp-admin/reports/${reportId}`);
}

export async function createISPAdminReport(
  payload: CreateISPAdminReportRequest
): Promise<ISPAdminReport> {
  return apiRequest<ISPAdminReport>("/isp-admin/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listPlanChangeRequests(
  status: PlanChangeRequestStatus | null = null,
  limit = 20,
  offset = 0
): Promise<ISPAdminPlanChangeRequest[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (status) {
    params.set("status", status);
  }

  return apiRequest<ISPAdminPlanChangeRequest[]>(
    `/isp-admin/plan-change-requests?${params.toString()}`
  );
}

export async function reviewPlanChangeRequest(
  requestId: string,
  decision: PlanChangeReviewDecision,
  adminResponse: string | null
): Promise<ISPAdminPlanChangeRequest> {
  return apiRequest<ISPAdminPlanChangeRequest>(
    `/isp-admin/plan-change-requests/${requestId}/review`,
    {
      method: "PATCH",
      body: JSON.stringify({
        decision,
        admin_response: adminResponse,
      }),
    }
  );
}


export type ISPAdminUsageRecord = {
  id: string;
  user_id: string;
  user_subscription_id: string;
  router_id: string;
  device_id: string | null;
  upload_mb: string | number;
  download_mb: string | number;
  total_mb: string | number | null;
  record_start: string;
  record_end: string;
  source: string | null;
  created_at: string;
};

export type ISPAdminDeviceConnectionLog = {
  id: string;
  device_id: string;
  router_id: string;
  event_type: string;
  ip_address: string | null;
  details: string | null;
  event_time: string;
};

export type RouterActionLogStatus = "pending" | "success" | "failed";

export type ISPAdminRouterActionLog = {
  id: string;
  router_id: string;
  policy_id: string | null;
  action_type: string;
  command_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  status: RouterActionLogStatus | string;
  error_message: string | null;
  executed_at: string;
};

export async function listISPAdminUsageRecords(
  limit = 10,
  offset = 0
): Promise<ISPAdminUsageRecord[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  return apiRequest<ISPAdminUsageRecord[]>(
    `/isp-admin/usage-records?${params.toString()}`
  );
}

export async function listISPAdminDeviceConnectionLogs(
  limit = 10,
  offset = 0
): Promise<ISPAdminDeviceConnectionLog[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  return apiRequest<ISPAdminDeviceConnectionLog[]>(
    `/isp-admin/device-connection-logs?${params.toString()}`
  );
}

export async function listISPAdminRouterActionLogs(
  status: RouterActionLogStatus | null = null,
  limit = 10,
  offset = 0
): Promise<ISPAdminRouterActionLog[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (status) {
    params.set("status", status);
  }

  return apiRequest<ISPAdminRouterActionLog[]>(
    `/isp-admin/router-action-logs?${params.toString()}`
  );
}


export type ISPAdminPrediction = {
  id: string;
  user_id: string;
  user_subscription_id: string;
  plan_id: string | null;
  prediction_date: string;
  period_start: string;
  period_end: string;
  predicted_usage_gb: string | number;
  confidence_score: string | number | null;
  risk_level: string;
  model_version: string | null;
  created_at: string;
};

export type ISPAdminPredictionGenerationResponse = {
  prediction: ISPAdminPrediction;
  days_elapsed: number;
  total_cycle_days: number;
  observed_usage_gb: string | number;
  average_daily_usage_gb: string | number;
};

export type ISPAdminRecommendation = {
  id: string;
  user_id: string;
  user_subscription_id: string;
  current_plan_id: string | null;
  recommendation_plan_id: string | null;
  prediction_id: string | null;
  recommendation_type: string;
  recommendation_text: string;
  reason: string | null;
  confidence_score: string | number | null;
  status: string;
  created_at: string;
};

export type ISPAdminRecommendationStatus = "new" | "accepted";

export type ISPAdminRecommendationListParams = {
  status?: ISPAdminRecommendationStatus | string | null;
  user_id?: string | null;
  subscription_id?: string | null;
  limit?: number;
  offset?: number;
};

export type ISPAdminRecommendationGenerationResponse = {
  recommendation: ISPAdminRecommendation;
  created: boolean;
  predicted_usage_gb: string | number;
  current_plan_limit_gb: string | number;
  recommended_plan_limit_gb: string | number | null;
};

export async function listRecommendations(
  filters: ISPAdminRecommendationListParams = {}
): Promise<ISPAdminRecommendation[]> {
  const params = new URLSearchParams({
    limit: String(filters.limit ?? 20),
    offset: String(filters.offset ?? 0),
  });

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.user_id) {
    params.set("user_id", filters.user_id);
  }

  if (filters.subscription_id) {
    params.set("subscription_id", filters.subscription_id);
  }

  return apiRequest<ISPAdminRecommendation[]>(
    `/isp-admin/recommendations?${params.toString()}`
  );
}

export async function getRecommendation(
  recommendationId: string
): Promise<ISPAdminRecommendation> {
  return apiRequest<ISPAdminRecommendation>(
    `/isp-admin/recommendations/${recommendationId}`
  );
}

export async function generatePredictionForSubscription(
  subscriptionId: string,
  predictionDate: string | null = null
): Promise<ISPAdminPredictionGenerationResponse> {
  return apiRequest<ISPAdminPredictionGenerationResponse>(
    `/isp-admin/predictions/subscriptions/${subscriptionId}/generate`,
    {
      method: "POST",
      body: JSON.stringify({
        prediction_date: predictionDate,
      }),
    }
  );
}

export async function generateRecommendationForPrediction(
  predictionId: string
): Promise<ISPAdminRecommendationGenerationResponse> {
  return apiRequest<ISPAdminRecommendationGenerationResponse>(
    `/isp-admin/recommendations/predictions/${predictionId}/generate`,
    {
      method: "POST",
    }
  );
}


export type ISPAdminIntelligenceRunItem = {
  subscription_id: string;
  status: string;
  prediction_id: string | null;
  recommendation_id: string | null;
  message: string | null;
};

export type ISPAdminIntelligenceRunResponse = {
  subscriptions_checked: number;
  predictions_created: number;
  recommendations_created: number;
  skipped: number;
  failed: number;
  items: ISPAdminIntelligenceRunItem[];
};

export async function runISPAdminIntelligence(): Promise<ISPAdminIntelligenceRunResponse> {
  return apiRequest<ISPAdminIntelligenceRunResponse>(
    "/isp-admin/intelligence/run",
    {
      method: "POST",
    }
  );
}

export type ISPAdminInvitationStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired";

export type CreateISPAdminInvitationRequest = {
  email: string;
  full_name?: string | null;
  expires_in_days: number;
};

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

export async function createISPAdminInvitationForCurrentISP(
  payload: CreateISPAdminInvitationRequest
): Promise<ISPAdminInvitation> {
  return apiRequest<ISPAdminInvitation>("/isp-admin/admin-invitations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listISPAdminInvitationsForCurrentISP(
  status?: ISPAdminInvitationStatus | null
): Promise<ISPAdminInvitation[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<ISPAdminInvitation[]>(`/isp-admin/admin-invitations${query}`);
}

export async function revokeISPAdminInvitationForCurrentISP(
  invitationId: string
): Promise<RevokeISPAdminInvitationResponse> {
  return apiRequest<RevokeISPAdminInvitationResponse>(
    `/isp-admin/admin-invitations/${invitationId}/revoke`,
    {
      method: "PATCH",
    }
  );
}

export type SimulatorDeviceIngestionResponse = {
  router_id: string;
  user_id: string;
  user_subscription_id: string;
  devices_seen: number;
  devices_created: number;
  devices_updated: number;
  connection_logs_created: number;
  alerts_created: number;
};

export type SimulatorUsageIngestionResponse = {
  router_id: string;
  user_id: string;
  user_subscription_id: string;
  record_start: string;
  record_end: string;
  records_created: number;
  upload_mb: string | number;
  download_mb: string | number;
  total_mb: string | number;
  alerts_created: number;
};

export type SimulatorFullIngestionResponse = {
  router_id: string;
  user_id: string;
  user_subscription_id: string;
  device_ingestion: SimulatorDeviceIngestionResponse;
  usage_ingestion: SimulatorUsageIngestionResponse;
  alerts_created: number;
};

export async function runFullSimulatorIngestionForRouter(
  routerId: string
): Promise<SimulatorFullIngestionResponse> {
  return apiRequest<SimulatorFullIngestionResponse>(
    `/isp-admin/usage-ingestion/routers/${routerId}/simulator/run`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}

