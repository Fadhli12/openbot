import * as React from "react";
import { useState } from "react";
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconDeviceDesktop,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function ActionApprovalCard({
  actionSummary,
  payloadDetails,
  onApprove,
  onReject,
  onTakeControl,
}: {
  actionSummary: string;
  payloadDetails?: string;
  onApprove: () => void;
  onReject: () => void;
  onTakeControl?: () => void;
}) {
  const [decided, setDecided] = useState<"approved" | "rejected" | null>(null);

  if (decided === "approved") {
    return (
      <div className="my-2.5 flex items-center gap-2 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
        <IconCheck className="size-4 shrink-0" />
        <span>Action approved and confirmed for execution.</span>
      </div>
    );
  }

  if (decided === "rejected") {
    return (
      <div className="my-2.5 flex items-center gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium">
        <IconX className="size-4 shrink-0" />
        <span>Action cancelled by user.</span>
      </div>
    );
  }

  return (
    <div className="my-3 flex flex-col gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 shadow-sm">
      <div className="flex items-start gap-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
          <IconAlertTriangle className="size-4" />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Approval Required
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Human-in-the-loop gate
            </span>
          </div>
          <p className="text-xs text-foreground font-medium leading-relaxed">
            {actionSummary}
          </p>
          {payloadDetails && (
            <pre className="mt-1 max-h-32 overflow-x-auto rounded bg-background/60 p-2 font-mono text-[11px] text-muted-foreground border border-border">
              {payloadDetails}
            </pre>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-amber-500/15">
        {onTakeControl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onTakeControl}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <IconDeviceDesktop className="size-3.5" />
            Take the Wheel
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDecided("rejected");
            onReject();
          }}
          className="h-7 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <IconX className="size-3.5" />
          Reject
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setDecided("approved");
            onApprove();
          }}
          className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          <IconCheck className="size-3.5" />
          Approve & Execute
        </Button>
      </div>
    </div>
  );
}
