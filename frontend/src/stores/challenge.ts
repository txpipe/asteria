import { create } from 'zustand';

export interface Token {
  policyId: string;
  name: string;
  assetName: string;
  displayName: string;
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
}];

export const useChallengeStore = create<ChallengeStoreState>((set, get) => ({
  selected: 0,
  challenges: challenges,
  current: () => get().challenges[get().selected],
  select: (index: number) => set(() => ({ selected: index })),
}));
