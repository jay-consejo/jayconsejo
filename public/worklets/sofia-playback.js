// Playback worklet: plays the relay's 24 kHz Int16 audio at the AudioContext's rate.
// Audio often arrives faster than real time, so it queues here and plays in order.
//
// Page → worklet:
//   { type: "push", pcm: ArrayBuffer }   queue audio (transfer the buffer)
//   { type: "flush" }                    drop everything at once (the caller interrupted)
// Worklet → page:
//   { type: "buffered", ms }             after each push, and every ~100 ms while playing
//   { type: "drained" }                  the last queued sample has played
//   { type: "overflow" }                 a push was dropped because the queue is full
import { PlaybackQueue } from "./sofia-dsp.js";

const REPORT_EVERY_S = 0.1;

class SofiaPlayback extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = new PlaybackQueue(sampleRate);
    this.playing = false;
    this.lastReport = 0;
    this.port.onmessage = ({ data }) => {
      if (data.type === "push") {
        if (!this.queue.push(new Int16Array(data.pcm))) this.port.postMessage({ type: "overflow" });
        this.report();
      } else if (data.type === "flush") {
        this.queue.flush();
        this.settle();
      }
    };
  }

  report() {
    this.lastReport = currentTime;
    this.port.postMessage({ type: "buffered", ms: this.queue.bufferedMs() });
  }

  /** Post "drained" once when the queue goes from playing to empty. */
  settle() {
    const playing = !this.queue.empty;
    if (this.playing && !playing) this.port.postMessage({ type: "drained" });
    this.playing = playing;
  }

  process(_inputs, outputs) {
    const out = outputs[0];
    if (!out || out.length === 0) return true;
    this.queue.render(out[0]);
    for (let c = 1; c < out.length; c++) out[c].set(out[0]);
    if (!this.queue.empty && currentTime - this.lastReport >= REPORT_EVERY_S) this.report();
    this.settle();
    return true;
  }
}

registerProcessor("sofia-playback", SofiaPlayback);
