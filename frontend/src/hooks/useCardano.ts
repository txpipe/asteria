import { useCallback, useEffect, useState } from 'react';
import { decodeHexAddress } from '@/utils/cardano';

interface WalletInfo {
  key: string;
  name: string;
  enabled: boolean;
  icon: string | null;
}

export interface ConnectedWallet {
  api: CardanoWalletAPI;
  info: CardanoWalletInfo;
  changeAddress: string | null;
};

async function fetchWallets(): Promise<[WalletInfo[], CardanoWalletAPI | null, CardanoWalletInfo | null]> {
  const wallets: WalletInfo[] = [];
  let currentWallet: CardanoWalletAPI | null = null;
  let walletInfo: CardanoWalletInfo | null = null;
  if (!window.cardano) {
    return [wallets, currentWallet, walletInfo];
  }

  const keys = Object.keys(window.cardano);

  for (const key of keys) {
    const wallet = window.cardano[key];
    const enabled = await wallet.isEnabled();

    wallets.push({
      key,
      name: wallet.name ?? key,
      enabled,
      icon: wallet.icon ?? null,
    });
  }

  return [wallets, currentWallet, walletInfo];
}

function connectToWallet(walletKey: string): Promise<[CardanoWalletAPI, CardanoWalletInfo]> {
  const wallet = window.cardano?.[walletKey];
  if (!wallet) {
    return Promise.reject(new Error(`Wallet with key ${walletKey} not found`));
  }
  return wallet.enable().then((enabledWallet) => {
    return [enabledWallet, wallet];
  });
}

export function useCardano() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [walletList, setWalletList] = useState<WalletInfo[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchWallets()
      .then(async ([wallets, currentWallet, walletInfo]) => {
        setWalletList(wallets);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const connectToWalletHandler = useCallback(async (walletKey: string) => {
    setLoading(true);
    try {
      const [connectedWallet, walletInfo] = await connectToWallet(walletKey);
      setError(null);
      setConnectedWallet({
        api: connectedWallet,
        info: walletInfo,
        changeAddress: await connectedWallet
          ?.getChangeAddress()
          .then(decodeHexAddress)
          .catch(() => null),
      });
    } catch (err) {
      // biome-ignore lint/suspicious/noExplicitAny: allow any
      setError((err as unknown as any).message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    error,
    loading,
    walletList,
    connectToWallet: connectToWalletHandler,
    isConnected: !!connectedWallet,
    walletDetails: connectedWallet
  };
}
