import * as React from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconBrain,
  IconPlus,
  IconTrash,
  IconSparkles,
  IconCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  agentMemoriesQueryOptions,
  type AgentMemoryItem,
} from "@/lib/agents/queries";
import {
  createAgentMemoryMutationOptions,
  deleteAgentMemoryMutationOptions,
} from "@/lib/agents/mutations";

export function AgentMemoriesPanel({ agentId }: { agentId: string }) {
  const queryClient = useQueryClient();
  const memoriesQuery = useQuery(agentMemoriesQueryOptions(agentId));
  const createMemory = useMutation(createAgentMemoryMutationOptions(queryClient));
  const deleteMemory = useMutation(deleteAgentMemoryMutationOptions(queryClient));

  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<
    "learning" | "fact" | "preference" | "planning" | "critique"
  >("learning");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const memories = memoriesQuery.data ?? [];
  const filteredMemories =
    selectedFilter === "all"
      ? memories
      : memories.filter((m) => m.category === selectedFilter);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await createMemory.mutateAsync({
        agentId,
        content: content.trim(),
        category,
      });
      setContent("");
      setIsAdding(false);
    } catch {}
  };

  const handleDelete = async (memoryId: string) => {
    try {
      await deleteMemory.mutateAsync({ agentId, memoryId });
    } catch {}
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "fact":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "preference":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "planning":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "critique":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconBrain className="size-4 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight">
              Long-Term Memory & Learnings
            </h3>
          </div>
          <Button
            size="sm"
            variant={isAdding ? "secondary" : "outline"}
            className="h-8 gap-1.5 text-xs"
            onClick={() => setIsAdding(!isAdding)}
          >
            <IconPlus className="size-3.5" />
            {isAdding ? "Cancel" : "Add Memory"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Knowledge, decisions, preferences, and self-learned insights accumulated by this agent across all conversations.
        </p>
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 p-3.5 rounded-xl border border-border bg-card shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              New Memory Entry
            </span>
            <div className="w-36">
              <Select
                value={category}
                onValueChange={(val) =>
                  setCategory(
                    val as "learning" | "fact" | "preference" | "planning" | "critique",
                  )
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="learning">Learning</SelectItem>
                  <SelectItem value="fact">Fact</SelectItem>
                  <SelectItem value="preference">Preference</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g. Always verify PostgreSQL connections using native socket before launching background scripts."
            className="text-xs min-h-[70px] resize-y"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={!content.trim() || createMemory.isPending}
            >
              <IconCheck className="size-3" />
              {createMemory.isPending ? "Saving..." : "Save Memory"}
            </Button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {["all", "learning", "fact", "preference", "planning", "critique"].map(
          (cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedFilter(cat)}
              className={`px-2.5 py-1 rounded-full capitalize transition-colors text-[11px] font-medium border ${
                selectedFilter === cat
                  ? "bg-secondary text-secondary-foreground border-border"
                  : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/40"
              }`}
            >
              {cat}
            </button>
          ),
        )}
      </div>

      {memoriesQuery.isPending ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : filteredMemories.length === 0 ? (
        <Empty className="py-8 border border-dashed rounded-xl">
          <EmptyHeader>
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted/50 mb-2">
              <IconSparkles className="size-5 text-muted-foreground" />
            </div>
            <EmptyTitle className="text-sm font-medium">No memories recorded yet</EmptyTitle>
            <EmptyDescription className="text-xs text-muted-foreground max-w-sm">
              This agent will automatically memorize key facts and preferences during chat, or you can manually add them above.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredMemories.map((item) => (
            <div
              key={item.id}
              className="group flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-card/60 hover:bg-muted/20 transition-colors"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${getCategoryColor(
                      item.category,
                    )}`}
                  >
                    {item.category}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed break-words whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(item.id)}
                title="Delete memory"
              >
                <IconTrash className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
