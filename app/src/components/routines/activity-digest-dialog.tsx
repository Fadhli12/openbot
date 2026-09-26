import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { IconClock, IconMoon, IconCheck, IconAlertTriangle, IconArrowRight } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/client";

type DigestItem = {
  routineId: string;
  agentId: string;
  instruction: string;
  channelId: string;
  channelName: string | null;
  status: string;
  executedAt: string | null;
};

export function ActivityDigestDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, isPending } = useQuery({
    queryKey: ["routines", "digest"],
    queryFn: async (): Promise<{ count: number; runs: DigestItem[] }> => {
      const res = await fetch("/api/routines/digest");
      if (!res.ok) throw new Error("Failed to load digest");
      return res.json();
    },
    enabled: open,
  });

  const runs = data?.runs ?? [];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <IconMoon className="size-4" />
            </div>
            <DialogTitle className="text-base">While You Were Away</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Overnight and 24/7 background execution results completed by your AI coworkers while your laptop was closed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-2.5">
          {isPending ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Loading activity digest...</div>
          ) : runs.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              No background routines executed in the last 24 hours.
            </div>
          ) : (
            runs.map((item) => (
              <div
                key={item.routineId + (item.executedAt ?? "")}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card/60"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {item.agentId}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.executedAt ? new Date(item.executedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                        item.status === "succeeded"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 line-clamp-2">
                    {item.instruction}
                  </p>
                </div>
                <Link
                  to="/channel/$channelId"
                  params={{ channelId: item.channelId }}
                  onClick={onClose}
                  className="shrink-0 text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  <span>View</span>
                  <IconArrowRight className="size-3" />
                </Link>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
