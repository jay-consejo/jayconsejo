/**
 * The parts of the privacy page that depend on whether Sofia's call is live. While it is
 * offline the site only takes email, so the page describes email only.
 */
export type PrivacyCopy = {
  /** Information We Collect. */
  collected: string[];
  /** Calls with Sofia; empty while the call is offline. */
  call: string[];
  /** Service providers, in the order shown. */
  providers: { name: string; use: string }[];
  /** How We Use Your Information. */
  use: string[];
  /** Data Retention. */
  retention: string[];
};

export function privacyCopy({ online }: { online: boolean }): PrivacyCopy {
  return {
    collected: [
      online
        ? "When you email us, we receive your email address and whatever you write. When you request a call with Sofia, you give us your name, email address and WhatsApp number, and we collect what you say on the call."
        : "When you email us, we receive your email address and whatever you write.",
      "We do not collect data automatically through cookies or tracking scripts, except as described under Analytics and Security below.",
    ],
    call: online
      ? [
          "Sofia is an AI voice assistant. Your voice is processed live by Amazon Nova Sonic on Amazon Bedrock so that Sofia can understand and answer you. The call is recorded, and transcribed as it happens.",
          "After the call, the transcript is summarized by AI, using Mistral on Amazon Bedrock. The summary, your name, email address and WhatsApp number, and details from the call such as your project type, budget range and timeline are saved to a Google Sheet that only Jay can open. The audio recording and the written transcript are saved in a private Google Drive folder that only Jay can open, and linked from that Sheet.",
          "Before a call starts, we check your email address and WhatsApp number against recent calls, to limit repeat calls. If you book a meeting during the call, your name and email address go to Jay's Google Calendar, which sends you the invite.",
        ]
      : [],
    providers: [
      { name: "Vercel", use: "hosts this website." },
      { name: "Cloudflare", use: "delivers the site, measures traffic and blocks bots (see Analytics and Security)." },
      { name: "Google (Gmail)", use: "receives your emails." },
      ...(online
        ? [
            { name: "Amazon Web Services", use: "runs the call server, and Amazon Nova Sonic and Mistral on Amazon Bedrock." },
            { name: "Google Sheets, Google Docs, Google Drive and Google Calendar", use: "store call records, transcripts and recordings, and send meeting invites." },
          ]
        : []),
    ],
    use: [
      online
        ? "We use your information only to reply to you, to hold and follow up on calls, and to talk about potential projects. We do not sell or rent it, and we do not use it for advertising."
        : "We use your information only to reply to you and to talk about potential projects. We do not sell or rent it, and we do not use it for advertising.",
      "The services below handle it for us, each only to provide its part of this site:",
    ],
    retention: [
      "We keep emails as long as we need them to talk about your project.",
      ...(online ? ["Call records, meaning the audio recording, the written transcript, the summary and the details saved from a call, are kept for 12 months after the call and then deleted."] : []),
      "You can ask us to delete your data at any time.",
    ],
  };
}
