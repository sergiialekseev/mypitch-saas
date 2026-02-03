import { apiRequest } from "./client";

export type CompanyInvite = {
  id: string;
  email: string;
  status: string;
  createdAt?: string | null;
  expiresAt?: string | null;
  usedAt?: string | null;
  link?: string;
};

export type CompanyInfo = {
  id: string;
  name: string;
  website: string;
  logoUrl?: string;
  domains?: string[];
};

export const getCompany = async () => {
  return apiRequest<{ company: CompanyInfo }>("/api/v1/companies/me", { auth: true });
};

export const listCompanyInvites = async () => {
  return apiRequest<{ invites: CompanyInvite[] }>("/api/v1/companies/invites", { auth: true });
};

export const createCompanyInvite = async (email: string) => {
  return apiRequest<{ invite: CompanyInvite }>("/api/v1/companies/invites", {
    method: "POST",
    auth: true,
    body: { email }
  });
};

export const resendCompanyInvite = async (inviteId: string) => {
  return apiRequest<{ ok: boolean }>(`/api/v1/companies/invites/${inviteId}/resend`, {
    method: "POST",
    auth: true
  });
};

export const revokeCompanyInvite = async (inviteId: string) => {
  return apiRequest<{ ok: boolean }>(`/api/v1/companies/invites/${inviteId}/revoke`, {
    method: "POST",
    auth: true
  });
};

export const getCompanyInvite = async (inviteId: string) => {
  return apiRequest<{ invite: CompanyInvite; company: CompanyInfo }>(`/api/v1/companies/invites/${inviteId}`);
};

export const acceptCompanyInvite = async (inviteId: string) => {
  return apiRequest<{ ok: boolean; companyId: string }>(`/api/v1/companies/invites/${inviteId}/accept`, {
    method: "POST",
    auth: true
  });
};
