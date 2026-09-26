import { IconCpu, IconDeviceDesktop, IconDownload, IconSettings } from "@tabler/icons-react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AgentProfile } from "@/components/agents/agent-profile";
import { GroupChannelProfile } from "@/components/channels/group-channel-profile";
import { hasUnseenActivity } from "@/components/app-sidebar/app-sidebar";
import { ChannelAvatar } from "@/components/channels/avatar";
import { ChannelChat } from "@/components/channels/channel-chat";
import { ActivityLog } from "@/components/computer/activity-log";
import { BrowserActionTimeline } from "@/components/computer/browser-action-timeline";
import { ComputerView } from "@/components/computer/computer-view";
import { useNeedsYou } from "@/components/computer/needs-you";
import { DetailPanel } from "@/components/layout/detail-panel";
import { CanvasPanel, type Artifact } from "@/components/canvas/canvas-panel";
import { SidebarToggle } from "@/components/layout/sidebar-toggle";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  markChannelReadMutationOptions,
  updateChannelMutationOptions,
} from "@/lib/channels/mutations";
import {
  type AgentChannel,
  channelListQueryOptions,
  channelQueryOptions,
} from "@/lib/channels/queries";
import { onComputerActivity } from "@/lib/copilot/computer-activity";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const HEADING_ENTRANCE_SECONDS = 0.18;
const HEADING_ENTRANCE_OFFSET = "translateY(4px)";
const SCREEN_PANEL_WIDTH = 400;

function ComputerViewPanel({
  agentId,
  name,
}: {
  agentId: string;
  name?: string;
}) {
  return (
    <div className="mt-4 px-4">
      <div className="p-4 flex flex-col gap-6">
        <ComputerView active computerId={agentId} name={name} />
        <BrowserActionTimeline
          steps={[
            {
              id: "step-1",
              stepNumber: 1,
              action: "navigate",
              target: "Portal Home & Login",
              timestamp: "09:30:12",
              status: "success",
            },
            {
              id: "step-2",
              stepNumber: 2,
              action: "type",
              target: "Filled credentials & MFA token",
              timestamp: "09:30:18",
              status: "success",
            },
            {
              id: "step-3",
              stepNumber: 3,
              action: "click",
              target: "Clicked 'Export Invoices (PDF)'",
              timestamp: "09:30:25",
              status: "success",
            },
            {
              id: "step-4",
              stepNumber: 4,
              action: "assertion",
              target: "Downloaded invoice_sep2026.pdf",
              timestamp: "09:30:31",
              status: "success",
            },
          ]}
        />
        <div>
          <h3 className="mb-2 font-medium text-sm">Raw Terminal & Execution Log</h3>
          <ActivityLog computerId={agentId} />
        </div>
      </div>
    </div>
  );
}

