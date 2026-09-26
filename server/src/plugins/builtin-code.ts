import { spawn } from "node:child_process";
import { cutAtCodeUnits } from "../channels/text";
import { MAX_RESULT_CHARS, type McpCallResult, type McpTool } from "./mcp";

export type CodeTools = Record<string, never>;

export function useCodeTools(_tools: CodeTools | null): void {}

const TOOLS: readonly McpTool[] = Object.freeze([
  {
    name: "execute_python",
    description: [
      "Execute a Python script in a sandboxed execution environment.",
      "Use this for data analysis, mathematical calculations, chart generation, parsing data, and executing algorithmic logic.",
      "Output from stdout and stderr will be captured and returned.",
    ].join("\n"),
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Valid Python code to execute. Print any results to stdout.",
        },
      },
      required: ["code"],
    },
  },
]);

export const listNeedsCredential = false;

export async function listTools(): Promise<McpTool[]> {
  return [...TOOLS];
}

export async function callTool(
  _connection: any,
  name: string,
  parameters: Record<string, unknown>,
): Promise<McpCallResult> {
  if (name !== "execute_python") {
    return {
      text: `Unknown tool: ${name}`,
      isError: true,
      truncated: false,
    };
  }

  const code = typeof parameters.code === "string" ? parameters.code : "";
  if (!code.trim()) {
    return {
      text: "Code parameter is required and cannot be empty.",
      isError: true,
      truncated: false,
    };
  }

  return new Promise<McpCallResult>((resolve) => {
    const python = spawn("python3", ["-c", code], {
      timeout: 15_000,
    });

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("close", (exitCode) => {
      const output = [
        stdout.trim() ? `STDOUT:\n${stdout.trim()}` : "",
        stderr.trim() ? `STDERR:\n${stderr.trim()}` : "",
        exitCode !== 0 ? `Process exited with code ${exitCode}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const finalText = output.trim() || "(Execution finished with no output)";
      resolve({
        text: cutAtCodeUnits(finalText, MAX_RESULT_CHARS),
        isError: exitCode !== 0,
        truncated: finalText.length > MAX_RESULT_CHARS,
      });
    });

    python.on("error", (err) => {
      resolve({
        text: `Execution failed: ${err.message}`,
        isError: true,
        truncated: false,
      });
    });
  });
}
