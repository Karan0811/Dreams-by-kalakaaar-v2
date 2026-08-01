import Link from "next/link";
import { Alert, Button } from "@dbk/ui";
import type { StoreResolution } from "@/lib/resolve-store";

export function StoreGateNotice({ status }: { status: Exclude<StoreResolution["status"], "ready"> }) {
  if (status === "blocked") {
    return (
      <Alert variant="warning" title="Not connected to the backend yet">
        <p>
          This account isn&apos;t bridged to the Products API yet — see{" "}
          <code className="rounded bg-background-subtle px-1 py-0.5 text-[12px]">
            @dbk/auth&apos;s getBackendAccessToken
          </code>{" "}
          for why. Once that&apos;s wired up, this page will work automatically.
        </p>
      </Alert>
    );
  }

  return (
    <Alert variant="info" title="Finish setting up your store">
      <div className="flex flex-col items-start gap-3">
        <p>You need an approved store before you can list products.</p>
        <Button asChild size="sm">
          <Link href="/become-a-creator">Continue setup</Link>
        </Button>
      </div>
    </Alert>
  );
}
