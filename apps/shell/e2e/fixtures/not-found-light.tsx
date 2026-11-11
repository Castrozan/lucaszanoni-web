import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { KeybindProvider, ThemeProvider } from "@platform/design-system";
import "@fontsource-variable/space-grotesk";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/700.css";
import { ShellRoutes } from "../../src/ShellRoutes";
import "../../src/styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider initialThemeName="light">
    <KeybindProvider>
      <MemoryRouter initialEntries={["/lost"]}>
        <ShellRoutes />
      </MemoryRouter>
    </KeybindProvider>
  </ThemeProvider>,
);
