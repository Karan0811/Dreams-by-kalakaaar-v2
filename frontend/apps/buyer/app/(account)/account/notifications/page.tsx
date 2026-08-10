import type { Metadata } from "next";
import { NotificationsClient } from "@/components/account/NotificationsClient";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return <NotificationsClient />;
}
