'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavBar: React.FunctionComponent = () => {
  const pathname = usePathname() || '';
  const isActive = (route: string): string => pathname.includes(route) ? 'text-[#FFF75D]' : 'text-white';

  return (
    <div className="w-full h-[64px] px-10 flex flex-row items-center">
      <div className="flex flex-auto">
        <div className="flex-none">
          <Link href="/">
            <img className="h-full w-auto mx-2" src="/logo.svg" />
          </Link>
        </div>
      </div>
      <div className="flex-initial">
        <Link href="/how-to-play">
          <button className={`font-monocraft-regular py-2 px-4 rounded-full text-md mr-6 ${isActive('how-to-play')}`}>
            How to play
          </button>
        </Link>
        <Link href="/leaderboard">
          <button className={`font-monocraft-regular py-2 px-4 rounded-full text-md mr-6 ${isActive('leaderboard')}`}>
            Leaderboard
          </button>
        </Link>
        <Link href="/map">
          <button className="font-monocraft-regular text-[#07F3E6] border border-[#07F3E6] bg-transparent py-2 px-4 rounded-full text-md mx-2">
            View map
          </button>
        </Link>
      </div>
    </div>
  );
}

export default NavBar;