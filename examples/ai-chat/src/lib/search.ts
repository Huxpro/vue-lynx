function isSubsequence(text: string, query: string): boolean {
  let queryIndex = 0;
  for (const char of text) {
    if (char === query[queryIndex]) queryIndex++;
    if (queryIndex === query.length) return true;
  }
  return query.length === 0;
}

/** Case-insensitive, word-aware subsequence matching for the chat palette. */
export function fuzzyMatch(text: string, query: string): boolean {
  const candidate = text.toLowerCase();
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => isSubsequence(candidate, word));
}
