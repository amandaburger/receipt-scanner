export interface Item {
  id: string;
  name: string;
  quantity: number;
  price: number;       // unit price
  confidence: number;  // 0–1 from Vision API; < 0.75 = highlight amber
}

export interface Participant {
  id: string;
  name: string;
}

// covers[coveredId] = covererId — display-only, not used in calculations
export type CoverMap = Record<string, string>;

export type TipMode = 'proportional' | 'even';
