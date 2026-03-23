import { calculateSplit, getSubtotal, getUnassignedItems } from '../lib/calculateSplit';
import type { Item, Participant } from '../lib/types';

const burger: Item = { id: 'i1', name: 'Burger', quantity: 1, price: 12.00, confidence: 1 };
const fries: Item  = { id: 'i2', name: 'Fries',  quantity: 1, price: 4.00,  confidence: 1 };
const alice: Participant = { id: 'p1', name: 'Alice' };
const bob:   Participant = { id: 'p2', name: 'Bob' };

describe('getSubtotal', () => {
  it('sums all item prices', () => {
    expect(getSubtotal([burger, fries])).toBe(16.00);
  });
  it('returns 0 for empty list', () => {
    expect(getSubtotal([])).toBe(0);
  });
});

describe('getUnassignedItems', () => {
  it('returns items with no assignees', () => {
    const assigned = { p1: new Set(['i1']) };
    expect(getUnassignedItems([burger, fries], assigned)).toEqual([fries]);
  });
  it('returns empty array when all assigned', () => {
    const assigned = { p1: new Set(['i1', 'i2']) };
    expect(getUnassignedItems([burger, fries], assigned)).toEqual([]);
  });
});

describe('calculateSplit', () => {
  it('assigns full price when only one person has an item', () => {
    const assigned = { p1: new Set(['i1']), p2: new Set(['i2']) };
    const result = calculateSplit([burger, fries], [alice, bob], assigned, 0, 0);
    expect(result.find(r => r.participant.id === 'p1')!.subtotal).toBeCloseTo(12.00);
    expect(result.find(r => r.participant.id === 'p2')!.subtotal).toBeCloseTo(4.00);
  });

  it('splits shared item evenly between two people', () => {
    const assigned = { p1: new Set(['i1']), p2: new Set(['i1']) };
    const result = calculateSplit([burger], [alice, bob], assigned, 0, 0);
    expect(result.find(r => r.participant.id === 'p1')!.subtotal).toBeCloseTo(6.00);
    expect(result.find(r => r.participant.id === 'p2')!.subtotal).toBeCloseTo(6.00);
  });

  it('distributes tax proportionally', () => {
    const assigned = { p1: new Set(['i1']), p2: new Set(['i2']) };
    const result = calculateSplit([burger, fries], [alice, bob], assigned, 4.00, 0);
    expect(result.find(r => r.participant.id === 'p1')!.tax).toBeCloseTo(3.00);
    expect(result.find(r => r.participant.id === 'p2')!.tax).toBeCloseTo(1.00);
  });

  it('distributes tip proportionally', () => {
    const assigned = { p1: new Set(['i1']), p2: new Set(['i2']) };
    const result = calculateSplit([burger, fries], [alice, bob], assigned, 0, 3.20);
    expect(result.find(r => r.participant.id === 'p1')!.tip).toBeCloseTo(2.40);
    expect(result.find(r => r.participant.id === 'p2')!.tip).toBeCloseTo(0.80);
  });

  it('applies penny correction so totals sum to receipt total', () => {
    const steak: Item = { id: 'i3', name: 'Steak', quantity: 1, price: 10.00, confidence: 1 };
    const items = [steak];
    const assigned = { p1: new Set(['i3']), p2: new Set(['i3']), p3: new Set(['i3']) };
    const charlie: Participant = { id: 'p3', name: 'Charlie' };
    const result = calculateSplit(items, [alice, bob, charlie], assigned, 0, 0);
    const grandTotal = result.reduce((sum, r) => sum + r.total, 0);
    expect(Math.round(grandTotal * 100) / 100).toBe(10.00);
  });

  it('total per person equals subtotal + tax + tip', () => {
    const assigned = { p1: new Set(['i1']), p2: new Set(['i2']) };
    const result = calculateSplit([burger, fries], [alice, bob], assigned, 1.60, 2.40);
    result.forEach(r => {
      expect(r.total).toBeCloseTo(r.subtotal + r.tax + r.tip, 5);
    });
  });
});
