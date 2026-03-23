import { parseReceipt } from '../lib/parseReceipt';

const sampleText = `
RESTAURANT NAME
123 Main St

Burger         12.99
Fries x2        4.50
Diet Coke       2.00

Subtotal       19.49
Tax             1.56
Tip             3.50
Total          24.55
`;

describe('parseReceipt', () => {
  it('extracts items with prices', () => {
    const result = parseReceipt(sampleText, []);
    const names = result.items.map(i => i.name.toLowerCase());
    expect(names.some(n => n.includes('burger'))).toBe(true);
    expect(names.some(n => n.includes('fries'))).toBe(true);
  });

  it('extracts tax', () => {
    const result = parseReceipt(sampleText, []);
    expect(result.tax).toBeCloseTo(1.56);
  });

  it('extracts tip', () => {
    const result = parseReceipt(sampleText, []);
    expect(result.tip).toBeCloseTo(3.50);
  });

  it('does not include subtotal/tax/tip/total lines as items', () => {
    const result = parseReceipt(sampleText, []);
    const names = result.items.map(i => i.name.toLowerCase());
    expect(names.every(n => !['subtotal','tax','tip','total'].includes(n))).toBe(true);
  });

  it('assigns low confidence to items matching low-confidence words', () => {
    const words = [{ text: 'Burger', confidence: 0.5 }];
    const result = parseReceipt(sampleText, words);
    const burger = result.items.find(i => i.name.toLowerCase().includes('burger'));
    expect(burger!.confidence).toBeLessThan(0.75);
  });

  it('handles empty text gracefully', () => {
    const result = parseReceipt('', []);
    expect(result.items).toEqual([]);
    expect(result.tax).toBe(0);
    expect(result.tip).toBe(0);
  });
});
