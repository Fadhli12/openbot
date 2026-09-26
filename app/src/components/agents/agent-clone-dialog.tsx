import * as React from "react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconCopy, IconSparkles, IconCheck } from "@tabler/icons-react";
import { createAgentMutationOptions } from "@/lib/agents/mutations";

export function AgentCloneDialog({
  open,
  onClose,
  sourceAgent,
}: {
  open: boolean;
  onClose: () => void;
  sourceAgent: {
    id: string;
    name: string;
    roleDescription?: string;
    systemPrompt?: string;
  } | null;
}) {
  const queryClient = useQueryClient();
  const createAgent = useMutation(createAgentMutationOptions(queryClient));

  const [name, setName] = useState(
    sourceAgent ? `${sourceAgent.name} (Clone)` : "",
  );
  const [roleDescription, setRoleDescription] = useState(
    sourceAgent?.roleDescription ?? "",
  );
  const [systemPrompt, setSystemPrompt] = useState(
    sourceAgent?.systemPrompt ?? "",
  );
  const [clonedSuccess, setClonedSuccess] = useState(false);

  React.useEffect(() => {
    if (sourceAgent) {
      setName(`${sourceAgent.name} (Clone)`);
      setRoleDescription(sourceAgent.roleDescription ?? "");
      setSystemPrompt(sourceAgent.systemPrompt ?? "");
    }
  }, [sourceAgent]);

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createAgent.mutateAsync({
        name: name.trim(),
        title: name.trim(),
        roleDescription: roleDescription.trim(),
        visibility: "private",
      });
      setClonedSuccess(true);
      setTimeout(() => {
        setClonedSuccess(false);
        onClose();
      }, 1500);
    } catch {}
  };

  if (!sourceAgent) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconCopy className="size-4" />
            </div>
            <DialogTitle className="text-base">Clone Coworker Persona</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Create an independent clone of &ldquo;{sourceAgent.name}&rdquo; with custom prompts and instructions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleClone} className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Agent Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales Outbound (Enterprise)"
              className="text-xs h-8"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Role Description
            </label>
            <Input
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="Short summary of this agent's focus"
              className="text-xs h-8"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              System Prompt & Instructions
            </label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Detailed guidelines, tone of voice, boundaries..."
              className="text-xs min-h-[100px] resize-y"
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
              disabled={!name.trim() || createAgent.isPending}
              className="text-xs gap-1.5"
            >
              {clonedSuccess ? (
                <>
                  <IconCheck className="size-3.5 text-emerald-400" />
                  Agent Cloned!
                </>
              ) : (
                <>
                  <IconSparkles className="size-3.5" />
                  {createAgent.isPending ? "Cloning..." : "Create Clone"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
