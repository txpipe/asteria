import { create } from 'zustand';

import { decodeHexAddress } from '~/utils/cardano';

export type WalletDetails = {
  api: CardanoWalletAPI | null;
  info: CardanoWalletInfo | null;
  changeAddress: string | null;
};

export type WalletAction = {
  update: (api: WalletDetails['api'], info: WalletDetails['info']) => void;
};

export const useWallet = create<WalletDetails & WalletAction>((set) => ({
  api: null,
  info: null,
  changeAddress: null,

  update: async (api: WalletDetails['api'], info: WalletDetails['info']) => {
    if (!api) {
      return set({
        api: null,
        info: null,
        changeAddress: null,
      });
    }

    return set({
      api,
      info,
      changeAddress: await api
        ?.getChangeAddress()
        .then(decodeHexAddress)
        .catch(() => null),
    });
  },
}));
