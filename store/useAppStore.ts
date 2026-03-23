import { create } from 'zustand';
const nanoid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
import type { Item, Participant, CoverMap } from '../lib/types';

interface AppState {
  items: Item[];
  tax: number;
  tip: number;
  participants: Participant[];
  assigned: Record<string, Set<string>>; // assigned[participantId] = Set<itemId>
  covers: CoverMap;
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;

  setItems: (items: Item[]) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  setTax: (tax: number) => void;
  setTip: (tipDollars: number) => void;
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
  toggleAssignment: (participantId: string, itemId: string) => void;
  splitEvenly: () => void;
  setCover: (coveredId: string, covererId: string | null) => void;
  setStep: (step: AppState['currentStep']) => void;
  reset: () => void;
}

const initialState = {
  items: [],
  tax: 0,
  tip: 0,
  participants: [],
  assigned: {},
  covers: {},
  currentStep: 1 as const,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setItems: (items) => set({ items }),

  updateItem: (id, patch) =>
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),

  addItem: () =>
    set((s) => ({
      items: [...s.items, { id: nanoid(), name: '', quantity: 1, price: 0, confidence: 1 }],
    })),

  removeItem: (id) =>
    set((s) => {
      const items = s.items.filter((i) => i.id !== id);
      // Also remove from all assignments
      const assigned = { ...s.assigned };
      Object.keys(assigned).forEach((pid) => {
        const next = new Set(assigned[pid]);
        next.delete(id);
        assigned[pid] = next;
      });
      return { items, assigned };
    }),

  setTax: (tax) => set({ tax }),

  setTip: (tip) => set({ tip }),

  addParticipant: (name) =>
    set((s) => ({
      participants: [...s.participants, { id: nanoid(), name }],
    })),

  removeParticipant: (id) =>
    set((s) => {
      const participants = s.participants.filter((p) => p.id !== id);
      const assigned = { ...s.assigned };
      delete assigned[id];
      // Remove from covers
      const covers = { ...s.covers };
      Object.keys(covers).forEach((k) => {
        if (covers[k] === id || k === id) delete covers[k];
      });
      return { participants, assigned, covers };
    }),

  toggleAssignment: (participantId, itemId) =>
    set((s) => {
      const current = new Set(s.assigned[participantId] ?? []);
      if (current.has(itemId)) {
        current.delete(itemId);
      } else {
        current.add(itemId);
      }
      return { assigned: { ...s.assigned, [participantId]: current } };
    }),

  splitEvenly: () =>
    set((s) => {
      if (s.participants.length < 2) return s;
      const assigned: Record<string, Set<string>> = {};
      const allItemIds = s.items.map((i) => i.id);
      s.participants.forEach((p) => {
        assigned[p.id] = new Set(allItemIds);
      });
      return { assigned };
    }),

  setCover: (coveredId, covererId) =>
    set((s) => {
      const covers = { ...s.covers };
      if (covererId === null) {
        delete covers[coveredId];
      } else {
        covers[coveredId] = covererId;
      }
      return { covers };
    }),

  setStep: (step) => set({ currentStep: step }),

  reset: () => set({ ...initialState }),
}));
