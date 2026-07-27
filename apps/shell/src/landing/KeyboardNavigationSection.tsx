import {
  DEFAULT_LEADER_BINDING,
  formatBindingForDisplay,
  useKeybindRegistry,
} from "@platform/design-system";
import { KEYBOARD_SECTION_ID, LANDING_SECTIONS } from "./landingSections";

interface KeyboardMove {
  readonly binding: string;
  readonly title: string;
  readonly body: string;
}

const keyboardMoves: readonly KeyboardMove[] = [
  {
    binding: "Leader s",
    title: "JUMP TO ANY APP",
    body: "Opens the switcher over every app on the platform. Type a few letters, press Enter, and you are there. It is the only navigation you need to leave this page.",
  },
  {
    binding: `Leader 1-${LANDING_SECTIONS.length}`,
    title: "SWITCH SECTION",
    body: "The numbered entries in the status bar are the sections of the page you are on right now. Press a number, land on that section. They stay in sync as you scroll.",
  },
  {
    binding: "?",
    title: "SEE EVERY SHORTCUT",
    body: "Opens the full keymap. Every binding is rebindable there, including the leader key itself, and your choices persist in this browser.",
  },
];

export function KeyboardNavigationSection() {
  const leaderBinding = useKeybindRegistry()?.leader ?? DEFAULT_LEADER_BINDING;
  return (
    <section id={KEYBOARD_SECTION_ID} className="border-t border-border py-20">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 font-grotesk text-[clamp(28px,6vw,64px)] font-bold tracking-[-0.5px] text-foreground">
            DRIVEN BY THE KEYBOARD
          </h2>
          <p className="m-0 max-w-[44rem] font-mono text-[13px] leading-[1.6] tracking-[0.5px] text-muted-foreground">
            This site is navigated the way you navigate tmux. A status bar is
            pinned to the bottom of every page, a leader key arms the next
            keystroke, and every destination has a number. The mouse is
            optional.
          </p>
        </div>
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          NAVIGATION
        </span>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {keyboardMoves.map((move) => (
          <div
            key={move.title}
            className="flex flex-col gap-4 border border-border bg-surface p-7"
          >
            <kbd className="w-fit border border-primary px-2.5 py-1 font-mono text-[12px] tracking-[1px] text-primary">
              {formatBindingForDisplay(move.binding, leaderBinding)}
            </kbd>
            <h3 className="m-0 font-grotesk text-[20px] font-bold tracking-[-0.3px] text-foreground">
              {move.title}
            </h3>
            <p className="m-0 font-mono text-[13px] leading-[1.6] tracking-[0.5px] text-muted-foreground">
              {move.body}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-6 mb-0 max-w-[60rem] border border-border/60 bg-surface px-5 py-4 font-mono text-[12px] leading-[1.7] tracking-[0.5px] text-text-faint">
        These chords reach the page only if nothing upstream swallows them. For
        the intended experience, turn off browser shortcuts and keyboard
        extensions such as Vimium on this site, or open the keymap with ? and
        rebind whatever collides.
      </p>
    </section>
  );
}
