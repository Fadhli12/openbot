import * as React from "react";
import { useState, useMemo } from "react";
import {
  IconEye,
  IconCode,
  IconCopy,
  IconCheck,
  IconDownload,
  IconX,
  IconExternalLink,
  IconSparkles,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export type Artifact = {
  id: string;
  title: string;
  language: string; // "html" | "svg" | "javascript" | "typescript" | "markdown" | "css"
  content: string;
};

export function CanvasPanel({
  artifact,
  onClose,
  onIterate,
}: {
  artifact: Artifact;
  onClose: () => void;
  onIterate?: (instruction: string) => void;
}) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const [iterationPrompt, setIterationPrompt] = useState("");

  const handleCopy = () => {
    void navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext =
      artifact.language === "html"
        ? "html"
        : artifact.language === "svg"
          ? "svg"
          : artifact.language === "javascript"
            ? "js"
            : artifact.language === "typescript"
              ? "ts"
              : artifact.language === "css"
                ? "css"
                : "txt";
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${artifact.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    const blob = new Blob([artifact.content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const previewSrcDoc = useMemo(() => {
    if (artifact.language === "svg") {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#09090b;color:#f4f4f5;}</style></head><body>${artifact.content}</body></html>`;
    }
    if (artifact.language === "html" || artifact.language === "javascript") {
      // Include Tailwind CDN for interactive mockups
      return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}</style>
  </head>
  <body class="bg-background text-foreground">
    ${artifact.content}
  </body>
</html>`;
    }
    return `<!DOCTYPE html><html><body><pre style="white-space:pre-wrap;font-family:monospace;padding:16px;">${artifact.content}</pre></body></html>`;
  }, [artifact]);

  return (
    <div className="flex flex-col h-full w-full bg-background border-l border-border select-text">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-3 gap-2 bg-card/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold truncate text-foreground">
            {artifact.title}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted font-mono border border-border">
            {artifact.language}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center bg-muted/80 p-0.5 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={`px-2 py-0.5 text-xs rounded-md font-medium transition-colors flex items-center gap-1 ${
                tab === "preview"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconEye className="size-3.5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("code")}
              className={`px-2 py-0.5 text-xs rounded-md font-medium transition-colors flex items-center gap-1 ${
                tab === "code"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconCode className="size-3.5" />
              <span>Code</span>
            </button>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleCopy}
            title="Copy code"
            className="size-7 text-muted-foreground hover:text-foreground"
          >
            {copied ? <IconCheck className="size-3.5 text-emerald-400" /> : <IconCopy className="size-3.5" />}
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleDownload}
            title="Download file"
            className="size-7 text-muted-foreground hover:text-foreground"
          >
            <IconDownload className="size-3.5" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleOpenNewTab}
            title="Open in new window"
            className="size-7 text-muted-foreground hover:text-foreground"
          >
            <IconExternalLink className="size-3.5" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClose}
            title="Close Canvas"
            className="size-7 text-muted-foreground hover:text-foreground"
          >
            <IconX className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 min-h-0 relative bg-muted/20">
        {tab === "preview" ? (
          <iframe
            title={artifact.title}
            srcDoc={previewSrcDoc}
            sandbox="allow-scripts allow-modals allow-same-origin"
            className="w-full h-full border-none bg-background"
          />
        ) : (
          <div className="h-full overflow-auto p-4 font-mono text-xs text-foreground bg-card/40 leading-relaxed select-text">
            <pre className="whitespace-pre-wrap">{artifact.content}</pre>
          </div>
        )}
      </div>

      {/* Interactive Refinement Footer */}
      {onIterate && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!iterationPrompt.trim()) return;
            onIterate(iterationPrompt.trim());
            setIterationPrompt("");
          }}
          className="p-2.5 border-t border-border bg-card/60 flex items-center gap-2 shrink-0"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={iterationPrompt}
              onChange={(e) => setIterationPrompt(e.target.value)}
              placeholder="Ask bot to iterate on this canvas artifact..."
              className="w-full h-8 pl-3 pr-8 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!iterationPrompt.trim()}
            className="h-8 text-xs gap-1"
          >
            <IconSparkles className="size-3.5" />
            <span>Update</span>
          </Button>
        </form>
      )}
    </div>
  );
}
