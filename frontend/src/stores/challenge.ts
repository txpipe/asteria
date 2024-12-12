import { create } from 'zustand';

export interface Challenge {
  label: string;
  shipyardPolicyId: string;
  fuelPolicyId: string;
  shipAddress: string;
  fuelAddress: string;
  asteriaAddress: string;
  network: string;
  explorerUrl: string;
}

export interface ChallengeStoreState {
  selected: number;
  challenges: Challenge[];
  select: (index: number) => void;
  current: () => Challenge;
}

export const useChallengeStore = create<ChallengeStoreState>((set, get) => ({
  selected: 0,
  challenges: [{
    label: 'Preview Challenge',
    shipyardPolicyId: 'f9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20',
    fuelPolicyId: 'fc8ad4f84181b85dc04f7b8c2984b129284c4e272ef45cd6440575fd4655454c',
    shipAddress: 'addr_test1wru5jl7xf6rufkjwcmft6x5rnd40zznhcyyp0km3gwkr6gq6sxzm6',
    fuelAddress: 'addr_test1wr7g448cgxqmshwqfaacc2vyky5jsnzwyuh0ghxkgszhtlgzrxj63',
    asteriaAddress: 'addr_test1wqdsuy97njefz53rkhd4v6a2kuqk0md5mrn996ygwekrdyq369wjg',
    network: 'preview',
    explorerUrl: 'https://preview.cexplorer.io/tx/',
  }],
  current: () => get().challenges[get().selected],
  select: (index: number) => set(() => ({ selected: index })),
}));
