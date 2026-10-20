/** The live call's voice row: who is talking, and what the caller can do about it. */
export function voiceStatus({ speaking, muted }: { speaking: boolean; muted: boolean }): {
  title: string;
  hint: string;
} {
  if (speaking) {
    return { title: "Sofia is talking", hint: muted ? "Unmute to interrupt her" : "Just talk to interrupt her" };
  }
  return { title: "Sofia is listening", hint: muted ? "Unmute when you're ready" : "Take your time" };
}
