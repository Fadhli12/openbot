import {
  basicCatalog,
  Catalog,
  type ReactComponentImplementation,
} from "@copilotkit/a2ui-renderer";
import type { CopilotKitProviderProps } from "@copilotkit/react-core/v2";
import {
  IconCheck,
  IconPlayerPlay,
  IconPencil,
  IconSettings,
  IconBrain,
  IconUser,
  IconFileText,
  IconSparkles,
} from "@tabler/icons-react";

/**
 * Custom icon renderer for A2UI to replace unrendered text strings with real Tabler SVG icons.
 */
function renderA2UiIcon(name?: string) {
  const normalized = (name || "").toLowerCase().trim();
  switch (normalized) {
    case "check":
      return <IconCheck className="size-4 text-emerald-400 shrink-0" />;
    case "play":
      return <IconPlayerPlay className="size-4 text-blue-400 shrink-0" />;
    case "edit":
    case "pencil":
      return <IconPencil className="size-4 text-amber-400 shrink-0" />;
    case "settings":
    case "gear":
      return <IconSettings className="size-4 text-purple-400 shrink-0" />;
    case "brain":
    case "memory":
      return <IconBrain className="size-4 text-pink-400 shrink-0" />;
    case "user":
    case "agent":
      return <IconUser className="size-4 text-foreground/80 shrink-0" />;
    case "file":
    case "document":
      return <IconFileText className="size-4 text-muted-foreground shrink-0" />;
    default:
      return <IconSparkles className="size-4 text-muted-foreground shrink-0" />;
  }
}

/**
 * Keep the SDK's schemas, data bindings and action handlers. The wrapper only supplies a stable
 * styling hook: the 1.70.1 basic catalog uses inline styles and does not consume the theme prop.
 * These are declarative primitives, not the separately granted OpenBot gallery/custom components.
 */
function branded(
  component: ReactComponentImplementation,
): ReactComponentImplementation {
  const Render = component.render;
  return {
    ...component,
    render: (props) => {
      if (component.name === "Icon") {
        const iconName = (props as any)?.props?.name;
        return (
          <div data-openbot-a2ui="Icon" className="inline-flex items-center justify-center size-5 shrink-0">
            {renderA2UiIcon(iconName)}
          </div>
        );
      }

      return (
        <div data-openbot-a2ui={component.name} style={{ display: "contents" }}>
          <Render {...props} />
        </div>
      );
    },
  };
}

export const OPENBOT_A2UI_CATALOG = new Catalog(
  basicCatalog.id,
  Array.from(basicCatalog.components.values(), branded),
  Array.from(basicCatalog.functions.values()),
  basicCatalog.themeSchema,
);

const A2UI_OPTIONS = { catalog: OPENBOT_A2UI_CATALOG } satisfies NonNullable<
  CopilotKitProviderProps["a2ui"]
>;

/** Prop presence activates the SDK, so an unresolved or disabled capability must omit it. */
export function a2uiProviderOptions(enabled: boolean | undefined) {
  return enabled ? { a2ui: A2UI_OPTIONS } : {};
}
