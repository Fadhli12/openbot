import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import { SidebarShell } from "@/components/layout/sidebar-shell";
import { ChannelLayerContainer } from "@/components/channels/channel-layer-container";

export const Route = createFileRoute("/_authed/_app")({
  component: RouteComponent,
});

function RouteComponent() {
  const location = useLocation();
  const channelMatch = location.pathname.match(/^\/channel\/([^/]+)$/);
  const activeChannelId = channelMatch && channelMatch[1] !== "new" ? channelMatch[1] : null;

  return (
    // One viewport, never scrolls: panes scroll inside it. A growable shell lets the transcript's
    // scroller size against the page, grow it, and grow again.
    <SidebarShell className="h-svh overflow-hidden" width="340px">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <ChannelLayerContainer activeChannelId={activeChannelId} />
        {/* Render standard non-channel routes (e.g. /channel/new, /settings, /skills, /agents) */}
        {!activeChannelId && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Outlet />
          </div>
        )}
      </main>
    </SidebarShell>
  );
}
