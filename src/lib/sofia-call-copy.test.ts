import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { voiceStatus } from "./sofia-call-copy.ts";

describe("voiceStatus", () => {
  it("invites the caller to talk over Sofia when unmuted", () => {
    assert.deepEqual(voiceStatus({ speaking: true, muted: false }), {
      title: "Sofia is talking",
      hint: "Just talk to interrupt her",
    });
    assert.deepEqual(voiceStatus({ speaking: false, muted: false }), {
      title: "Sofia is listening",
      hint: "Take your time",
    });
  });

  it("never tells a muted caller to just talk", () => {
    assert.deepEqual(voiceStatus({ speaking: true, muted: true }), {
      title: "Sofia is talking",
      hint: "Unmute to interrupt her",
    });
    assert.deepEqual(voiceStatus({ speaking: false, muted: true }), {
      title: "Sofia is listening",
      hint: "Unmute when you're ready",
    });
  });
});
