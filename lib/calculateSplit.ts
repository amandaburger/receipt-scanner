import type { Item, Participant } from './types';

export interface PersonResult {
  participant: Participant;
  items: Array<{ item: Item; fraction: number; amount: number }>;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}

export function getSubtotal(items: Item[]): number {
  return items.reduce((sum, i) => sum + i.price, 0);
}

export function getUnassignedItems(
  items: Item[],
  assigned: Record<string, Set<string>>
): Item[] {
  const assignedItemIds = new Set(
    Object.values(assigned).flatMap((s) => Array.from(s))
  );
  return items.filter((i) => !assignedItemIds.has(i.id));
}

export function calculateSplit(
  items: Item[],
  participants: Participant[],
  assigned: Record<string, Set<string>>,
  totalTax: number,
  totalTip: number
): PersonResult[] {
  const totalSubtotal = getSubtotal(items);
  if (totalSubtotal === 0) return participants.map((p) => ({
    participant: p, items: [], subtotal: 0, tax: 0, tip: 0, total: 0,
  }));

  const results: PersonResult[] = participants.map((p) => {
    const myItemIds = assigned[p.id] ?? new Set();
    const myItems = items
      .filter((i) => myItemIds.has(i.id))
      .map((i) => {
        const assignedCount = Object.values(assigned).filter((s) => s.has(i.id)).length;
        const fraction = 1 / assignedCount;
        return { item: i, fraction, amount: i.price * fraction };
      });

    const subtotal = myItems.reduce((sum, x) => sum + x.amount, 0);
    const ratio = subtotal / totalSubtotal;
    const tax = totalTax * ratio;
    const tip = totalTip * ratio;

    return { participant: p, items: myItems, subtotal, tax, tip, total: subtotal + tax + tip };
  });

  // Round all totals to cents first
  for (const r of results) {
    r.total = Math.round(r.total * 100) / 100;
  }

  // Penny correction: apply delta to person with largest subtotal
  const receiptTotal = Math.round((totalSubtotal + totalTax + totalTip) * 100) / 100;
  const calculatedTotal = results.reduce((sum, r) => sum + r.total, 0);
  const delta = Math.round((receiptTotal - calculatedTotal) * 100) / 100;

  if (delta !== 0) {
    const richest = results.reduce((a, b) => (a.subtotal >= b.subtotal ? a : b));
    richest.total = Math.round((richest.total + delta) * 100) / 100;
  }

  return results;
}
