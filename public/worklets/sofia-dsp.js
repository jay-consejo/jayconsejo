// Audio maths for the call worklets. Plain ES module with no browser APIs, so the
// worklets can import it and Node can test it.
//
// The relay speaks 16-bit little-endian mono PCM: 16 kHz from the caller, 24 kHz back.
// The page runs one AudioContext at the device's own rate (usually 48 or 44.1 kHz), so
// both directions resample here.

export const MIC_RATE = 16000;
export const VOICE_RATE = 24000;
/** 512 samples = 1,024 bytes = 32 ms at 16 kHz. */
export const MIC_FRAME_SAMPLES = 512;

/** @param {number} x a float sample, nominally -1..1 */
export function floatToInt16(x) {
  const s = x > 1 ? 1 : x < -1 ? -1 : x;
  return Math.round(s < 0 ? s * 0x8000 : s * 0x7fff);
}

/** @param {number} s a 16-bit sample */
export function int16ToFloat(s) {
  return s / 0x8000;
}

const ZERO_CROSSINGS = 8; // kernel half-width, in zero crossings of the sinc
const TABLE_STEPS = 128; // kernel table entries per input sample
const PASSBAND = 0.45; // cutoff as a fraction of the lower of the two rates

/**
 * Streaming resampler: windowed-sinc (Blackman) interpolation at arbitrary ratios. The
 * cutoff sits below the lower rate's Nyquist, so it low-passes before decimating and
 * suppresses images when upsampling. Delay is about `ZERO_CROSSINGS` cycles of the cutoff
 * (under 1 ms for the rates used here).
 */
export class Resampler {
  /** @param {number} inRate @param {number} outRate */
  constructor(inRate, outRate) {
    this.inRate = inRate;
    this.outRate = outRate;
    this.step = inRate / outRate; // input samples per output sample
    this.passthrough = inRate === outRate;

    // Cutoff in cycles per input sample.
    const fc = (PASSBAND * Math.min(inRate, outRate)) / inRate;
    this.halfWidth = ZERO_CROSSINGS / (2 * fc);
    const size = Math.ceil(this.halfWidth * TABLE_STEPS) + 2;
    this.table = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const t = i / TABLE_STEPS;
      if (t > this.halfWidth) break;
      const x = 2 * fc * t;
      const sinc = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
      const w = t / this.halfWidth;
      const blackman = 0.42 + 0.5 * Math.cos(Math.PI * w) + 0.08 * Math.cos(2 * Math.PI * w);
      this.table[i] = 2 * fc * sinc * blackman;
    }

    this.reset();
  }

  /** Forget all buffered input (used on barge-in, so no tail of old audio plays). */
  reset() {
    this.buf = new Float32Array(4096);
    this.len = 0; // samples held in buf
    this.base = 0; // absolute input index of buf[0]
    this.time = 0; // absolute input position of the next output sample
    this.out = new Float32Array(1024);
  }

  /** @param {number} t distance from the output position, in input samples */
  kernel(t) {
    const a = (t < 0 ? -t : t) * TABLE_STEPS;
    const i = a | 0;
    const f = a - i;
    return this.table[i] * (1 - f) + this.table[i + 1] * f;
  }

  /**
   * Feed input, get back whatever output it completes. The returned array is reused by
   * the next call, so copy out of it before calling again.
   * @param {Float32Array} input
   * @returns {Float32Array}
   */
  process(input) {
    if (this.passthrough) return input;

    if (this.len + input.length > this.buf.length) {
      const grown = new Float32Array(Math.max(this.buf.length * 2, this.len + input.length));
      grown.set(this.buf.subarray(0, this.len));
      this.buf = grown;
    }
    this.buf.set(input, this.len);
    this.len += input.length;

    const maxOut = Math.ceil(input.length / this.step) + 2;
    if (this.out.length < maxOut) this.out = new Float32Array(maxOut * 2);

    const hw = this.halfWidth;
    const end = this.base + this.len; // first absolute index we don't have yet
    let n = 0;
    while (this.time + hw < end) {
      const lo = Math.max(this.base, Math.ceil(this.time - hw));
      const hi = Math.floor(this.time + hw);
      let acc = 0;
      for (let k = lo; k <= hi; k++) acc += this.buf[k - this.base] * this.kernel(this.time - k);
      this.out[n++] = acc;
      this.time += this.step;
    }

    // Drop input that no future output can reach.
    const keepFrom = Math.max(this.base, Math.floor(this.time - hw));
    const drop = keepFrom - this.base;
    if (drop > 0) {
      this.buf.copyWithin(0, drop, this.len);
      this.len -= drop;
      this.base = keepFrom;
    }
    return this.out.subarray(0, n);
  }
}

