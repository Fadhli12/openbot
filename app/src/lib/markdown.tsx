import {
  IconFile,
  IconFileText,
  IconPresentation,
  IconTable,
  IconEye,
} from "@tabler/icons-react";
import type { ComponentProps } from "react";

const DRIVE_KINDS = [
  { match: "/document/", icon: IconFileText, label: "Doc" },
  { match: "/spreadsheets/", icon: IconTable, label: "Sheet" },
  { match: "/presentation/", icon: IconPresentation, label: "Slides" },
] as const;

export function documentChipKind(href: string | undefined) {
  if (!href) return null;

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (url.hostname === "docs.google.com") {
    const kind = DRIVE_KINDS.find((entry) =>
      url.pathname.includes(entry.match),
    );
    return kind ?? { match: "", icon: IconFile, label: "Drive" };
  }
  if (url.hostname === "drive.google.com") {
    return { match: "", icon: IconFile, label: "Drive" };
  }
  if (url.hostname === "notion.so" || url.hostname === "www.notion.so") {
    return { match: "", icon: IconFileText, label: "Notion" };
  }
  return null;
}

export const markdownComponents = {
  a: ({ href, children, ...rest }: ComponentProps<"a">) => {
    const kind = documentChipKind(href);

    if (kind) {
      const Icon = kind.icon;
      return (
        <a
          {...rest}
          className="inline-flex max-w-full items-center gap-1.5 rounded-md border bg-muted/40 px-1.5 py-0.5 align-middle text-xs leading-tight no-underline transition-colors hover:bg-muted"
          href={href}
          rel="noreferrer noopener"
          target="_blank"
        >
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{children}</span>
          <span className="shrink-0 text-muted-foreground">{kind.label}</span>
        </a>
      );
    }

    return (
      <a
        {...rest}
        className="underline underline-offset-2 hover:no-underline"
        href={href}
        rel="noreferrer noopener"
        target="_blank"
      >
        {children}
      </a>
    );
  },
  pre: ({ children, ...rest }: ComponentProps<"pre">) => {
    // Check if inner code contains HTML, SVG, or code block candidate for Canvas Artifact
    return (
      <div className="relative group/code-block my-2">
        <pre
          {...rest}
          className="overflow-x-auto rounded-lg bg-card/80 p-3 font-mono text-xs border border-border"
        >
          {children}
        </pre>
        <button
          type="button"
          onClick={(e) => {
            const preEl = e.currentTarget.previousElementSibling;
            const codeText = preEl?.textContent ?? "";
            const isSvg = codeText.trim().startsWith("<svg") || codeText.includes("xmlns=\"http://www.w3.org/2000/svg\"");
            const isHtml = codeText.trim().startsWith("<!DOCTYPE") || codeText.trim().startsWith("<html") || codeText.includes("<div");
            const lang = isSvg ? "svg" : isHtml ? "html" : "typescript";
            
            window.dispatchEvent(
              new CustomEvent("openbot-open-canvas", {
                detail: {
                  artifact: {
                    id: "art-" + Date.now(),
                    title: isSvg ? "Rendered SVG Visual" : isHtml ? "Interactive UI Preview" : "Code Artifact",
                    language: lang,
                    content: codeText,
                  },
                },
              }),
            );
          }}
          className="absolute top-2 right-2 opacity-0 group-hover/code-block:opacity-100 transition-opacity px-2 py-1 rounded bg-background/90 hover:bg-background border border-border text-foreground text-[10px] font-medium flex items-center gap-1 shadow-xs"
          title="Open in Canvas Sandbox"
        >
          <IconEye className="size-3" />
          <span>Canvas</span>
        </button>
      </div>
    );
  },
};
