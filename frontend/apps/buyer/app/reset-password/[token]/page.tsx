import { redirect } from "next/navigation";

/** Better Auth issues reset links to this callback route. The auth handler
 * validates and consumes no token here; it only redirects back with a valid
 * token or an invalid-token error for the shared reset form to display. */
export default async function ResetPasswordCallbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/api/auth/reset-password/${encodeURIComponent(token)}?callbackURL=${encodeURIComponent("/reset-password")}`);
}