/**
 * Mic side: device-rate float blocks in, 16 kHz Int16 frames out. Each frame goes to
 * `onFrame` as its own ArrayBuffer, so the worklet can transfer it without copying.
 */
export class MicEncoder {
  /** @param {number} inRate @param {(frame: ArrayBuffer) => void} onFrame */
  constructor(inRate, onFrame, frameSamples = MIC_FRAME_SAMPLES) {
    this.resampler = new Resampler(inRate, MIC_RATE);
    this.onFrame = onFrame;
    this.frameSamples = frameSamples;
    this.frame = new Int16Array(frameSamples);
    this.n = 0;
  }

  /** @param {Float32Array} block */
  push(block) {
    const out = this.resampler.process(block);
    for (let i = 0; i < out.length; i++) {
      this.frame[this.n++] = floatToInt16(out[i]);
      if (this.n === this.frameSamples) {
        const full = this.frame;
        this.frame = new Int16Array(this.frameSamples);
        this.n = 0;
        this.onFrame(full.buffer);
      }
    }
  }
}

const FIFO_SIZE = 16384;
const PULL_SAMPLES = 256;
/** Two minutes of 24 kHz audio: far more than one reply, and a hard memory cap. */
export const MAX_QUEUED_SAMPLES = VOICE_RATE * 120;

/**
 * Playback side: 24 kHz Int16 chunks in (as they arrive, often faster than real time),
 * device-rate floats out, one render quantum at a time. Audio waits as compact Int16 and
 * is resampled only when it's about to play.
 */
export class PlaybackQueue {
  /** @param {number} outRate */
  constructor(outRate) {
    this.outRate = outRate;
    this.resampler = new Resampler(VOICE_RATE, outRate);
    this.fifo = new Float32Array(FIFO_SIZE);
    this.pullBuf = new Float32Array(PULL_SAMPLES);
    this.flush();
  }

  /** Drop everything queued or half-played. */
  flush() {
    /** @type {Int16Array[]} */
    this.chunks = [];
    this.chunkPos = 0; // read position inside chunks[0]
    this.queued = 0; // 24 kHz samples waiting in chunks
    this.fifoRead = 0;
    this.fifoCount = 0;
    this.resampler.reset();
  }

  /**
   * @param {Int16Array} pcm
   * @returns {boolean} false if the queue is full and the chunk was dropped
   */
  push(pcm) {
    if (pcm.length === 0) return true;
    if (this.queued + pcm.length > MAX_QUEUED_SAMPLES) return false;
    this.chunks.push(pcm);
    this.queued += pcm.length;
    return true;
  }

  /** Audio still to play, in milliseconds. */
  bufferedMs() {
    return (this.queued / VOICE_RATE + this.fifoCount / this.outRate) * 1000;
  }

  get empty() {
    return this.queued === 0 && this.fifoCount === 0;
  }

  /** Move up to PULL_SAMPLES of queued input through the resampler into the FIFO. */
  pull() {
    let n = 0;
    while (n < PULL_SAMPLES && this.chunks.length > 0) {
      const head = this.chunks[0];
      const take = Math.min(PULL_SAMPLES - n, head.length - this.chunkPos);
      for (let i = 0; i < take; i++) this.pullBuf[n + i] = int16ToFloat(head[this.chunkPos + i]);
      n += take;
      this.chunkPos += take;
      if (this.chunkPos === head.length) {
        this.chunks.shift();
        this.chunkPos = 0;
      }
    }
    this.queued -= n;
    // The resampler holds back its last few input samples (well under 1 ms) until more
    // audio arrives. Padding them out with silence would put a click into any reply whose
    // next chunk is merely late, so they wait.
    const out = this.resampler.process(this.pullBuf.subarray(0, n));
    for (let i = 0; i < out.length && this.fifoCount < FIFO_SIZE; i++) {
      this.fifo[(this.fifoRead + this.fifoCount) % FIFO_SIZE] = out[i];
      this.fifoCount++;
    }
  }

  /**
   * Fill one output block. Returns how many samples were real audio; the rest are zeros.
   * @param {Float32Array} out
   */
  render(out) {
    while (this.fifoCount < out.length && this.queued > 0) this.pull();
    const n = Math.min(out.length, this.fifoCount);
    for (let i = 0; i < n; i++) out[i] = this.fifo[(this.fifoRead + i) % FIFO_SIZE];
    out.fill(0, n);
    this.fifoRead = (this.fifoRead + n) % FIFO_SIZE;
    this.fifoCount -= n;
    return n;
  }
}
