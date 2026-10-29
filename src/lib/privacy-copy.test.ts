import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { privacyCopy } from "./privacy-copy.ts";

const allText = (online: boolean) => {
  const c = privacyCopy({ online });
  return [...c.collected, ...c.call, ...c.providers.map((p) => `${p.name} ${p.use}`), ...c.use, ...c.retention].join(" ");
};

describe("privacyCopy", () => {
  it("describes email only while Sofia is offline", () => {
    const c = privacyCopy({ online: false });
    const text = allText(false);
    assert.equal(c.call.length, 0);
    assert.match(text, /email/i);
    assert.doesNotMatch(text, /contact form|Bedrock|Nova Sonic|Mistral|Google Sheets|transcri/i);
  });

  it("names every service that handles a call once Sofia is online", () => {
    const text = allText(true);
    for (const name of ["Amazon Bedrock", "Nova Sonic", "Mistral", "Google Sheets", "Google Docs", "Google Drive", "Google Calendar", "Cloudflare", "Vercel"]) {
      assert.ok(text.includes(name), `missing ${name}`);
    }
  });

  it("says calls are transcribed and summarized by AI, and how long records are kept", () => {
    const text = allText(true);
    assert.match(text, /transcribed/);
    assert.match(text, /summarized by AI/);
    assert.match(privacyCopy({ online: true }).retention.join(" "), /12 months/);
  });

  it("says the call is recorded, where the recording and transcript are kept, and for how long", () => {
    const text = allText(true);
    assert.doesNotMatch(text, /transcript is not kept|do not record/i);
    assert.match(text, /The call is recorded/);
    assert.match(text, /audio recording and the written transcript are saved in a private Google Drive folder that only Jay can open/);
    assert.match(privacyCopy({ online: true }).retention.join(" "), /audio recording, the written transcript[^.]*12 months/);
  });

  it("never claims nothing is shared with third parties", () => {
    for (const online of [false, true]) {
      assert.doesNotMatch(allText(online), /(do not|never) (sell, rent, or )?share/i);
    }
  });
});
