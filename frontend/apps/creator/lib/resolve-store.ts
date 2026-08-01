import "server-only";
import { getBackendAccessToken } from "@dbk/auth/server";
import { fetchMyCreatorApplication, ApiError } from "@dbk/api-client/server";

export type StoreResolution =
  | { status: "ready"; storeId: string; accessToken: string }
  | { status: "blocked" }
  | { status: "not-onboarded" };

/**
 * See `@dbk/auth`'s `getBackendAccessToken` doc comment: the auth bridge
 * between this app's session and the backend's Bearer-JWT auth doesn't
 * exist yet, so `status: "blocked"` is the actual outcome today. Every
 * Products page resolves this the same way rather than each reimplementing
 * the same three-way branch.
 */
export async function resolveMyStoreId(): Promise<StoreResolution> {
  const accessToken = await getBackendAccessToken();
  if (!accessToken) return { status: "blocked" };

  try {
    const { data } = await fetchMyCreatorApplication(accessToken);
    if (!data.storeId) return { status: "not-onboarded" };
    return { status: "ready", storeId: data.storeId, accessToken };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { status: "not-onboarded" };
    throw error;
  }
}
