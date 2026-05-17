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

export async function getISPAdminSummary(): Promise<ISPAdminSummary> {
  return apiRequest<ISPAdminSummary>("/isp-admin/summary");
}
