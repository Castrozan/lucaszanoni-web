import { ThemeProvider } from "@platform/design-system";
import { LandingPage } from "./landing/LandingPage";

export function ShellApp() {
  return (
    <ThemeProvider>
      <LandingPage />
    </ThemeProvider>
  );
}
