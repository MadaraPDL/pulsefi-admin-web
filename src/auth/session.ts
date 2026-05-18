import type { AuthTokenResponse } from "../api/auth";

const ACCESS_TOKEN_KEY = "pulsefi_access_token";
const ADMIN_NAME_KEY = "pulsefi_admin_name";
const ADMIN_ROLE_KEY = "pulsefi_admin_role";

export function saveSession(session: AuthTokenResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
  localStorage.setItem(ADMIN_NAME_KEY, session.full_name);
  localStorage.setItem(ADMIN_ROLE_KEY, session.role ?? "");
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ADMIN_NAME_KEY);
  localStorage.removeItem(ADMIN_ROLE_KEY);
}

export function hasSession() {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAdminName(fallback: string) {
  return localStorage.getItem(ADMIN_NAME_KEY) ?? fallback;
}

export function getAdminRole() {
  return localStorage.getItem(ADMIN_ROLE_KEY);
}
