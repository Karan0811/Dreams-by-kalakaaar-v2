import type { AvailabilityStatus } from "@dbk/types";
import { Badge } from "../primitives/Badge";

const statusConfig: Record<AvailabilityStatus, { label: string; variant: "success" | "warning" | "error" | "info" }> = {
  in_stock: { label: "In stock", variant: "success" },
  low_stock: { label: "Only a few left", variant: "warning" },
  made_to_order: { label: "Made to order", variant: "info" },
  sold_out: { label: "Sold out", variant: "error" },
};

/** Availability is never conveyed by color alone (06-design-system.md §3.14,
 * 11-frontend-architecture.md §15.4) — the label text is the primary signal. */
export function AvailabilityStatusBadge({ status }: { status: AvailabilityStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
