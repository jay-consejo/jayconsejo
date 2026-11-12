import { Hero } from "@/components/sections/hero";
import { TrustSignals } from "@/components/sections/trust-signals";
import { Process } from "@/components/sections/process";
import { Work } from "@/components/sections/work";
import { About } from "@/components/sections/about";
import { TrackRecord } from "@/components/sections/track-record";
import { Contact } from "@/components/sections/contact";
import { ContactEmail } from "@/components/sections/contact-email";
import { SOFIA_ONLINE } from "@/lib/sofia-switch";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustSignals />
      <Process />
      <Work />
      <About />
      <TrackRecord />
      {SOFIA_ONLINE ? <Contact /> : <ContactEmail />}
    </>
  );
}
