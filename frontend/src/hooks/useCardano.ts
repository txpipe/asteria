import { useCallback, useEffect, useState } from 'react';

// Store
import { useWallet } from '@/stores/wallet';

interface WalletInfo {
  key: string;
  name: string;
  enabled: boolean;
  icon: string | null;
}

async function fetchWallets(): Promise<[WalletInfo[], CardanoWalletAPI | null, CardanoWalletInfo | null]> {
  const wallets: WalletInfo[] = [];
  let currentWallet: CardanoWalletAPI | null = null;
  let walletInfo: CardanoWalletInfo | null = null;
  if (!window.cardano) {
    return [wallets, currentWallet, walletInfo];
  }

  const keys = Object.keys(window.cardano);
  const lastWallet = localStorage.getItem('aj-active-wallet');

  for (const key of keys) {
    const wallet = window.cardano[key];
    const enabled = await wallet.isEnabled();

    wallets.push({
      key,
      name: wallet.name ?? key,
      enabled,
      icon: wallet.icon ?? null,
    });

    if (lastWallet === key) {
      try {
        currentWallet = await wallet.enable();
        walletInfo = wallet;
        localStorage.setItem('aj-active-wallet', key);
      } catch {
        localStorage.removeItem('aj-active-wallet');
        currentWallet = null;
      }
    }
  }

  return [wallets, currentWallet, walletInfo];
}

function connectToWallet(walletKey: string): Promise<[CardanoWalletAPI, CardanoWalletInfo]> {
  const wallet = window.cardano?.[walletKey];
  if (!wallet) {
    return Promise.reject(new Error(`Wallet with key ${walletKey} not found`));
  }

  return wallet.enable().then((enabledWallet) => {
    localStorage.setItem('aj-active-wallet', walletKey);
    return [enabledWallet, wallet];
  });
}

export function useCardano() {
  const wallet = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [walletList, setWalletList] = useState<WalletInfo[]>([]);

  useEffect(() => {
    setLoading(true);
    fetchWallets()
      .then(async ([wallets, currentWallet, walletInfo]) => {
        setWalletList(wallets);
        wallet?.update(currentWallet, walletInfo);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [wallet?.update]);

  const connectToWalletHandler = useCallback(
    async (walletKey: string) => {
      setLoading(true);
      try {
        const [connectedWallet, walletInfo] = await connectToWallet(walletKey);
        wallet?.update(connectedWallet, walletInfo);
        setError(null);
      } catch (err) {
        // biome-ignore lint/suspicious/noExplicitAny: allow any
        setError((err as unknown as any).message);
      } finally {
        setLoading(false);
      }
    },
    [wallet?.update],
  );

  return {
    loading,
    walletList,
    isConnected: !!wallet.api,
    connectToWallet: connectToWalletHandler,
    error,
    walletDetails: wallet.api
      ? {
          api: wallet.api,
          info: wallet.info,
          changeAddress: wallet.changeAddress,
        }
      : null,
  };
}
