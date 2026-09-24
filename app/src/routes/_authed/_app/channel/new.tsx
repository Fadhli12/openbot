import type { Message } from "@ag-ui/core";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChannelAvatar } from "@/components/channels/avatar";
import { canSend, type Recipient } from "@/components/channels/compose-state";
import { ConversationView } from "@/components/channels/conversation-view";
import { seedMessage } from "@/components/channels/transcript-messages";
import { SidebarToggle } from "@/components/layout/sidebar-toggle";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { defaultAgentProfile } from "@/lib/agents/default-agent";
import {
  type AgentProfile,
  agentListQueryOptions,
  agentQueryOptions,
} from "@/lib/agents/queries";
import { useStartChannel } from "@/lib/channels/start";
import { useSkillCommands } from "@/lib/plugins/skill-commands";
import { newId } from "../../../../lib/new-id";

/**
 * Creates the channel on first send. The selected coworker stays in the URL so profile links and
 * reloads preserve the pending recipient without creating an empty channel.
 */
export const Route = createFileRoute("/_authed/_app/channel/new")({
  validateSearch: (search: Record<string, unknown>): { agent?: string } => ({
    ...(typeof search.agent === "string" ? { agent: search.agent } : {}),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { agent } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { startChosen, pending } = useStartChannel();
  const { data: profiles, isError: rosterError } = useQuery(
    agentListQueryOptions(),
  );

  const [error, setError] = useState<string | null>(null);
  // Optimistic seed shown before the first channel record exists.
  const [sent, setSent] = useState<Message | null>(null);

  const [additionalAgents, setAdditionalAgents] = useState<AgentProfile[]>([]);

  // Stale or private `?agent=` values are ignored because the roster is permission-filtered.
  const listed = profiles?.find((profile) => profile.id === agent);
  /**
   * Hidden coworkers are omitted from the roster but may still be valid recipients from a profile
   * link, so fetch the URL-selected coworker when it is absent from the visible list.
   */
  const {
    data: fetched,
    isError: detailError,
    isPending: detailPending,
  } = useQuery({
    ...agentQueryOptions(agent ?? ""),
    enabled: Boolean(agent) && profiles !== undefined && !listed,
    retry: false,
  });
  const chosen =
    listed ??
    (fetched?.id === agent ? fetched : undefined) ??
    (agent ? undefined : defaultAgentProfile(profiles));

  const allSelectedAgents = (() => {
    const list: AgentProfile[] = [];
    if (chosen) list.push(chosen);
    for (const add of additionalAgents) {
      if (!list.some((item) => item.id === add.id)) {
        list.push(add);
      }
    }
    return list;
  })();

  const needsUrlAgentDetail =
    Boolean(agent) && profiles !== undefined && !listed;
  const waitingForUrlAgent =
    needsUrlAgentDetail && detailPending && !detailError;
  const urlAgentDetailFailed = needsUrlAgentDetail && detailError && !fetched;
  const loadError =
    rosterError && profiles === undefined
      ? "Coworkers couldn't be loaded."
      : urlAgentDetailFailed
        ? "Coworker couldn't be loaded."
        : null;
  const recipients: Recipient[] = allSelectedAgents.map((a) => ({
    id: a.id,
    name: a.name,
  }));
  const skillCommands = useSkillCommands(chosen?.id ?? "");

  if (profiles === undefined && !rosterError) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-12 border-b border-border sticky top-0 flex flex-wrap px-2 py-1.5 items-center gap-1.5">
        <SidebarToggle className="mr-1" />
        <span className="text-sm font-medium text-muted-foreground mr-1">To:</span>
        {allSelectedAgents.map((profile) => (
          <span
            key={profile.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 pl-1 pr-2 py-0.5 text-xs font-medium text-secondary-foreground border border-border"
          >
            <ChannelAvatar participantIds={[profile.id]} size={18} />
            <span>{profile.name}</span>
            {allSelectedAgents.length > 1 && (
              <button
                type="button"
                className="hover:text-destructive text-muted-foreground ml-0.5 rounded-full p-0.5"
                onClick={() => {
                  if (chosen?.id === profile.id) {
                    const next = additionalAgents[0];
                    setAdditionalAgents((prev) => prev.slice(1));
                    void navigate({
                      replace: true,
                      search: next ? { agent: next.id } : {},
                    });
                  } else {
                    setAdditionalAgents((prev) =>
                      prev.filter((a) => a.id !== profile.id),
                    );
                  }
                }}
              >
                ✕
              </button>
            )}
          </span>
        ))}
        <div className="flex-1 min-w-[140px]">
          <Combobox
            autoHighlight
            items={(profiles ?? []).filter(
              (p) => !allSelectedAgents.some((sel) => sel.id === p.id),
            )}
            isItemEqualToValue={(item: AgentProfile, value: AgentProfile) =>
              item.id === value.id
            }
            itemToStringLabel={(item: AgentProfile) => item.name}
            itemToStringValue={(item: AgentProfile) => item.id}
            onValueChange={(next) => {
              if (!next) return;
              if (allSelectedAgents.length === 0) {
                void navigate({
                  replace: true,
                  search: { agent: next.id },
                });
              } else {
                setAdditionalAgents((prev) => [...prev, next]);
              }
            }}
            value={null}
          >
            <ComboboxInput
              autoFocus={allSelectedAgents.length === 0}
              placeholder={
                allSelectedAgents.length === 0
                  ? "Choose a coworker…"
                  : "+ Add agent to group…"
              }
              className="border-none w-full bg-transparent! text-sm has-[[data-slot=input-group-control]:focus-visible]:ring-0"
            />
            <ComboboxContent className="min-w-0 max-w-lg" sideOffset={12}>
              <ComboboxEmpty>No agents found.</ComboboxEmpty>
              <ComboboxList>
                {(item: AgentProfile) => (
                  <ComboboxItem key={item.id} value={item} className="h-10">
                    <ChannelAvatar participantIds={[item.id]} size={24} />
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
      </div>
      <ConversationView
        autoFocus
        commands={skillCommands}
        disabled={
          Boolean(loadError) || waitingForUrlAgent || recipients.length === 0
        }
        messages={sent ? [sent] : []}
        notice={
          loadError || error ? (
            <p className="pb-2 text-sm text-destructive" role="alert">
              {loadError ?? error}
            </p>
          ) : null
        }
        onSubmit={async (draft) => {
          if (recipients.length === 0 || !canSend(recipients, draft.text)) return;

          setError(null);
          setSent(seedMessage(draft.text, newId()));

          try {
            await startChosen(
              recipients.map((r) => r.id),
              draft.text,
            );
          } catch (caught) {
            setSent(null);
            setError(
              caught instanceof Error
                ? caught.message
                : "Could not start the conversation.",
            );
            throw caught;
          }
        }}
        pending={pending}
      />
    </div>
  );
}
