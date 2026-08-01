import "server-only";
import { apiFetch } from "../client";

export interface CreatorApplicationResponse {
  id: string;
  legalName: string;
  businessName: string;
  category: string;
  onboardingStatus: string;
  approvedAt: string | null;
  createdAt: string;
  storeId: string | null;
  storeSlug: string | null;
  storeStatus: string | null;
}

export async function fetchMyCreatorApplication(
  accessToken: string,
): Promise<{ data: CreatorApplicationResponse }> {
  return apiFetch<{ data: CreatorApplicationResponse }>("/creator/application", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
}
