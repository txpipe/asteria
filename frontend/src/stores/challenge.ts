import { create } from 'zustand';

export interface Token {
  policyId: string;
  name: string;
  assetName: string;
  displayName: string;
}

export interface Challenge {
  apiUrl: string;

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
    reward?: string;
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
  apiUrl: process.env.MAINNET_API_URL!!,
  label: 'Mainnet Challenge',
  slug: 'mainnet-challenge',
  spacetimePolicyId: '0291ae7aebaf064b785542093c2b13169effb34462301e68d4b44f43',
  spacetimeAddress: 'addr1wypfrtn6awhsvjmc24pqj0ptzvtfalang33rq8ng6j6y7scnlkytx',
  pelletPolicyId: '3babcffc6102ec25ced40e1a24fba20371925c46f0299b2b9456360e4655454c',
  pelletAddress: 'addr1wya6hnluvypwcfww6s8p5f8m5gphryjugmcznxetj3trvrsc307jj',
  asteriaAddress: 'addr1w824uvev63kj40lzfhaq2kxzmmwsz9xsqsjr2t4cq74vzdcdw8c77',
  network: 'mainnet',
  explorerUrl: 'https://cexplorer.io/tx/',
  tokens: [{
    name: 'iagon',
    displayName: 'IAGON',
    assetName: '$IAG',
    policyId: '5d16cc1a177b5d9ba9cfa9793b07e60f1fb70fea1f8aef064415d114494147',
  // },{
  //   name: 'sundae',
  //   displayName: 'SundaeSwap',
  //   assetName: '$SUNDAE',
  //   policyId: '9a9693a9a37912a5097918f97918d15240c92ab729a0b7c4aa144d7753554e444145',
  },{
    name: 'hosky',
    displayName: 'Hosky',
    assetName: '$HOSKY',
    policyId: 'a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235484f534b59',
  // },{
  //   name: 'metera',
  //   displayName: 'Metera',
  //   assetName: '$METERA',
  //   policyId: '8ebb4f0eb39543cdab83eb35f5f194798817eaaa3061872b4101efdb0014df104d4554455241',
  },{
    name: 'indigo',
    displayName: 'Indigo DAO Token',
    assetName: '$INDY',
    policyId: '533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a0494e4459',
  },{
    name: 'minswap',
    displayName: 'Minswap',
    assetName: '$MIN',
    policyId: '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e',
  // },{
  //   name: 'stuff',
  //   displayName: 'Stuff',
  //   assetName: '$STUFF',
  //   policyId: '51a5e236c4de3af2b8020442e2a26f454fda3b04cb621c1294a0ef34424f4f4b',
  },{
    name: 'fluid',
    displayName: 'FluidTokens',
    assetName: '$FLDT',
    policyId: '577f0b1342f8f8f4aed3388b80a8535812950c7a892495c0ecdf0f1e0014df10464c4454',
  },{
    name: 'vyfi',
    displayName: 'VyFinance',
    assetName: '$VYFI',
    policyId: '804f5544c1962a40546827cab750a88404dc7108c0f588b72964754f56594649',
  },{
    name: 'white-trash-warlock',
    displayName: 'White Trash Warlock #388',
    assetName: 'NFT',
    policyId: 'c5ec84e79e58cd5d7203d38738848991ddce76efad59ef701b6f4cf4576869746554726173685761726c6f636b333838',
  },{
    name: 'silver',
    displayName: 'SILVER #1119',
    assetName: 'NFT',
    policyId: 'a0bf068fda05eda2d7cd00e51cdc599059449294101e7211a12195f953494c56455231313139',
  },{
    name: 'collecting-the-simpsons',
    displayName: 'Collecting the Simpsons #074',
    assetName: 'NFT',
    policyId: '11fb60cbc42fc2012327d82309fe0c5cb39e5b2e83a83a9272d2faad436f6c6c656374696e6753696d70736f6e73303734',
  },{
    name: 'about-stuff',
    displayName: 'About Stuff E0 | #9361',
    assetName: 'NFT',
    policyId: 'b4df23876be7207fe26e0cddfb08d6a73ff83754075efafb5344623441533039333631',
  },{
    name: 'gutenberg-bible',
    displayName: 'Gutenberg Bible #2603',
    assetName: 'NFT',
    policyId: '477cec772adb1466b301fb8161f505aa66ed1ee8d69d3e7984256a43477574656e62657267204269626c65202332363033',
  }],
  details: {
    reward: '10K',
    image: '/images/challenge/first.png',
    sponsors: [
      ['/images/challenge/sponsors/mainnet-challenge/sundae.png', 'SUNDAE'],
      ['/images/challenge/sponsors/mainnet-challenge/minswap.png', 'MINSWAP'],
      ['/images/challenge/sponsors/mainnet-challenge/hosky.png', 'HOSKY'],
    ],
    moreSponsors: 7,
  },
},{
  apiUrl: process.env.PREVIEW_API_URL!!,
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
    reward: '150',
    image: '/images/challenge/second.png',
  },
},{
  apiUrl: process.env.PREVIEW_API_URL!!,
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
    name: 'iagon',
    displayName: 'IAGON',
    assetName: '$IAG',
    policyId: '255d6456fa68e3d858d80e3168b0d76d57b6c4033c6234e2f0de8499746f6b656e41',
  },{
    name: 'sundae',
    displayName: 'SundaeSwap',
    assetName: '$SUNDAE',
    policyId: 'b7341c90d38390ae3a890435559184f01fac24f79df06fd5c02f7fe4746f6b656e42',
  },{
    name: 'hosky',
    displayName: 'Hosky',
    assetName: '$HOSKY',
    policyId: 'fa3eff2047fdf9293c5feef4dc85ce58097ea1c6da4845a35153518374494e4459',
  },{
    name: 'metera',
    displayName: 'Metera',
    assetName: '$METERA',
    policyId: '0d69753742e6e5fe5f545498708d61f3335adffd90686d41c8529a640014df10a49bfe0b8b0257a051d5cc7a16fb0881733d83188c978cdd0fbf1fdb',
  }],
  details: {
    reward: '150',
    image: '/images/challenge/third.png',
  },
}];

export const useChallengeStore = create<ChallengeStoreState>((set, get) => ({
  selected: 0,
  challenges: challenges,
  current: () => get().challenges[get().selected],
  select: (index: number) => set(() => ({ selected: index })),
}));
