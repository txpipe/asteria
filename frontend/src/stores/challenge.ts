import { create } from 'zustand';

export interface Challenge {
  label: string;
  shipyardPolicyId: string;
  shipAddress: string;
  fuelAddress: string;
  asteriaAddress: string;
  network: string;
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
    label: 'New challenge',
    shipyardPolicyId: '06af6375746881387d42e09977ce826d49c4b1404ec14ca75aa4553b',
    shipAddress: 'addr_test1wqr27cm4w35gzwragtsfja7wsfk5n393gp8vzn98t2j92wclzmt4v',
    fuelAddress: 'addr_test1wrwy0q8xtcngksdxk7nxd8kxwxvssmha5kl62nyxk7dmuqsf3slrx',
    asteriaAddress: 'addr_test1wr44k7mvy2aznjn5qk69xa5gax0fsxmv4q8n9xv9040kqjs9kcchd',
    network: 'preview',
  }, {
    label: 'Builder fest workshop',
    shipyardPolicyId: 'ecb96725c35e957f96be46bc1873cc8ae5b134f1b00f457675700511',
    shipAddress: 'addr_test1wrktjee9cd0f2lukhertcxrnej9wtvf57xcq73tkw4cq2ygnz27xu',
    fuelAddress: 'addr_test1wr37gywvcn3284cuxy4jke2w7np75jfm9apej7ns8d7n5ws3ecjrt',
    asteriaAddress: 'addr_test1wzup673azpl4s09hckcxr496xpx6cghnhfhlj4ydsxwpf5qygteap',
    network: 'preview',
  }],
  current: () => get().challenges[get().selected],
  select: (index: number) => set(() => ({ selected: index })),
}));
