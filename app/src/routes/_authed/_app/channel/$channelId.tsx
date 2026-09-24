import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const chatSearchSchema = z.object({
  settings: z.boolean().optional(),
  watch: z.boolean().optional(),
});

export const Route = createFileRoute("/_authed/_app/channel/$channelId")({
  validateSearch: chatSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  // The actual channel rendering is managed by the persistent ChannelLayerContainer in `_app.tsx`.
  // This route component stays mounted to manage URL search params and router lifecycle.
  return null;
}
