import { cutAtCodeUnits } from "../channels/text";
import { MAX_RESULT_CHARS, type McpCallResult, type McpTool } from "./mcp";

export type SearchTools = Record<string, never>;

export function useSearchTools(_tools: SearchTools | null): void {}

const TOOLS: readonly McpTool[] = Object.freeze([
  {
    name: "web_search",
    description: [
      "Search the live web for real-time information, recent news, current events, technical docs, or facts.",
      "Returns a list of relevant search results with title, url, and snippet.",
    ].join("\n"),
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The targeted search query.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "fetch_webpage",
    description: [
      "Fetch and read the content of a web page URL in clean text/markdown.",
      "Use this to inspect deep documentation, articles, or source pages returned from web_search.",
    ].join("\n"),
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The full http/https URL of the web page to read.",
        },
      },
      required: ["url"],
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
  if (name === "web_search") {
    const query = typeof parameters.query === "string" ? parameters.query.trim() : "";
    if (!query) {
      return {
        text: "A non-empty query parameter is required.",
        isError: true,
        truncated: false,
      };
    }

    try {
      const response = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        },
      );

      if (!response.ok) {
        return {
          text: `Search request failed with status: ${response.status}`,
          isError: true,
          truncated: false,
        };
      }

      const html = await response.text();
      const results: Array<{ title: string; url: string; snippet: string }> = [];
      const regex = /<a class="result__url" href="([^"]+)">[\s\S]*?<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
      const titleRegex = /<a class="result__a"[^>]*>([\s\S]*?)<\/a>/gi;

      const titles: string[] = [];
      let tMatch: RegExpExecArray | null;
      while ((tMatch = titleRegex.exec(html)) !== null && titles.length < 5) {
        titles.push(tMatch[1].replace(/<[^>]+>/g, "").trim());
      }

      let match: RegExpExecArray | null;
      let idx = 0;
      while ((match = regex.exec(html)) !== null && results.length < 5) {
        const rawUrl = match[1];
        const snippet = match[2].replace(/<[^>]+>/g, "").trim();
        const urlMatch = rawUrl.match(/uddg=([^&]+)/);
        const actualUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : rawUrl;
        results.push({
          title: titles[idx] || "Search Result",
          url: actualUrl.startsWith("http") ? actualUrl : `https://${actualUrl}`,
          snippet,
        });
        idx++;
      }

      if (results.length === 0) {
        return {
          text: `No web results found for query: "${query}".`,
          isError: false,
          truncated: false,
        };
      }

      const formatted = results
        .map(
          (r, i) =>
            `[${i + 1}] ${r.title}\nURL: ${r.url}\nSummary: ${r.snippet}\n`,
        )
        .join("\n");

      return {
        text: cutAtCodeUnits(formatted, MAX_RESULT_CHARS),
        isError: false,
        truncated: formatted.length > MAX_RESULT_CHARS,
      };
    } catch (err: any) {
      return {
        text: `Web search error: ${err.message || String(err)}`,
        isError: true,
        truncated: false,
      };
    }
  }

  if (name === "fetch_webpage") {
    const url = typeof parameters.url === "string" ? parameters.url.trim() : "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return {
        text: "Invalid URL. Must begin with http:// or https://",
        isError: true,
        truncated: false,
      };
    }

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) {
        return {
          text: `Failed to fetch page: HTTP ${res.status}`,
          isError: true,
          truncated: false,
        };
      }

      const text = await res.text();
      const cleaned = text
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      return {
        text: cutAtCodeUnits(cleaned, MAX_RESULT_CHARS),
        isError: false,
        truncated: cleaned.length > MAX_RESULT_CHARS,
      };
    } catch (err: any) {
      return {
        text: `Failed to fetch page: ${err.message || String(err)}`,
        isError: true,
        truncated: false,
      };
    }
  }

  return {
    text: `Unknown tool: ${name}`,
    isError: true,
    truncated: false,
  };
}
