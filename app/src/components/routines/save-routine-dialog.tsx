import * as React from "react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconClock, IconSparkles, IconCheck } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRoutineMutationOptions } from "@/lib/routines/mutations";

const SCHEDULE_PRESETS = [
  { label: "Daily at 9:00 AM (09:00)", cron: "0 9 * * *" },
  { label: "Every weekday at 9:00 AM", cron: "0 9 * * 1-5" },
  { label: "Every 4 hours", cron: "0 */4 * * *" },
  { label: "Every morning & evening (09:00 & 18:00)", cron: "0 9,18 * * *" },
  { label: "Weekly on Monday morning", cron: "0 9 * * 1" },
];

export function SaveRoutineDialog({
  open,
  onClose,
  agentId,
  channelId,
  defaultInstruction = "",
}: {
  open: boolean;
  onClose: () => void;
  agentId: string;
  channelId: string;
  defaultInstruction?: string;
}) {
  const queryClient = useQueryClient();
  const createRoutine = useMutation(createRoutineMutationOptions(queryClient));

  const [instruction, setInstruction] = useState(defaultInstruction);
  const [selectedPreset, setSelectedPreset] = useState("0 9 * * 1-5");
  const [customCron, setCustomCron] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeCron = isCustom ? customCron.trim() : selectedPreset;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || !activeCron) return;

    try {
      await createRoutine.mutateAsync({
        agentId,
        channelId,
        instruction: instruction.trim(),
        cron: activeCron,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1500);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconClock className="size-4" />
            </div>
            <DialogTitle className="text-base">Save as Routine</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Transform this completed workflow into an automated 24/7 background task that runs unattended on schedule.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Routine Schedule
            </label>
            <Select
              value={isCustom ? "custom" : selectedPreset}
              onValueChange={(val) => {
                if (val === "custom") {
                  setIsCustom(true);
                } else if (val) {
                  setIsCustom(false);
                  setSelectedPreset(val);
                }
              }}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs">
                {SCHEDULE_PRESETS.map((p) => (
                  <SelectItem key={p.cron} value={p.cron}>
                    {p.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom Cron Expression</SelectItem>
              </SelectContent>
            </Select>
            {isCustom && (
              <input
                type="text"
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                placeholder="0 9 * * 1-5"
                className="mt-1 flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Standing Instruction
            </label>
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Check for new invoices on vendor portal and post summary."
              className="text-xs min-h-[90px] resize-y"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs gap-1.5"
              disabled={!instruction.trim() || !activeCron || createRoutine.isPending}
            >
              {savedSuccess ? (
                <>
                  <IconCheck className="size-3.5 text-emerald-400" />
                  Routine Saved!
                </>
              ) : (
                <>
                  <IconSparkles className="size-3.5" />
                  {createRoutine.isPending ? "Saving..." : "Create Routine"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
