import { Hero } from "@/components/sections/hero";
import { TrustSignals } from "@/components/sections/trust-signals";
import { Process } from "@/components/sections/process";
import { Projects } from "@/components/sections/projects";
import { About } from "@/components/sections/about";
import { TrackRecord } from "@/components/sections/track-record";
import { Contact } from "@/components/sections/contact";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustSignals />
      <Process />
      <Projects />
      <About />
      <TrackRecord />
      <Contact />
    </>
  );
}