export function ChannelViewLayer({
  channelId,
  isActive,
}: {
  channelId: string;
  isActive: boolean;
}) {
  const [canvasArtifact, setCanvasArtifact] = useState<Artifact | null>(null);

  // Listen to canvas open requests
  useEffect(() => {
    const handleOpenCanvas = (e: Event) => {
      const customEvent = e as CustomEvent<{ artifact: Artifact }>;
      if (customEvent.detail?.artifact) {
        setCanvasArtifact(customEvent.detail.artifact);
      }
    };
    window.addEventListener("openbot-open-canvas", handleOpenCanvas);
    return () => window.removeEventListener("openbot-open-canvas", handleOpenCanvas);
  }, []);

  const channel = useQuery(channelQueryOptions(channelId));
  const navigate = useNavigate();
  // Safe search retrieval for settings/watch when active
  const search = useSearch({ strict: false }) as {
    settings?: boolean;
    watch?: boolean;
  };
  const isSettingsOpen = isActive && search?.settings === true;
  const prefersReducedMotion = useReducedMotion();
  const isWatching = isActive && search?.watch === true;

  const agentId = channel.data?.agentIds[0];
  const needsYou = useNeedsYou(agentId, !isWatching);

  const queryClient = useQueryClient();
  const markRead = useMutation(markChannelReadMutationOptions(queryClient));
  const roster = useInfiniteQuery(channelListQueryOptions());
  const summary = roster.data?.find((row) => row.id === channelId);

  const unseen = isActive && summary !== undefined && hasUnseenActivity(summary);
  const markReadMutate = markRead.mutate;
  useEffect(() => {
    if (unseen) {
      markReadMutate(channelId);
    }
  }, [channelId, unseen, markReadMutate]);

  // Listen to openbot-take-the-wheel events from approval cards
  useEffect(() => {
    const handleTakeWheel = () => show("watch");
    window.addEventListener("openbot-take-the-wheel", handleTakeWheel);
    return () => window.removeEventListener("openbot-take-the-wheel", handleTakeWheel);
  }, []);

  useEffect(() => {
    if (isActive && needsYou) {
      show("watch");
    }
  });

  const dismissedEpoch = useRef<number | null>(null);
  const runEpoch = useRef<number | null>(null);
  useEffect(() => {
    if (!agentId || !isActive) return;
    return onComputerActivity((activity) => {
      if (activity.botId !== agentId) return;
      runEpoch.current = activity.epoch;
      if (dismissedEpoch.current === activity.epoch) return;
      navigate({
        to: "/channel/$channelId",
        params: { channelId },
        search: (previous: any) =>
          previous?.watch === true || previous?.settings === true
            ? previous
            : { ...previous, settings: undefined, watch: true },
      });
    });
  }, [agentId, isActive, navigate]);

  const show = (next: "settings" | "watch" | null) => {
    if (next !== "watch" && isWatching)
      dismissedEpoch.current = runEpoch.current;
    return navigate({
      to: "/channel/$channelId",
      params: { channelId },
      search: (previous: any) => ({
        ...previous,
        settings: next === "settings" ? true : undefined,
        watch: next === "watch" ? true : undefined,
      }),
    });
  };

  const isGroup = (channel.data?.agentIds.length ?? 0) > 1;

  const updateChannel = useMutation(updateChannelMutationOptions(queryClient));
  const desc = channel.data?.description ?? "";
  const modelMatch = desc.match(/\[model:([^\]]+)\]/i);
  const currentModel = modelMatch ? modelMatch[1] : "antigravity/gemini-3.8-flash-tiered";

  const handleModelChange = async (nextModel: string | null) => {
    if (!channel.data || !nextModel) return;
    try {
      const cleanDesc = desc.replace(/\s*\[model:[^\]]+\]\s*/gi, "").trim();
      const newDesc = `${cleanDesc || "Private agent channel."} [model:${nextModel}]`;
      await updateChannel.mutateAsync({
        channelId: channel.data.id,
        name: channel.data.name,
        description: newDesc,
      });
    } catch {}
  };

  const exportChat = () => {
    try {
      const messagesNodes = document.querySelectorAll("[data-slot='message-content']");
      const lines: string[] = [];
      lines.push(`# ${channel.data?.name ?? "Channel"} Transcript`);
      lines.push(`Date: ${new Date().toLocaleString()}`);
      lines.push("---");
      messagesNodes.forEach((node) => {
        const text = node.textContent?.trim();
        if (text) lines.push(text + "\n");
      });
      const blob = new Blob([lines.join("\n\n")], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(channel.data?.name ?? "transcript").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div
      className={`absolute inset-0 flex flex-col min-h-0 bg-background ${
        isActive ? "z-10 pointer-events-auto opacity-100" : "z-0 pointer-events-none opacity-0 invisible"
      }`}
      aria-hidden={!isActive}
    >
      <DetailPanel
        onClose={() => {
          show(null);
          setCanvasArtifact(null);
        }}
        open={(isSettingsOpen || isWatching || canvasArtifact !== null) && (agentId !== undefined || isGroup || canvasArtifact !== null)}
        detailWidth={isWatching || canvasArtifact !== null ? SCREEN_PANEL_WIDTH : undefined}
        detail={
          canvasArtifact !== null ? (
            <CanvasPanel
              artifact={canvasArtifact}
              onClose={() => setCanvasArtifact(null)}
              onIterate={(instruction) => {
                window.dispatchEvent(
                  new CustomEvent("openbot-send-user-message", {
                    detail: { text: `Please update this artifact based on: ${instruction}` },
                  }),
                );
              }}
            />
          ) : isWatching && agentId !== undefined ? (
            <ComputerViewPanel agentId={agentId} name={channel?.data?.name} />
          ) : isGroup && channel.data ? (
            <GroupChannelProfile channel={channel.data} onClose={() => show(null)} />
          ) : agentId !== undefined ? (
            <AgentProfile agentId={agentId} />
          ) : null
        }
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="h-12 border-b border-border sticky top-0 flex flex-row items-center justify-between px-3 gap-2 bg-background z-20">
            <div className="flex min-w-0 items-center gap-1.5">
              <SidebarToggle />
              <motion.div
                animate={{ opacity: 1 }}
                className="shrink-0"
                initial={{ opacity: 0 }}
                key={`avatar:${channel.data?.name ?? channelId}`}
                transition={{
                  duration: HEADING_ENTRANCE_SECONDS,
                  ease: EASE_OUT,
                }}
              >
                <ChannelAvatar
                  participantIds={channel.data?.agentIds ?? []}
                  size={22}
                />
              </motion.div>
              <motion.span
                animate={
                  prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, transform: "translateY(0px)" }
                }
                className="min-w-0 text-sm tracking-tight truncate"
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, transform: HEADING_ENTRANCE_OFFSET }
                }
                key={`name:${channel.data?.name ?? channelId}`}
                transition={{
                  duration: HEADING_ENTRANCE_SECONDS,
                  ease: EASE_OUT,
                }}
              >
                {channel.data?.name ?? "Channel"}
              </motion.span>
            </div>
            <div className="flex flex-row items-center gap-1.5">
              <div className="flex items-center gap-1">
                <Select value={currentModel} onValueChange={handleModelChange}>
                  <SelectTrigger className="h-8 px-2.5 text-xs font-medium gap-1.5 border-border bg-background hover:bg-muted/50 rounded-lg">
                    <IconCpu className="size-3.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end" className="text-xs">
                    <SelectItem value="antigravity/gemini-3.8-flash-tiered">
                      ⚡ Gemini 3.8 Flash (Tiered)
                    </SelectItem>
                    <SelectItem value="antigravity/claude-sonnet-4-6">
                      ✨ Claude Sonnet 4.6
                    </SelectItem>
                    <SelectItem value="kr/claude-sonnet-5-thinking">
                      🧠 Claude Sonnet 5 Thinking
                    </SelectItem>
                    <SelectItem value="auto/best-coding">
                      🚀 Auto Best Coding (Opus 5)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                aria-label="Export conversation as Markdown"
                title="Export conversation as Markdown"
                onClick={exportChat}
                variant="ghost"
                size="icon"
              >
                <IconDownload className="size-4.5" />
              </Button>
              <Button
                aria-label={
                  needsYou
                    ? "This Bot is waiting for you. Open its screen"
                    : "Watch this Bot's screen"
                }
                aria-pressed={isWatching}
                className={`relative ${isWatching ? "bg-foreground/5" : ""}`}
                disabled={agentId === undefined}
                onClick={() => show(isWatching ? null : "watch")}
                variant="ghost"
                size="icon"
              >
                <IconDeviceDesktop className="size-4.5" />
                {needsYou ? (
                  <span className="absolute top-2 right-2 size-2 rounded-full bg-amber-500 animate-pulse" />
                ) : null}
              </Button>
              <Button
                aria-label="Channel coworker or group settings"
                aria-pressed={isSettingsOpen}
                className={isSettingsOpen ? "bg-foreground/5" : undefined}
                disabled={agentId === undefined && !isGroup}
                onClick={() => show(isSettingsOpen ? null : "settings")}
                variant="ghost"
                size="icon"
              >
                <IconSettings className="size-4.5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ChannelBody
              channel={channel.data}
              hasError={channel.isError}
              isPending={channel.isPending}
            />
          </div>
        </div>
      </DetailPanel>
    </div>
  );
}

function ChannelBody({
  channel,
  isPending,
  hasError,
}: {
  channel: AgentChannel | undefined;
  isPending: boolean;
  hasError: boolean;
}) {
  if (isPending) return null;
  if (hasError || !channel) {
    return (
      <p className="p-8 text-sm text-destructive" role="alert">
        Could not load this channel.
      </p>
    );
  }

  const runtimeAgentId =
    channel.agentIds.length === 1
      ? channel.agentIds[0]
      : channel.agentIds.length > 1
        ? `group:${channel.agentIds.join(",")}`
        : undefined;

  if (!runtimeAgentId) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        This channel has no coworkers configured.
      </p>
    );
  }

  return (
    <ChannelChat
      channel={channel}
      key={channel.id}
      runtimeAgentId={runtimeAgentId}
    />
  );
}
