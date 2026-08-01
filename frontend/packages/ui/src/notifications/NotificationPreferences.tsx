"use client";

import * as React from "react";
import { Switch } from "../primitives/Switch";
import { Label } from "../primitives/Label";

export interface NotificationPreferenceItem {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
}

export interface NotificationPreferencesProps {
  items: NotificationPreferenceItem[];
  onChange: (id: string, enabled: boolean) => void;
}

/** A generic list of "notify me about X" toggles — has no built-in
 * category set (order updates, marketing emails, etc. are entirely up to
 * the consuming feature). Persistence is likewise the consumer's job
 * (typically a Server Action call in `onChange`), not something this
 * component does itself. */
export function NotificationPreferences({ items, onChange }: NotificationPreferencesProps) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-4 py-[var(--space-150)]">
          <div>
            <Label htmlFor={`notif-pref-${item.id}`}>{item.label}</Label>
            {item.description ? <p className="mt-0.5 text-[12px] text-text-secondary">{item.description}</p> : null}
          </div>
          <Switch
            id={`notif-pref-${item.id}`}
            checked={item.enabled}
            onCheckedChange={(checked) => onChange(item.id, checked)}
          />
        </div>
      ))}
    </div>
  );
}
