const controlSequencePattern = new RegExp(
  [
    "\\x1b\\[[0-?]*[ -/]*[@-~]",
    "\\x1b\\][^\\x07\\x1b]*(?:\\x07|\\x1b\\\\)",
    "\\x1b[@-Z\\\\-_]",
    "\\x1b[ -/]*[0-~]",
    "[\\x00-\\x09\\x0b-\\x1f\\x7f]",
  ].join("|"),
  "g",
);

const alphanumericPattern = /[A-Za-z0-9]/;
const whitespaceRunPattern = /\s+/g;
const recentlySpokenLineLimit = 200;

export function stripTerminalControlSequences(text: string): string {
  return text.replace(controlSequencePattern, "");
}

export function extractSpeakableLines(text: string): string[] {
  return stripTerminalControlSequences(text)
    .split("\n")
    .map((line) => line.replace(whitespaceRunPattern, " ").trim())
    .filter((line) => line.length > 0 && alphanumericPattern.test(line));
}

export interface SpokenSessionOutputTracker {
  takeNewSpeakableLines(text: string): string[];
  reset(): void;
}

export function createSpokenSessionOutputTracker(): SpokenSessionOutputTracker {
  const recentlySpoken = new Set<string>();
  const recentlySpokenOrder: string[] = [];

  const remember = (line: string) => {
    recentlySpoken.add(line);
    recentlySpokenOrder.push(line);
    while (recentlySpokenOrder.length > recentlySpokenLineLimit) {
      const evicted = recentlySpokenOrder.shift();
      if (evicted !== undefined) {
        recentlySpoken.delete(evicted);
      }
    }
  };

  return {
    takeNewSpeakableLines(text: string): string[] {
      const fresh: string[] = [];
      for (const line of extractSpeakableLines(text)) {
        if (recentlySpoken.has(line)) {
          continue;
        }
        remember(line);
        fresh.push(line);
      }
      return fresh;
    },
    reset() {
      recentlySpoken.clear();
      recentlySpokenOrder.length = 0;
    },
  };
}
