import { LandingHeader } from "./LandingHeader";
import { HeroSection } from "./HeroSection";
import { SectionsGrid } from "./SectionsGrid";
import { FeaturePreview } from "./FeaturePreview";
import { AboutAtriumSection } from "./AboutAtriumSection";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div id="top" className="bg-background">
      <LandingHeader />
      <main className="mx-auto max-w-[1400px] px-6 md:px-12">
        <HeroSection />
        <SectionsGrid />
        <FeaturePreview />
        <AboutAtriumSection />
        <LandingFooter />
      </main>
    </div>
  );
}
