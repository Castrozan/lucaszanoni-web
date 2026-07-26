import { LandingHeader } from "./LandingHeader";
import { HeroSection } from "./HeroSection";
import { KeyboardNavigationSection } from "./KeyboardNavigationSection";
import { CockpitSection } from "./CockpitSection";
import { FeaturePreview } from "./FeaturePreview";
import { AboutAtriumSection } from "./AboutAtriumSection";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
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
    </div>
  );
}
