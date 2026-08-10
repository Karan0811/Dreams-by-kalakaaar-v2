import type { Metadata } from "next";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

export const metadata: Metadata = { title: "Store Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-[var(--space-400)]">
      <h1 className="font-serif text-[24px] text-text-primary">Store Settings</h1>
      <SettingsTabs />
    </div>
  );
}
