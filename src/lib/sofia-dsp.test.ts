import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  floatToInt16,
  int16ToFloat,
  MAX_QUEUED_SAMPLES,
  MIC_FRAME_SAMPLES,
  MicEncoder,
  PlaybackQueue,
  Resampler,
  VOICE_RATE,
} from "../../public/worklets/sofia-dsp.js";

const QUANTUM = 128; // Web Audio render quantum

function sine(rate: number, hz: number, seconds: number, amp: number): Float32Array {
  const out = new Float32Array(Math.round(rate * seconds));
  for (let i = 0; i < out.length; i++) out[i] = amp * Math.sin((2 * Math.PI * hz * i) / rate);
  return out;
}

function rms(xs: ArrayLike<number>, from = 0, to = xs.length): number {
  let sum = 0;
  for (let i = from; i < to; i++) sum += xs[i] * xs[i];
  return Math.sqrt(sum / (to - from));
}

/** Rising zero crossings per second: a cheap frequency check. */
function frequency(xs: ArrayLike<number>, rate: number): number {
  let crossings = 0;
  for (let i = 1; i < xs.length; i++) if (xs[i - 1] < 0 && xs[i] >= 0) crossings++;
  return crossings / (xs.length / rate);
}

function encodeMic(rate: number, input: Float32Array, block = QUANTUM) {
  const frames: ArrayBuffer[] = [];
  const enc = new MicEncoder(rate, (f: ArrayBuffer) => frames.push(f));
  for (let i = 0; i < input.length; i += block) enc.push(input.subarray(i, i + block));
  const pcm = new Int16Array(frames.length * MIC_FRAME_SAMPLES);
  frames.forEach((f, i) => pcm.set(new Int16Array(f), i * MIC_FRAME_SAMPLES));
  return { frames, pcm };
}

function playAll(rate: number, pcm: Int16Array) {
  const q = new PlaybackQueue(rate);
  assert.equal(q.push(pcm), true);
  const out: number[] = [];
  const block = new Float32Array(QUANTUM);
  for (;;) {
    const n = q.render(block);
    if (n === 0) break;
    for (let i = 0; i < n; i++) out.push(block[i]);
  }
  return { q, out: Float32Array.from(out) };
}

describe("sample conversion", () => {
  it("maps floats to Int16 with clipping", () => {
    assert.equal(floatToInt16(0), 0);
    assert.equal(floatToInt16(1), 32767);
    assert.equal(floatToInt16(-1), -32768);
    assert.equal(floatToInt16(0.5), 16384);
    assert.equal(floatToInt16(1.7), 32767, "clips above +1");
    assert.equal(floatToInt16(-3), -32768, "clips below -1");
  });

  it("maps Int16 back to floats", () => {
    assert.equal(int16ToFloat(0), 0);
    assert.equal(int16ToFloat(-32768), -1);
    assert.ok(Math.abs(int16ToFloat(32767) - 1) < 1e-4);
  });
});

describe("mic: device rate to 16 kHz frames", () => {
  for (const rate of [48000, 44100]) {
    it(`${rate / 1000} kHz: 1,024-byte frames, ~31 per second, level and pitch kept`, () => {
      const { frames, pcm } = encodeMic(rate, sine(rate, 1000, 1, 0.5));
      assert.ok(frames.every((f) => f.byteLength === 1024));
      assert.ok(frames.length >= 30 && frames.length <= 32, `got ${frames.length} frames`);
      // Skip the first frame (filter warm-up), then expect 0.5/√2 of full scale.
      const level = rms(pcm, MIC_FRAME_SAMPLES) / 32768;
      assert.ok(Math.abs(level - 0.5 / Math.SQRT2) < 0.01, `level ${level}`);
      assert.ok(Math.abs(frequency(pcm, 16000) - 1000) < 5, "pitch kept");
    });
  }

  it("filters out sound above 8 kHz instead of folding it back in", () => {
    const { pcm } = encodeMic(48000, sine(48000, 12000, 1, 0.8));
    assert.ok(rms(pcm, MIC_FRAME_SAMPLES) / 32768 < 0.003, "12 kHz tone suppressed");
  });

  it("gives the same samples whatever the block sizes", () => {
    const input = sine(44100, 440, 0.5, 0.6);
    const whole = encodeMic(44100, input, input.length).pcm;
    const ragged = encodeMic(44100, input, 37).pcm;
    assert.deepEqual(ragged, whole);
  });
});

describe("playback: 24 kHz to device rate", () => {
  const voice = Int16Array.from(sine(VOICE_RATE, 1000, 1, 0.5), floatToInt16);

  for (const rate of [48000, 44100]) {
    it(`${rate / 1000} kHz: duration, level and pitch kept`, () => {
      const { q, out } = playAll(rate, voice);
      assert.ok(Math.abs(out.length - rate) < 64, `got ${out.length} samples`);
      const level = rms(out, QUANTUM, out.length - QUANTUM);
      assert.ok(Math.abs(level - 0.5 / Math.SQRT2) < 0.01, `level ${level}`);
      assert.ok(Math.abs(frequency(out, rate) - 1000) < 5, "pitch kept");
      assert.equal(q.empty, true, "drained after the last block");
    });
  }

  it("plays at 24 kHz without resampling", () => {
    const { out } = playAll(VOICE_RATE, voice);
    assert.equal(out.length, voice.length);
    assert.equal(out[100], int16ToFloat(voice[100]));
  });

  it("reports buffered milliseconds", () => {
    const q = new PlaybackQueue(48000);
    q.push(voice.subarray(0, 12000));
    assert.equal(q.bufferedMs(), 500);
    q.render(new Float32Array(QUANTUM));
    assert.ok(q.bufferedMs() < 500 && q.bufferedMs() > 490);
  });

  it("flush empties the buffer at once", () => {
    const q = new PlaybackQueue(48000);
    q.push(voice);
    const block = new Float32Array(QUANTUM);
    q.render(block);
    q.flush();
    assert.equal(q.empty, true);
    assert.equal(q.bufferedMs(), 0);
    block.fill(1);
    assert.equal(q.render(block), 0);
    assert.ok(block.every((x) => x === 0), "silence after flush");
  });

  it("refuses audio past its cap instead of growing without bound", () => {
    const q = new PlaybackQueue(48000);
    assert.equal(q.push(new Int16Array(MAX_QUEUED_SAMPLES)), true);
    assert.equal(q.push(new Int16Array(1)), false);
  });
});

describe("Resampler", () => {
  it("passes audio through untouched when the rates match", () => {
    const input = sine(16000, 300, 0.1, 0.3);
    assert.equal(new Resampler(16000, 16000).process(input), input);
  });
});
