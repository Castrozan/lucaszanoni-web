import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { WorkspacePage } from "../src/WorkspacePage";
import { createFakeStorage } from "./support/fake-web-storage";

afterEach(cleanup);

async function openDomain(label: string) {
  fireEvent.change(screen.getByLabelText(/new work domain/i), {
    target: { value: label },
  });
  fireEvent.click(screen.getByRole("button", { name: /open domain/i }));
  return screen.findByRole("button", { name: label });
}

describe("WorkspacePage", () => {
  it("shows an empty state before any work domain exists", () => {
    render(<WorkspacePage storage={createFakeStorage()} />);
    expect(screen.getByText(/no work domains yet/i)).toBeDefined();
  });

  it("opens a work-domain session and focuses it", async () => {
    render(<WorkspacePage storage={createFakeStorage()} />);
    const tab = await openDomain("Platform");
    expect(tab.getAttribute("aria-current")).toBe("true");
  });

  it("opens an agent window inside the active domain", async () => {
    render(<WorkspacePage storage={createFakeStorage()} />);
    await openDomain("Platform");
    fireEvent.click(screen.getByRole("button", { name: /open agent/i }));
    const windows = await screen.findByRole("list", { name: /agent windows/i });
    expect(
      within(windows).getByRole("button", { name: "Claude" }),
    ).toBeDefined();
  });

  it("restores persisted work domains on remount", async () => {
    const storage = createFakeStorage();
    const first = render(<WorkspacePage storage={storage} />);
    await openDomain("Platform");
    first.unmount();
    render(<WorkspacePage storage={storage} />);
    expect(
      await screen.findByRole("button", { name: "Platform" }),
    ).toBeDefined();
  });
});
