import { headers } from "next/headers";
import { Hero } from "@/components/sections/hero";
import { TrustSignals } from "@/components/sections/trust-signals";
import { Process } from "@/components/sections/process";
import { Projects } from "@/components/sections/projects";
import { About } from "@/components/sections/about";
import { TrackRecord } from "@/components/sections/track-record";
import { Contact } from "@/components/sections/contact";

export default async function Home() {
  const h = await headers();
  const country = h.get("x-vercel-ip-country") ?? "PH";

  return (
    <>
      <Hero />
      <TrustSignals />
      <Process />
      <Projects />
      <About />
      <TrackRecord />
      <Contact defaultCountry={country} />
    </>
  );
}
