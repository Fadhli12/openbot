import * as React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { PageRows } from "@/components/layout/page-shell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChannelAvatar } from "@/components/channels/avatar";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { agentListQueryOptions } from "@/lib/agents/queries";
import { updateChannelMutationOptions } from "@/lib/channels/mutations";
import type { AgentChannel } from "@/lib/channels/queries";

export function GroupChannelProfile({
  channel,
  onClose,
}: {
  channel: AgentChannel;
  onClose?: () => void;
}) {
  const queryClient = useQueryClient();
  const updateChannel = useMutation(updateChannelMutationOptions(queryClient));
  const { data: allProfiles } = useQuery(agentListQueryOptions());

  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(
    channel.description === "Private agent channel." ? "" : channel.description ?? "",
  );
  
  // Extract rounds from description if present
  const roundsMatch = description.match(/\[rounds:(\d+)\]/);
  const initialRounds = roundsMatch ? roundsMatch[1] : "1";
  const [rounds, setRounds] = useState(initialRounds);
  
  // Extract mode from description if present
  const modeMatch = description.match(/\[mode:(collaborative|debate|brainstorm)\]/i);
  const initialMode = modeMatch ? modeMatch[1].toLowerCase() : "collaborative";
  const [mode, setMode] = useState(initialMode);
  
  // Extract agent models from description
  // Format: [agent_model:agentId:modelId]
  const [agentModels, setAgentModels] = useState<Record<string, string>>(() => {
    const models: Record<string, string> = {};
    const matches = description.matchAll(/\[agent_model:([^:]+):([^\]]+)\]/g);
    for (const match of matches) {
      if (match[1] && match[2]) {
        models[match[1]] = match[2];
      }
    }
    return models;
  });
  
  // Clean description for text area
  const displayDescription = description
    .replace(/\s*\[rounds:\d+\]\s*/gi, "")
    .replace(/\s*\[mode:[^\]]+\]\s*/gi, "")
    .replace(/\s*\[agent_model:[^:]+:[^\]]+\]\s*/gi, "")
    .trim();

  const [currentAgentIds, setCurrentAgentIds] = useState<string[]>(channel.agentIds);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const availableToAdd = (allProfiles ?? []).filter(
    (p) => !currentAgentIds.includes(p.id),
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(null);
    try {
      const metadata = `[rounds:${rounds}] [mode:${mode}]`;
      const agentModelTags = Object.entries(agentModels)
        .filter(([agentId, modelId]) => currentAgentIds.includes(agentId) && modelId)
        .map(([agentId, modelId]) => `[agent_model:${agentId}:${modelId}]`)
        .join(" ");
        
      const metadataWithModels = [metadata, agentModelTags].filter(Boolean).join(" ");
      
      const finalDesc = displayDescription.trim() 
        ? `${displayDescription.trim()} ${metadataWithModels}`
        : `Private agent channel. ${metadataWithModels}`;
        
      await updateChannel.mutateAsync({
        channelId: channel.id,
        name: name.trim() || channel.name,
        description: finalDesc,
        agentIds: currentAgentIds,
      });
      setSavedMessage("Group settings updated successfully!");
      setTimeout(() => setSavedMessage(null), 3000);
    } catch {
      // Ignored: mutation handles error state
    }
  };

  const addAgent = (idToAdd: string) => {
    if (!currentAgentIds.includes(idToAdd)) {
      setCurrentAgentIds((prev) => [...prev, idToAdd]);
    }
  };

  const removeAgent = (agentId: string) => {
    if (currentAgentIds.length <= 1) return; // Keep at least one agent
    setCurrentAgentIds((prev) => prev.filter((id) => id !== agentId));
    
    setAgentModels((prev) => {
      const next = { ...prev };
      delete next[agentId];
      return next;
    });
  };

  const updateAgentModel = (agentId: string, modelId: string) => {
    setAgentModels((prev) => {
      const next = { ...prev };
      if (!modelId || modelId === "default") {
        delete next[agentId];
      } else {
        next[agentId] = modelId;
      }
      return next;
    });
  };

  return (
    <div className="flex w-full flex-col gap-6 p-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <ChannelAvatar participantIds={currentAgentIds} size={80} />
        <div className="flex w-full flex-col items-center gap-0.5">
          <h1 className="w-full text-balance text-2xl font-semibold leading-tight tracking-tight">
            {channel.name}
          </h1>
          <p className="w-full text-balance text-xs text-muted-foreground">
            Multi-Agent Group • {currentAgentIds.length} Agents
          </p>
        </div>
      </header>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="group-name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Group Name
          </label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Architecture Discussion"
            className="text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="group-desc" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Discussion Scope & Context
          </label>
          <Textarea
            id="group-desc"
            value={displayDescription}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Define strict scope/boundary for this group. Agents will keep their discussion strictly within this context..."
            rows={4}
            className="text-sm"
          />
          <p className="text-[11px] text-muted-foreground leading-normal">
            Agents in this group strictly follow this scope on every turn and avoid wandering outside this context.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="group-rounds" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Discussion Depth
          </label>
          <Select value={rounds.toString()} onValueChange={(v) => v && setRounds(v)}>
            <SelectTrigger id="group-rounds">
              <SelectValue placeholder="Select rounds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Single Pass (Each agent speaks once)</SelectItem>
              <SelectItem value="2">Two Rounds (Agents can respond to each other)</SelectItem>
              <SelectItem value="3">Three Rounds (Deep discussion & synthesis)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="group-mode" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Collaboration Mode
          </label>
          <Select value={mode} onValueChange={(v) => v && setMode(v)}>
            <SelectTrigger id="group-mode">
              <SelectValue placeholder="Select collaboration mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="collaborative">Collaborative Discussion (Standard)</SelectItem>
              <SelectItem value="debate">Socratic Debate & Stress-Testing</SelectItem>
              <SelectItem value="brainstorm">Divergent Brainstorming</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Group Members ({currentAgentIds.length})
          </span>
          <PageRows>
            {currentAgentIds.map((agentId, index) => {
              const profile = allProfiles?.find((p) => p.id === agentId);
              const displayName = profile?.name ?? agentId;
              const currentModel = agentModels[agentId] || "default";
              
              return (
                <React.Fragment key={agentId}>
                  {index > 0 && <Separator />}
                  <Item size="sm" className="p-3">
                    <ItemMedia variant="icon" className="h-auto w-auto">
                      <ChannelAvatar participantIds={[agentId]} size={24} />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="truncate">{displayName}</ItemTitle>
                      <ItemDescription className="truncate">{profile?.title || "Agent"}</ItemDescription>
                    </ItemContent>
                    
                    <ItemActions className="flex items-center gap-2">
                      <Select value={currentModel} onValueChange={(v) => { updateAgentModel(agentId, !v || v === "default" ? "" : v); }}>
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <SelectValue placeholder="Model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default Model</SelectItem>
                          <SelectItem value="antigravity/gemini-3.8-flash-tiered">Gemini 3.8 Flash</SelectItem>
                          <SelectItem value="antigravity/claude-sonnet-4-6">Claude Sonnet 4.6</SelectItem>
                          <SelectItem value="antigravity/claude-sonnet-5-thinking">Claude Sonnet 5 Thinking</SelectItem>
                          <SelectItem value="antigravity/auto-best-coding">Auto Best Coding</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {currentAgentIds.length > 1 && (
                        <button
                          type="button"
                          className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground ml-0.5 flex size-6 shrink-0 items-center justify-center rounded-full transition-colors"
                          onClick={() => removeAgent(agentId)}
                          title="Remove from group"
                        >
                          ✕
                        </button>
                      )}
                    </ItemActions>
                  </Item>
                </React.Fragment>
              );
            })}
          </PageRows>

          {availableToAdd.length > 0 && (
            <div className="mt-1">
              <Combobox
                autoHighlight
                items={availableToAdd}
                isItemEqualToValue={(item: any, value: any) => item?.id === value?.id}
                itemToStringLabel={(item: any) => item?.name ?? ""}
                itemToStringValue={(item: any) => item?.id ?? ""}
                onValueChange={(next: any) => {
                  if (next?.id) addAgent(next.id);
                }}
                value={null}
              >
                <ComboboxInput
                  placeholder="+ Add new agent to this group…"
                  className="border-none w-full bg-transparent! text-xs has-[[data-slot=input-group-control]:focus-visible]:ring-0"
                />
                <ComboboxContent className="min-w-0 max-w-sm" sideOffset={12}>
                  <ComboboxEmpty>No agents found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item.id} value={item} className="h-9 text-xs">
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
            </div>
          )}
        </div>

        {savedMessage && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {savedMessage}
          </p>
        )}

        <Button
          type="submit"
          disabled={updateChannel.isPending}
          className="w-full text-sm! mt-2"
        >
          {updateChannel.isPending ? "Saving..." : "Save Group Settings"}
        </Button>
      </form>
    </div>
  );
}
