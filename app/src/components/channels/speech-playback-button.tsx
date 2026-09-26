import * as React from "react";
import { useState } from "react";
import { IconVolume, IconPlayerStop } from "@tabler/icons-react";

export function SpeechPlaybackButton({ text }: { text: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleSpeak = () => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting symbols for natural speech
    const cleanSpeech = text
      .replace(/```[\s\S]*?```/g, "Code block omitted.")
      .replace(/[#*`_~\[\]]/g, "")
      .replace(/http\S+/g, "link")
      .trim();

    if (!cleanSpeech) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  return (
    <button
      type="button"
      onClick={toggleSpeak}
      className={`p-1 rounded-md transition-colors text-xs flex items-center gap-1 ${
        isPlaying
          ? "bg-primary/20 text-primary animate-pulse"
          : "bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
      title={isPlaying ? "Stop speech" : "Read aloud"}
    >
      {isPlaying ? (
        <>
          <IconPlayerStop className="size-3" />
          <span className="text-[10px]">Stop</span>
        </>
      ) : (
        <>
          <IconVolume className="size-3" />
          <span className="text-[10px]">Speak</span>
        </>
      )}
    </button>
  );
}
