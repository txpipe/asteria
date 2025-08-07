import { useEffect } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useCardano, type ConnectedWallet } from '@/hooks/useCardano';
import { ChevronDownIcon } from '@heroicons/react/16/solid';

interface Props {
  onWalletConnected?: (wallet: ConnectedWallet | null) => void;
}

export default function ConnectWallet({ onWalletConnected }: Props) {
  const { walletList, walletDetails, connectToWallet } = useCardano();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Ignore onWalletConnected
  useEffect(() => {
    onWalletConnected?.(walletDetails);
  }, [walletDetails]);

  return (
    <Menu>
      <MenuButton className="text-sm px-1 py-2 text-white/60 hover:text-[#07F3E6]">
        Select wallet
        <ChevronDownIcon className="inline mt-[-2px] ml-[2px] size-4" />
      </MenuButton>
      <MenuItems
        className="bg-black rounded-lg flex flex-col text-white/90 outline-none border border-white/50 z-10"
        anchor="bottom start"
      >
        {walletList.length === 0 && (
          <MenuItem disabled>
            <div className="px-4 py-2 text-sm text-white/50">No wallets detected</div>
          </MenuItem>
        )}
        {walletList.map((wallet) => (
          <MenuItem key={wallet.key}>
            <button
              type="button"
              className="flex items-center cursor-pointer min-w-32 px-4 py-4 hover:bg-white/10"
              onClick={() => connectToWallet(wallet.key)}
            >
              {wallet.icon && (
                <img src={wallet.icon} alt={`${wallet.name} icon`} className="inline-block w-6 h-6 mr-4" />
              )}
              <span>{wallet.name}</span>
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
