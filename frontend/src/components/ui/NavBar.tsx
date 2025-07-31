'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useChallengeStore } from '@/stores/challenge';

const NavBar: React.FunctionComponent = () => {
  const { challenges, selected, select } = useChallengeStore();
  const pathname = usePathname() || '';
  const isActive = (route: string) => pathname.includes(route) || undefined;

  const handleSelect = (event: React.FormEvent<HTMLSelectElement>) => {
    select(parseInt(event.currentTarget.value));
  }
  
  return (
    <div className="sticky top-0 w-full px-14 py-[11.5px] flex flex-row items-center bg-[#171717]">
      <div className="flex flex-row items-end flex-auto basis-1/4 gap-3">
        <Link href="/">
          <Image src="/logo.svg" alt="Asteria Logo" width={145} height={49} className="w-[145px] h-[49px]" />
        </Link>
        <span className="font-inter text-[#606060] pointer-events-none">
          By TxPipe
        </span>
      </div>
      <div className="flex flex-row items-center flex-initial">
        <Link href="/how-to-play" data-active={isActive('how-to-play')} className="font-monocraft py-2 px-4 rounded-full mx-4 text-[#F1E9D9] data-active:text-[#FFF75D]">
          How to play
        </Link>
        <span className="border-l border-l-solid border-l-[#F1E9D9] w-0 h-7 opacity-50" />
        <Link href="/explorer" data-active={isActive('explorer')} className="font-monocraft py-2 px-4 rounded-full mx-4 text-[#F1E9D9] data-active:text-[#FFF75D]">
          Explorer
        </Link>
        <span className="border-l border-l-solid border-l-[#F1E9D9] w-0 h-7 opacity-50" />
        <Link href="/leaderboard" data-active={isActive('leaderboard')} className="font-monocraft py-2 px-4 rounded-full mx-4 text-[#F1E9D9] data-active:text-[#FFF75D]">
          Leaderboard
        </Link>
      </div>
      <div className="flex flex-row justify-end flex-auto basis-1/4">
        <button
          className="border border-solid border-[#5B5B5B] bg-black py-3 px-4 rounded-full mx-2 flex flex-row items-center"
        >
          <img src="/challenge-icon.svg" className="w-6 h-6 mr-3 pointer-events-none" />
          <select
            value={selected}
            onChange={handleSelect}
            className="font-inter text-[#F1E9D9] bg-transparent focus:outline-hidden appearance-none text-left min-w-36"
          >
            { challenges.map((challenge, index) =>
              <option key={index} value={index}>
                { challenge.label }
              </option>
            )}
          </select>
          <img src="/chevron.svg" className="w-5 h-5 ml-3 pointer-events-none" />
        </button>
      </div>
    </div>
  );
}

export default NavBar;