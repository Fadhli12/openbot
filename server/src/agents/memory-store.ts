import { and, desc, eq, isNull, or } from "drizzle-orm";
import type { Database } from "../db/client";
import { agentMemories } from "../db/schema/coworker";

export type MemoryCategory = "fact" | "learning" | "preference" | "planning" | "critique";

export type AgentMemoryItem = {
  id: string;
  agentId: string;
  userId: string | null;
  category: MemoryCategory;
  content: string;
  sourceContext: string | null;
  confidence: number;
  lastRecalledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export class AgentMemoryStore {
  constructor(private readonly db: Database) {}

  async listForAgent(
    agentId: string,
    userId?: string,
    limit = 50,
  ): Promise<AgentMemoryItem[]> {
    const conditions = [eq(agentMemories.agentId, agentId)];
    if (userId) {
      conditions.push(or(eq(agentMemories.userId, userId), isNull(agentMemories.userId))!);
    }

    const rows = await this.db
      .select()
      .from(agentMemories)
      .where(and(...conditions))
      .orderBy(desc(agentMemories.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      agentId: r.agentId,
      userId: r.userId,
      category: r.category as MemoryCategory,
      content: r.content,
      sourceContext: r.sourceContext,
      confidence: r.confidence,
      lastRecalledAt: r.lastRecalledAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async addMemory(params: {
    agentId: string;
    userId?: string;
    category?: MemoryCategory;
    content: string;
    sourceContext?: string;
    confidence?: number;
  }): Promise<AgentMemoryItem> {
    const id = `mem_${crypto.randomUUID()}`;
    const [row] = await this.db
      .insert(agentMemories)
      .values({
        id,
        agentId: params.agentId,
        userId: params.userId ?? null,
        category: params.category ?? "learning",
        content: params.content,
        sourceContext: params.sourceContext ?? null,
        confidence: params.confidence ?? 100,
      })
      .returning();

    return {
      id: row.id,
      agentId: row.agentId,
      userId: row.userId,
      category: row.category as MemoryCategory,
      content: row.content,
      sourceContext: row.sourceContext,
      confidence: row.confidence,
      lastRecalledAt: row.lastRecalledAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async removeMemory(memoryId: string, agentId?: string): Promise<void> {
    const conditions = [eq(agentMemories.id, memoryId)];
    if (agentId) {
      conditions.push(eq(agentMemories.agentId, agentId));
    }
    await this.db.delete(agentMemories).where(and(...conditions));
  }

  async getContextPromptForAgent(agentId: string, userId?: string): Promise<string> {
    const memories = await this.listForAgent(agentId, userId, 20);
    if (memories.length === 0) return "";

    const lines = memories.map((m) => `- [${m.category.toUpperCase()}]: ${m.content}`);
    return `\n\n[LONG-TERM EPISODIC & PROCEDURAL MEMORY]\nThe following are persistent facts, user preferences, and learnings recorded from prior sessions. Always honor them:\n${lines.join("\n")}`;
  }
}
