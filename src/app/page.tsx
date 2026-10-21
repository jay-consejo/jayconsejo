import { headers } from "next/headers";
import { Hero } from "@/components/sections/hero";
import { TrustSignals } from "@/components/sections/trust-signals";
import { Process } from "@/components/sections/process";
import { Work } from "@/components/sections/work";
import { About } from "@/components/sections/about";
import { TrackRecord } from "@/components/sections/track-record";
import { Contact } from "@/components/sections/contact";
import { ContactEmail } from "@/components/sections/contact-email";
import { SOFIA_ONLINE } from "@/lib/sofia-switch";

export default async function Home() {
  const h = await headers();
  const country = h.get("x-vercel-ip-country") ?? "PH";
  // Server-only switch: until cutover, production leaves it unset and keeps ElevenLabs.
  const provider = process.env.SOFIA_PROVIDER === "nova" ? "nova" : "elevenlabs";

  return (
    <>
      <Hero />
      <TrustSignals />
      <Process />
      <Work />
      <About />
      <TrackRecord />
      {SOFIA_ONLINE ? <Contact defaultCountry={country} provider={provider} /> : <ContactEmail />}
    </>
  );
}
