const CARD_NUMBER_REGEX = /[A-Z]{2,3}\s*-?\s*\d+\s*-?\s*\d+/gi;

export function extractCardNumbers(ocrText) {
  if (!ocrText) return [];
  const matches = ocrText.match(CARD_NUMBER_REGEX);
  if (!matches) return [];
  const normalized = matches.map(m => m.replace(/\s+/g, '').toUpperCase());
  return [...new Set(normalized)];
}
