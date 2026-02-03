import { apiRequest } from "./client";

export type CompanyProfile = {
  id: string;
  name: string;
  website: string;
  logoUrl?: string;
  domains?: string[];
};

export type RecruiterProfile = {
  id: string;
  name: string;
  title?: string;
  email?: string;
};

export const getCompanyProfile = async () => {
  return apiRequest<{ company: CompanyProfile }>("/api/v1/companies/me", { auth: true });
};

export const updateCompanyProfile = async (payload: {
  name?: string;
  website?: string;
  logoUrl?: string;
}) => {
  return apiRequest<{ company: CompanyProfile }>("/api/v1/companies/me", {
    method: "PUT",
    auth: true,
    body: payload
  });
};

export const getRecruiterProfile = async () => {
  return apiRequest<{ recruiter: RecruiterProfile }>("/api/v1/recruiters/me", { auth: true });
};

export const updateRecruiterProfile = async (payload: { name?: string; title?: string }) => {
  return apiRequest<{ recruiter: RecruiterProfile }>("/api/v1/recruiters/me", {
    method: "PUT",
    auth: true,
    body: payload
  });
};
