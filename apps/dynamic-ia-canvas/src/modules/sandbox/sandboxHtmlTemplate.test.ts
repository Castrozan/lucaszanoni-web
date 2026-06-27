import { describe, expect, it } from "vitest";
import { buildSandboxHtmlDocument } from "./sandboxHtmlTemplate";

describe("buildSandboxHtmlDocument", () => {
  it("produces valid HTML with the component code embedded", () => {
    const jsxCode = "function App() { return <div>Hello</div>; }";
    const htmlDocument = buildSandboxHtmlDocument(jsxCode);

    expect(htmlDocument).toContain("<!DOCTYPE html>");
    expect(htmlDocument).toContain("function App()");
    expect(htmlDocument).toContain("ReactDOM.createRoot");
  });

  it("includes Tailwind v4 browser CDN script", () => {
    const htmlDocument = buildSandboxHtmlDocument("function App() {}");

    expect(htmlDocument).toContain("@tailwindcss/browser@4");
  });

  it("includes React and ReactDOM CDN scripts", () => {
    const htmlDocument = buildSandboxHtmlDocument("function App() {}");

    expect(htmlDocument).toContain("react@18/umd/react.production.min.js");
    expect(htmlDocument).toContain(
      "react-dom@18/umd/react-dom.production.min.js",
    );
  });

  it("executes pre-transpiled code directly without Sucrase", () => {
    const htmlDocument = buildSandboxHtmlDocument("function App() {}");

    expect(htmlDocument).not.toContain("sucrase");
    expect(htmlDocument).not.toContain("Sucrase");
    expect(htmlDocument).toContain("new Function");
  });

  it("escapes backticks in component code", () => {
    const codeWithBackticks = "const x = `template ${literal}`";
    const htmlDocument = buildSandboxHtmlDocument(codeWithBackticks);

    expect(htmlDocument).not.toContain("const x = `template ${literal}`");
    expect(htmlDocument).toContain("\\`template");
  });

  it("sends postMessage on successful render", () => {
    const htmlDocument = buildSandboxHtmlDocument("function App() {}");

    expect(htmlDocument).toContain("sandbox-ready");
    expect(htmlDocument).toContain("window.parent.postMessage");
  });

  it("sends error postMessage on render failure", () => {
    const htmlDocument = buildSandboxHtmlDocument("function App() {}");

    expect(htmlDocument).toContain("sandbox-error");
  });
});
