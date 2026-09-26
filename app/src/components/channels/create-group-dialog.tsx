import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChannelAvatar } from "@/components/channels/avatar";
import { stashFirstMessage } from "@/components/channels/transcript-messages";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { agentListQueryOptions } from "@/lib/agents/queries";
import {
  createChannelMutationOptions,
  updateChannelMutationOptions,
} from "@/lib/channels/mutations";
import { channelKeys } from "@/lib/channels/queries";

export function CreateGroupDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: allProfiles } = useQuery(agentListQueryOptions());

  const createChannel = useMutation(createChannelMutationOptions(queryClient));
  const updateChannel = useMutation(updateChannelMutationOptions(queryClient));

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rounds, setRounds] = useState("1");
  const [mode, setMode] = useState("collaborative");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [agentModels, setAgentModels] = useState<Record<string, string>>({});
  const [firstMessage, setFirstMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableToAdd = (allProfiles ?? []).filter(
    (p) => !selectedAgentIds.includes(p.id),
  );

  const handleAddAgent = (agentId: string) => {
    if (!selectedAgentIds.includes(agentId)) {
      setSelectedAgentIds((prev) => [...prev, agentId]);
      setError(null);
    }
  };

  const handleRemoveAgent = (agentId: string) => {
    setSelectedAgentIds((prev) => prev.filter((id) => id !== agentId));
    setAgentModels((prev) => {
      const next = { ...prev };
      delete next[agentId];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAgentIds.length < 2) {
      setError("Please select at least 2 agents to form a discussion group.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create channel with selected agent IDs
      const channel = await createChannel.mutateAsync(selectedAgentIds);

      // 2. Set custom name and description
      const groupName =
        name.trim() ||
        selectedAgentIds
          .map((id) => allProfiles?.find((p) => p.id === id)?.name ?? id)
          .join(", ");

      const groupDescText =
        description.trim() ||
        "Multi-agent discussion group with round robin turn taking.";
      
      const modelTags = Object.entries(agentModels)
        .filter(([_, modelId]) => modelId)
        .map(([agentId, modelId]) => `[agent_model:${agentId}:${modelId}]`)
        .join(" ");

      const tagsString = [
        `[rounds:${rounds}]`,
        `[mode:${mode}]`,
        modelTags
      ].filter(Boolean).join(" ");
      
      const groupDesc = `${groupDescText} ${tagsString}`.trim();

      await updateChannel.mutateAsync({
        channelId: channel.id,
        name: groupName,
        description: groupDesc,
      });

      // 3. Stash initial message if provided
      if (firstMessage.trim()) {
        stashFirstMessage(channel.id, firstMessage.trim());
      }

      queryClient.invalidateQueries({ queryKey: channelKeys.all });

      // 4. Navigate to new channel
      await navigate({
        params: { channelId: channel.id },
        replace: true,
        to: "/channel/$channelId",
      });

      onClose();
      // Reset form
      setName("");
      setDescription("");
      setRounds("1");
      setSelectedAgentIds([]);
      setAgentModels({});
      setFirstMessage("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to create group channel.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Multi-Agent Group</DialogTitle>
            <DialogDescription>
              Create a shared group channel where multiple AI agents discuss topics
              together in Full Round Robin.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="dialog-group-name"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Group Name
              </label>
              <Input
                id="dialog-group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Architecture & Security Squad"
                className="text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="dialog-group-desc"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Discussion Scope & Context (Boundary)
              </label>
              <Textarea
                id="dialog-group-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Focus exclusively on Kubernetes architecture, API security, and database scalability. Do not drift outside technical infrastructure..."
                rows={3}
                className="text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                All agents will strictly follow this context and stay within its boundaries.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="dialog-group-rounds" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Discussion Depth
              </label>
              <Select value={rounds} onValueChange={(val) => setRounds(val || "1")}>
                <SelectTrigger id="dialog-group-rounds" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Round (Standard)</SelectItem>
                  <SelectItem value="2">2 Rounds (Deep Debate)</SelectItem>
                  <SelectItem value="3">3 Rounds (Exhaustive Analysis)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                How many times each agent speaks before the group synthesizes a consensus.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="dialog-group-mode" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Collaboration Mode
              </label>
              <Select value={mode} onValueChange={(val) => setMode(val || "collaborative")}>
                <SelectTrigger id="dialog-group-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collaborative">Collaborative Discussion (Standard)</SelectItem>
                  <SelectItem value="planning">Collaborative Planning & Roadmap</SelectItem>
                  <SelectItem value="debate">Socratic Debate & Stress-Testing</SelectItem>
                  <SelectItem value="brainstorm">Divergent Brainstorming</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Group Members ({selectedAgentIds.length})
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Min. 2 agents required
                </span>
              </div>

              {selectedAgentIds.length > 0 && (
                <div className="flex flex-col gap-3 p-3 rounded-lg border border-border bg-muted/20">
                  {selectedAgentIds.map((id) => {
                    const profile = allProfiles?.find((p) => p.id === id);
                    const displayName = profile?.name ?? id;
                    return (
                      <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-md bg-background border border-border">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <ChannelAvatar participantIds={[id]} size={24} />
                          <span className="text-sm font-medium truncate">{displayName}</span>
                        </div>
                        <div className="flex items-center gap-2 sm:ml-auto">
                          <Select 
                            value={agentModels[id] || "default"} 
                            onValueChange={(val) => {
                              setAgentModels((prev) => {
                                const next = { ...prev };
                                if (!val || val === "default") {
                                  delete next[id];
                                } else {
                                  next[id] = val;
                                }
                                return next;
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs w-[200px]">
                              <SelectValue placeholder="Default Model" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default Model</SelectItem>
                              <SelectItem value="antigravity/gemini-3.8-flash-tiered">Gemini 3.8 Flash</SelectItem>
                              <SelectItem value="antigravity/claude-sonnet-4-6">Claude Sonnet 4.6</SelectItem>
                              <SelectItem value="antigravity/claude-sonnet-5-thinking">Claude Sonnet 5 Thinking</SelectItem>
                              <SelectItem value="antigravity/auto-best-coding">Auto Best Coding</SelectItem>
                            </SelectContent>
                          </Select>
                          <button
                            type="button"
                            className="hover:text-destructive text-muted-foreground flex-shrink-0 rounded-full p-1 hover:bg-destructive/10"
                            onClick={() => handleRemoveAgent(id)}
                            title="Remove agent"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {availableToAdd.length > 0 && (
                <Combobox
                  autoHighlight
                  items={availableToAdd}
                  isItemEqualToValue={(item: any, value: any) =>
                    item?.id === value?.id
                  }
                  itemToStringLabel={(item: any) => item?.name ?? ""}
                  itemToStringValue={(item: any) => item?.id ?? ""}
                  onValueChange={(next: any) => {
                    if (next?.id) handleAddAgent(next.id);
                  }}
                  value={null}
                >
                  <ComboboxInput
                    placeholder="+ Add agent to this group…"
                    className="border-none w-full bg-transparent! text-xs has-[[data-slot=input-group-control]:focus-visible]:ring-0"
                  />
                  <ComboboxContent className="min-w-0 max-w-sm" sideOffset={12}>
                    <ComboboxEmpty>No more agents found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: any) => (
                        <ComboboxItem
                          key={item.id}
                          value={item}
                          className="h-9 text-xs"
                        >
                          <ChannelAvatar participantIds={[item.id]} size={20} />
                          {item.name}
                          <span className="truncate text-muted-foreground ml-1">
                            {item.title}
                          </span>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="dialog-first-message"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Opening Topic / Question (Optional)
              </label>
              <Input
                id="dialog-first-message"
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                placeholder="e.g. Halo tim, tolong usulkan strategi penanganan beban tinggi..."
                className="text-sm"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive font-medium" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedAgentIds.length < 2}
            >
              {isSubmitting ? "Creating Group..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
