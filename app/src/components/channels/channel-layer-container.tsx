import { useState, useEffect } from "react";
import { ChannelViewLayer } from "@/components/channels/channel-view-layer";

/**
 * ChannelLayerContainer maintains an in-memory stack/pool of visited channel views (layers).
 *
 * When switching between channels, previously mounted channels stay alive in the DOM
 * (hidden via CSS z-index and opacity). This provides:
 * 1. ZERO latency (0ms) instant switching when returning to any open channel.
 * 2. Background persistence: Any running agent streams, unfinished typing drafts,
 *    or audio/interactive state in channel A will NOT be unmounted or interrupted
 *    when the user switches to channel B to check something!
 */
export function ChannelLayerContainer({
  activeChannelId,
}: {
  activeChannelId: string | null;
}) {
  const [visitedChannels, setVisitedChannels] = useState<string[]>(() => {
    return activeChannelId ? [activeChannelId] : [];
  });

  useEffect(() => {
    if (!activeChannelId) return;
    setVisitedChannels((prev) => {
      if (prev.includes(activeChannelId)) {
        return prev;
      }
      // Keep up to 15 concurrent channel layers in memory for optimal performance & resource usage
      const next = [...prev, activeChannelId];
      if (next.length > 15) {
        return next.slice(next.length - 15);
      }
      return next;
    });
  }, [activeChannelId]);

  if (visitedChannels.length === 0) return null;

  return (
    <>
      {visitedChannels.map((channelId) => (
        <ChannelViewLayer
          key={channelId}
          channelId={channelId}
          isActive={channelId === activeChannelId}
        />
      ))}
    </>
  );
}
