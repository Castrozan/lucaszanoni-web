import { useEffect, useRef, useState } from "react";

const scrambleGlyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>#*";

function randomGlyph(): string {
  const glyphIndex = Math.floor(Math.random() * scrambleGlyphs.length);
  return scrambleGlyphs.charAt(glyphIndex);
}

function scrambleTo(finalText: string, revealedCount: number): string {
  let output = "";
  for (let index = 0; index < finalText.length; index += 1) {
    const finalChar = finalText.charAt(index);
    if (index < revealedCount || finalChar === " ") {
      output += finalChar;
    } else {
      output += randomGlyph();
    }
  }
  return output;
}

export function useCharacterDecode(
  finalText: string,
  skipAnimation: boolean,
  stepDurationInMs = 45,
): string {
  const [displayedText, setDisplayedText] = useState(
    skipAnimation ? finalText : "",
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (skipAnimation) {
      setDisplayedText(finalText);
      return;
    }
    let revealedCount = 0;
    intervalRef.current = setInterval(() => {
      revealedCount += 1;
      setDisplayedText(scrambleTo(finalText, revealedCount));
      if (revealedCount >= finalText.length && intervalRef.current) {
        clearInterval(intervalRef.current);
        setDisplayedText(finalText);
      }
    }, stepDurationInMs);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [finalText, skipAnimation, stepDurationInMs]);

  return displayedText;
}
