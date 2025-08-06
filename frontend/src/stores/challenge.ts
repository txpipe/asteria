import { create } from 'zustand';

export interface Token {
  policyId: string;
  assetName: string;
}

export interface Challenge {
  comingSoon?: boolean;
  label: string;
  slug: string;
  spacetimePolicyId: string;
  spacetimeAddress: string;
  pelletPolicyId: string;
  pelletAddress: string;
  asteriaAddress: string;
  network: string;
  explorerUrl: string;
  tokens: Token[];

  details: {
    day?: number;
    month?: string;
    reward?: number;
    image?: string;
    sponsors?: [string, string][]; // [imageSrc, altText][]
    moreSponsors?: number; // How many more sponsors we have
  };
}

export interface ChallengeStoreState {
  selected: number;
  challenges: Challenge[];
  select: (index: number) => void;
  current: () => Challenge;
}

export const challenges: Challenge[] = [{
  label: 'Preview Challenge 1',
  slug: 'preview-challenge-1',
  spacetimePolicyId: 'f9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20',
  spacetimeAddress: 'addr_test1wru5jl7xf6rufkjwcmft6x5rnd40zznhcyyp0km3gwkr6gq6sxzm6',
  pelletPolicyId: 'fc8ad4f84181b85dc04f7b8c2984b129284c4e272ef45cd6440575fd4655454c',
  pelletAddress: 'addr_test1wr7g448cgxqmshwqfaacc2vyky5jsnzwyuh0ghxkgszhtlgzrxj63',
  asteriaAddress: 'addr_test1wqdsuy97njefz53rkhd4v6a2kuqk0md5mrn996ygwekrdyq369wjg',
  network: 'preview',
  explorerUrl: 'https://preview.cexplorer.io/tx/',
  tokens: [],
  details: {
    reward: 150,
    image: '/images/challenge/first.png',
  },
},{
  label: 'Preview Challenge 2',
  slug: 'preview-challenge-2',
  spacetimePolicyId: 'b6c5e14f31af0c92515ce156625afc4749e30ceef178cfae1f929fff',
  spacetimeAddress: 'addr_test1wzmvtc20xxhseyj3tns4vcj6l3r5nccvamch3nawr7ffllcmwmxeq',
  pelletPolicyId: '98b1c97b219c102dd0e9ba014481272d6ec069ec3ff47c63e291f1b74655454c',
  pelletAddress: 'addr_test1wzvtrjtmyxwpqtwsaxaqz3ypyukkasrfasllglrru2glrdcsra05l',
  asteriaAddress: 'addr_test1wzck5pm45hsytdyz4v4f3cjpey68lrl7yedmdtx3q3f2dnqmww2hy',
  network: 'preview',
  explorerUrl: 'https://preview.cexplorer.io/tx/',
  tokens: [{
    assetName: 'tokena',
    policyId: '255d6456fa68e3d858d80e3168b0d76d57b6c4033c6234e2f0de8499746f6b656e41',
  },{
    assetName: 'tokenb',
    policyId: 'b7341c90d38390ae3a890435559184f01fac24f79df06fd5c02f7fe4746f6b656e42',
  },{
    assetName: 'indy',
    policyId: 'fa3eff2047fdf9293c5feef4dc85ce58097ea1c6da4845a35153518374494e4459',
  },{
    assetName: 'asd',
    policyId: '0d69753742e6e5fe5f545498708d61f3335adffd90686d41c8529a640014df10a49bfe0b8b0257a051d5cc7a16fb0881733d83188c978cdd0fbf1fdb',
  }],
  details: {
    reward: 150,
    image: '/images/challenge/second.png',
  },
},{
  comingSoon: true,
  label: 'Mainnet Challenge',
  slug: 'mainnet-challenge',
  spacetimePolicyId: 'Coming soon',
  spacetimeAddress: 'Coming soon',
  pelletPolicyId: 'Coming soon',
  pelletAddress: 'Coming soon',
  asteriaAddress: 'Coming soon',
  network: 'mainnet',
  explorerUrl: 'https://cexplorer.io/tx/',
  tokens: [],
  details: {
    day: 7,
    month: 'AGO',
    image: '/images/challenge/third.png',
    sponsors: [
      ['/images/challenge/sponsors/mainnet-challenge/asset17q7r59zlc3dgw0venc80pdv566q6yguw03f0d9.png', 'HOSKY'],
      ['/images/challenge/sponsors/mainnet-challenge/asset1znlnu4s2uv3ern2f52csz6s6pvr5rf6dj2uevx.png', 'VYFI'],
      ['/images/challenge/sponsors/mainnet-challenge/asset1m4u92ke6820pkk07m8qmmguye02ewr8g6tezr0.png', 'SUNDAE'],
    ],
    moreSponsors: 7,
  },
}];

export const useChallengeStore = create<ChallengeStoreState>((set, get) => ({
  selected: 0,
  challenges: challenges,
  current: () => get().challenges[get().selected],
  select: (index: number) => set(() => ({ selected: index })),
}));
