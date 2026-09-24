import { describe, expect, test } from "bun:test";
import {
  addRecipient,
  canSend,
  MAX_RECIPIENTS,
  removeRecipient,
} from "../src/components/channels/compose-state";

const KNOWLEDGE = { id: "knowledge", name: "Knowledge" };
const RISK = { id: "risk-analyst", name: "Risk Analyst" };

describe("addRecipient", () => {
  test("adds to an empty list", () => {
    expect(addRecipient([], KNOWLEDGE)).toEqual([KNOWLEDGE]);
  });

  test("replaces rather than appends once the cap is reached", () => {
    // Replaces oldest once MAX_RECIPIENTS is exceeded
    const fullList = Array.from({ length: MAX_RECIPIENTS }, (_, i) => ({
      id: `agent-${i}`,
      name: `Agent ${i}`,
    }));
    const next = { id: "agent-next", name: "Agent Next" };
    const result = addRecipient(fullList, next);
    expect(result.length).toBe(MAX_RECIPIENTS);
    expect(result[result.length - 1]).toEqual(next);
  });

  test("adding the coworker already chosen is a no-op", () => {
    expect(addRecipient([KNOWLEDGE], KNOWLEDGE)).toEqual([KNOWLEDGE]);
  });
});

describe("removeRecipient", () => {
  test("removes by id", () => {
    expect(removeRecipient([KNOWLEDGE], "knowledge")).toEqual([]);
  });

  test("ignores an id that is not present", () => {
    expect(removeRecipient([KNOWLEDGE], "nobody")).toEqual([KNOWLEDGE]);
  });
});

describe("canSend", () => {
  test("needs exactly one recipient and some text", () => {
    expect(canSend([KNOWLEDGE], "hello")).toBe(true);
  });

  test("refuses with no recipient", () => {
    expect(canSend([], "hello")).toBe(false);
  });

  test("refuses whitespace-only text", () => {
    expect(canSend([KNOWLEDGE], "   ")).toBe(false);
  });

  test("cap allows multiple coworkers", () => {
    expect(MAX_RECIPIENTS).toBeGreaterThan(1);
  });
});
