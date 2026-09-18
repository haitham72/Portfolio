import { getHero, getEditedFor, getSelectedWork, getReels, getAbout, getCampaigns } from "@/lib/content";
import Hero from "@/components/sections/01Hero";
import StatementBand from "@/components/sections/StatementBand";
import EditedFor from "@/components/sections/02EditedFor";
import StatsBand from "@/components/sections/StatsBand";
import SelectedWork from "@/components/sections/03SelectedWork";
import Campaigns from "@/components/sections/Campaigns";
import Reels from "@/components/sections/04Reels";
import Process from "@/components/sections/05Process";
import Toolkit from "@/components/sections/06Toolkit";
import AboutBooking from "@/components/sections/07AboutBooking";
import Footer from "@/components/sections/Footer";

// The "Simple" gallery (components/sections/Simple.tsx) is deliberately
// NOT composed here — it's the /preview experience only, a separate,
// specifically-curated folder shown to not-yet-approved sign-ins. It never
// appears in the real site.
export default function Home() {
  const hero = getHero();
  const logos = getEditedFor();
  const projects = getSelectedWork();
  const campaigns = getCampaigns();
  const reels = getReels();
  const about = getAbout();

  return (
    <main>
      <Hero hero={hero} />
      <StatementBand />
      <EditedFor logos={logos} />
      <StatsBand />
      <SelectedWork projects={projects} />
      <Reels reels={reels} />
      <Campaigns campaigns={campaigns} />
      <Process />
      <Toolkit />
      <AboutBooking about={about} />
      <Footer />
    </main>
  );
}
