import Avatar from "boring-avatars";
import { IconCopy } from "@tabler/icons-react";
import type { AgentProfile } from "@/lib/agents/queries";

export function AgentCard({
  agent,
  onClone,
}: {
  agent: AgentProfile;
  onClone?: (agent: AgentProfile) => void;
}) {
  return (
    <div className="h-[180px] bg-foreground/10 rounded-2xl w-[144px] relative overflow-hidden group/agent-card">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Avatar name={agent.avatarSeed} size={250} />
      </div>
      <div className="absolute top-0 left-0 w-full h-full bg-background/40 dark:bg-background/50" />
      {onClone && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClone(agent);
          }}
          className="absolute top-2 right-2 opacity-0 group-hover/agent-card:opacity-100 transition-opacity z-10 size-6 rounded-md bg-background/80 hover:bg-background border border-border text-foreground flex items-center justify-center shadow-xs"
          title="Clone Agent Persona"
        >
          <IconCopy className="size-3.5" />
        </button>
      )}
      <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-end p-3 gap-2 pointer-events-none">
        <span className="text-sm font-medium line-clamp-1">{agent.name}</span>
        <span className="text-xs text-foreground dark:text-foreground/80 line-clamp-3">
          {agent.roleDescription}
        </span>
      </div>
    </div>
  );
}
