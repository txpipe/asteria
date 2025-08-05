'use client'

import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname() || '';

  if (pathname.includes('/how-to-play') || pathname.includes('/explorer')) {
    return null; // Do not render footer on specific pages
  }

  return (
    <footer className="container mx-auto pt-6 pb-8 border-t border-[#F1E9D9]/20 flex justify-between items-center">
      <div>
        <Image src="/images/logo-footer.svg" alt="Asteria Logo" width={168} height={56} />
        <div className="flex items-center w-fit mx-auto mt-[5px] gap-1.5">
          <Image src="/images/logo-txpipe.svg" alt="TxPipe Logo" width={15} height={10} />
          <span className="font-inter text-[10px] text-[#F1E9D9]/70">By TxPipe</span>
        </div>
      </div>

      <span className="text-[#F1E9D9]/40 text-[15px]">
        Copyright © 2025 TxPipe| All Rights Reserved
      </span>
    </footer>
  )
}