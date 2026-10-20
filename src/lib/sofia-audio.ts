import type { CallAudio } from "./sofia-call-client";

/**
 * The call's audio graph: one AudioContext at the device's own rate, the mic worklet
 * (16 kHz frames out) and the playback worklet (Sofia's 24 kHz audio in).
 *
 * Call this inside the click or submit handler, before any `await`: iOS Safari only
 * unlocks audio during the user's gesture.
 */
export function createCallAudio(): CallAudio {
  const ctx = new AudioContext();
  void ctx.resume().catch(() => {});

  let stream: MediaStream | null = null;
  let playback: AudioWorkletNode | null = null;
  let onFrame: ((frame: ArrayBuffer) => void) | null = null;
  let onPlayback: (playing: boolean) => void = () => {};
  let playing = false;
  let closed = false;

  const setPlaying = (value: boolean) => {
    if (value === playing) return;
    playing = value;
    onPlayback(value);
  };
  const stopTracks = () => stream?.getTracks().forEach((t) => t.stop());

  return {
    async openMic() {
      const modules = Promise.all([
        ctx.audioWorklet.addModule("/worklets/sofia-mic.js"),
        ctx.audioWorklet.addModule("/worklets/sofia-playback.js"),
      ]);
      // If the mic is refused, this load is abandoned and closing the context rejects it;
      // mark it handled so that isn't an uncaught error. The success path still awaits it.
      modules.catch(() => {});
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      await modules;
      if (closed) {
        stopTracks();
        throw new Error("closed");
      }

      playback = new AudioWorkletNode(ctx, "sofia-playback", { outputChannelCount: [1] });
      playback.port.onmessage = ({ data }) => {
        if (data?.type === "buffered") setPlaying(data.ms > 0);
        else if (data?.type === "drained") setPlaying(false);
      };
      playback.connect(ctx.destination);

      // The mic node has to reach the destination to keep running; a muted gain keeps
      // the caller from hearing themselves.
      const mic = new AudioWorkletNode(ctx, "sofia-mic");
      mic.port.onmessage = ({ data }) => {
        if (data instanceof ArrayBuffer) onFrame?.(data);
      };
      const silent = ctx.createGain();
      silent.gain.value = 0;
      ctx.createMediaStreamSource(stream).connect(mic).connect(silent).connect(ctx.destination);
    },

    startSending(cb) {
      onFrame = cb;
    },

    play(frame) {
      playback?.port.postMessage({ type: "push", pcm: frame }, [frame]);
    },

    flush() {
      playback?.port.postMessage({ type: "flush" });
    },

    onPlayback(cb) {
      onPlayback = cb;
    },

    close() {
      if (closed) return;
      closed = true;
      onFrame = null;
      stopTracks();
      void ctx.close().catch(() => {});
    },
  };
}
