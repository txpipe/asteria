import clsx from 'clsx';
import { useEffect, useState } from 'react';

interface SectionsMenuProps {
  className?: string;
}

function MenuItem({ href, isActive, label }: { href: string; isActive: boolean; label: string }) {
  return (
    <li>
      <a
        href={href}
        className={clsx(
          "py-1 block transition-all duration-300",
          { 'pl-4 border-l-8 border-primary-50 text-primary-50': isActive },
          { 'pl-2': !isActive },
        )}
      >
        {label}
      </a>
    </li>
  );
}

export function SectionsMenu({ className }: SectionsMenuProps) {
  const [activeHash, setActiveHash] = useState('#create-ship');

  useEffect(() => {
    // Set initial hash
    setActiveHash(window.location.hash || '#create-ship');

    // Listen for hash changes
    const handleHashChange = () => {
      setActiveHash(window.location.hash || '#create-ship');
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <ul className={clsx('fixed right-2 top-1/2 -translate-y-1/2 z-1 space-y-4 min-w-40 bg-[#0A0A0A]/80 rounded-xl px-2 py-1', className)}>
      <MenuItem href="#create-ship" isActive={activeHash === '#create-ship'} label="CREATE SHIP" />
      <MenuItem href="#move-ship" isActive={activeHash === '#move-ship'} label="MOVE SHIP" />
      <MenuItem href="#gather-fuel" isActive={activeHash === '#gather-fuel'} label="GATHER FUEL" />
      <MenuItem href="#mine-tokens" isActive={activeHash === '#mine-tokens'} label="MINE TOKENS" />
      <MenuItem href="#mine-asteria" isActive={activeHash === '#mine-asteria'} label="MINE ASTERIA" />
      <MenuItem href="#quit-game" isActive={activeHash === '#quit-game'} label="QUIT GAME" />
    </ul>
  );
}