import type { Item } from './types';

const nanoid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

interface ParseResult {
  items: Item[];
  tax: number;
  tip: number;
}

interface WordConfidence {
  text: string;
  confidence: number;
}

const SKIP_KEYWORDS = /^(subtotal|sub.total|tax|tip|total|amount|due|change|cash|card|balance|gratuity|thank|server|table|guests?|receipt|order)/i;
const PRICE_RE = /\$?(\d{1,3}(?:,\d{3})*\.\d{2})/;
const TAX_RE   = /tax/i;
const TIP_RE   = /tip|gratuity/i;

function getLineConfidence(line: string, words: WordConfidence[]): number {
  if (words.length === 0) return 1;
  const lineTokens = line.split(/\s+/).map(t => t.toLowerCase());
  const matches = words.filter(w => lineTokens.includes(w.text.toLowerCase()));
  if (matches.length === 0) return 1;
  return matches.reduce((sum, w) => sum + w.confidence, 0) / matches.length;
}

export function parseReceipt(text: string, words: WordConfidence[]): ParseResult {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items: Item[] = [];
  let tax = 0;
  let tip = 0;

  // Track the previous non-price line so we can handle receipts where
  // the item name and price appear on separate lines (common with Vision API).
  let prevNameLine = '';

  for (const line of lines) {
    const priceMatch = line.match(PRICE_RE);

    if (!priceMatch) {
      // Not a price line — store as a candidate name for the next price-only line.
      // Don't store SKIP_KEYWORDS lines as candidate names, but DO allow TAX/TIP
      // lines through so the split-line handler can match them.
      if (line.length >= 2) {
        prevNameLine = line;
      } else {
        prevNameLine = '';
      }
      continue;
    }

    const price = parseFloat(priceMatch[1].replace(',', ''));

    let namePart = line.replace(PRICE_RE, '').trim().replace(/\s+/g, ' ');

    // If the price was on its own line (no name), fall back to the previous line.
    if ((!namePart || namePart.length < 2) && prevNameLine) {
      namePart = prevNameLine;
    }
    prevNameLine = '';

    // Check tax/tip against the resolved name (handles split-line receipts).
    if (TAX_RE.test(namePart) || TAX_RE.test(line)) { tax = price; continue; }
    if (TIP_RE.test(namePart) || TIP_RE.test(line)) { tip = price; continue; }

    if (SKIP_KEYWORDS.test(namePart)) continue;
    if (!namePart || namePart.length < 2) continue;

    const confidence = getLineConfidence(line, words);

    items.push({
      id: nanoid(),
      name: namePart,
      quantity: 1,
      price,
      confidence,
    });
  }

  return { items, tax, tip };
}
