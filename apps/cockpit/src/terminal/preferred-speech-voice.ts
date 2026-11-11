const naturalSpeechVoiceNamesInPriorityOrder = [
  "Samantha",
  "Ava",
  "Allison",
  "Serena",
  "Google US English",
  "Microsoft Aria",
  "Microsoft Jenny",
];

export function selectPreferredSpeechVoice(
  availableVoices: ReadonlyArray<SpeechSynthesisVoice>,
): SpeechSynthesisVoice | null {
  for (const preferredVoiceName of naturalSpeechVoiceNamesInPriorityOrder) {
    const lowerCasePreferredVoiceName = preferredVoiceName.toLowerCase();
    const matchingVoice = availableVoices.find((voice) =>
      voice.name.toLowerCase().includes(lowerCasePreferredVoiceName),
    );
    if (matchingVoice) {
      return matchingVoice;
    }
  }
  const englishUnitedStatesVoice = availableVoices.find(
    (voice) => voice.lang === "en-US",
  );
  if (englishUnitedStatesVoice) {
    return englishUnitedStatesVoice;
  }
  return (
    availableVoices.find((voice) =>
      voice.lang.toLowerCase().startsWith("en"),
    ) ?? null
  );
}
