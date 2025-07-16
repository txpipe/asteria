import { useEffect } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

// Hooks
import { useCardano } from '~/hooks/useCardano';

// Utils
import { reduceString } from '~/utils/string';

import type { WalletDetails } from '~/store/wallet';

interface Props {
  onWalletConnected?: (wallet: WalletDetails | null) => void;
}

export function ConnectWallet({ onWalletConnected }: Props) {
  const { walletList, isConnected, loading, connectToWallet, walletDetails } = useCardano();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Ignore onWalletConnected
  useEffect(() => {
    onWalletConnected?.(walletDetails);
  }, [walletDetails]);

  return (
    <Menu>
      <MenuButton
        className="flex flex-row gap-2 py-3 px-4 rounded-full items-center text-white text-sm border border-white/50 outline-none cursor-pointer disabled:cursor-not-allowed"
        disabled={loading || !!walletDetails}
      >
        {loading && (
          <span aria-disabled="true" className="flex items-center gap-2">
            Connecting
            <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full" />
          </span>
        )}
        {!loading && (
          <span>
            {isConnected && walletDetails ? (
              <span className="flex items-center gap-2">
                {walletDetails.info?.icon && (
                  <img
                    src={walletDetails.info.icon}
                    alt={`${walletDetails.info.name} icon`}
                    className="inline-block w-6 h-6"
                  />
                )}
                {reduceString(walletDetails.changeAddress || '', 12, 8) ||
                  walletDetails.info?.name ||
                  'Wallet connected'}
              </span>
            ) : (
              'Connect wallet'
            )}
          </span>
        )}
      </MenuButton>
      <MenuItems
        className="bg-black rounded-xl flex flex-col gap-2 text-white/90 mt-2 outline-none border border-white/50"
        anchor="bottom"
      >
        {loading && <MenuItem disabled>Loading...</MenuItem>}
        {!loading &&
          walletList.map((wallet) => (
            <MenuItem key={wallet.key}>
              <button
                type="button"
                className="flex items-center cursor-pointer min-w-20 px-4 py-2 hover:bg-white/10"
                onClick={() => connectToWallet(wallet.key)}
              >
                {wallet.icon && (
                  <img src={wallet.icon} alt={`${wallet.name} icon`} className="inline-block w-6 h-6 mr-2" />
                )}
                <span>{wallet.name}</span>
              </button>
            </MenuItem>
          ))}
      </MenuItems>
    </Menu>
  );
}
