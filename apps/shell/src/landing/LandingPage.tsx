import { LandingHeader } from "./LandingHeader";
import { HeroSection } from "./HeroSection";
import { KeyboardNavigationSection } from "./KeyboardNavigationSection";
import { CockpitSection } from "./CockpitSection";
import { FeaturePreview } from "./FeaturePreview";
import { AboutAtriumSection } from "./AboutAtriumSection";
import { LandingFooter } from "./LandingFooter";
import { LandingStatusBar } from "./LandingStatusBar";
import { LANDING_SECTION_IDS } from "./landingSections";
import { useScrollToHashSection } from "./useScrollToHashSection";

export function LandingPage() {
  useScrollToHashSection(LANDING_SECTION_IDS);
  return (
    <div id="top" className="bg-background">
      <LandingHeader />
      <main className="mx-auto max-w-[1400px] px-6 md:px-12">
        <HeroSection />
        <KeyboardNavigationSection />
        <CockpitSection />
        <FeaturePreview />
        <AboutAtriumSection />
      </main>
      <LandingFooter />
      <LandingStatusBar />
    </div>
  );
}
