import { create } from 'zustand';

export interface Challenge {
  label: string;
  policyId: string;
  network: string;
}

export interface ChallengeStoreState {
  selected: number|null;
  challenges: Challenge[];
  select: (index: number) => void;
  current: () => Challenge;
}

export const useChallengeStore = create<ChallengeStoreState>((set, get) => ({
  selected: null,
  challenges: [{
    label: 'Builder fest workshop',
    policyId: 'ecb96725c35e957f96be46bc1873cc8ae5b134f1b00f457675700511',
    network: 'preview',
  }],
  current: () => get().challenges[get().selected!],
  select: (index: number) => set(() => ({ selected: index })),
}));
