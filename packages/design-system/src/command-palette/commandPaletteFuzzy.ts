export interface FuzzyMatch {
  readonly matched: boolean;
  readonly score: number;
  readonly matchedIndexes: readonly number[];
}

const WORD_BOUNDARY_CHARACTERS = new Set([" ", "-", "_", "/", ".", ":"]);
const CONSECUTIVE_MATCH_BONUS = 5;
const WORD_BOUNDARY_BONUS = 3;
const BASE_MATCH_REWARD = 1;
const LATER_POSITION_PENALTY = 0.1;

export function fuzzyMatch(query: string, text: string): FuzzyMatch {
  const normalizedQuery = query.toLowerCase();
  if (normalizedQuery.length === 0) {
    return { matched: true, score: 0, matchedIndexes: [] };
  }
  const normalizedText = text.toLowerCase();
  const matchedIndexes: number[] = [];
  let score = 0;
  let queryIndex = 0;
  let previousMatchIndex = -1;
  for (
    let textIndex = 0;
    textIndex < normalizedText.length && queryIndex < normalizedQuery.length;
    textIndex += 1
  ) {
    if (normalizedText[textIndex] !== normalizedQuery[queryIndex]) {
      continue;
    }
    matchedIndexes.push(textIndex);
    score += BASE_MATCH_REWARD;
    if (previousMatchIndex === textIndex - 1) {
      score += CONSECUTIVE_MATCH_BONUS;
    }
    if (isWordBoundary(normalizedText, textIndex)) {
      score += WORD_BOUNDARY_BONUS;
    }
    score -= textIndex * LATER_POSITION_PENALTY;
    previousMatchIndex = textIndex;
    queryIndex += 1;
  }
  if (queryIndex < normalizedQuery.length) {
    return { matched: false, score: 0, matchedIndexes: [] };
  }
  return { matched: true, score, matchedIndexes };
}

function isWordBoundary(text: string, index: number): boolean {
  if (index === 0) {
    return true;
  }
  const previousCharacter = text[index - 1];
  return (
    previousCharacter !== undefined &&
    WORD_BOUNDARY_CHARACTERS.has(previousCharacter)
  );
}

export function rankByFuzzy<Item>(
  query: string,
  items: readonly Item[],
  toText: (item: Item) => string,
): Item[] {
  return items
    .map((item, index) => ({
      item,
      index,
      match: fuzzyMatch(query, toText(item)),
    }))
    .filter((entry) => entry.match.matched)
    .sort(
      (left, right) =>
        right.match.score - left.match.score || left.index - right.index,
    )
    .map((entry) => entry.item);
}
