// Mic worklet: turns the caller's microphone into the relay's input format, 16 kHz mono
// Int16 in 1,024-byte frames, and posts each frame to the page as a transferable buffer.
// Load it with audioWorklet.addModule("/worklets/sofia-mic.js"), then
// new AudioWorkletNode(ctx, "sofia-mic").
import { MicEncoder } from "./sofia-dsp.js";

class SofiaMic extends AudioWorkletProcessor {
  constructor() {
    super();
    // `sampleRate` is the AudioContext's rate, a global in the worklet scope.
    this.encoder = new MicEncoder(sampleRate, (frame) => this.port.postMessage(frame, [frame]));
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) this.encoder.push(channel);
    return true;
  }
}

registerProcessor("sofia-mic", SofiaMic);
