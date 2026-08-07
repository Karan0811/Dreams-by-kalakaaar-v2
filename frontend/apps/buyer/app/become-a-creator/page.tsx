import { redirect } from "next/navigation";

/** Preserve legacy buyer-app links while the creator application remains a
 * dedicated app. */
export default function BecomeACreatorRedirect() {
  redirect(`${process.env.NEXT_PUBLIC_CREATOR_APP_URL ?? "http://localhost:3001"}/become-a-creator`);
}
