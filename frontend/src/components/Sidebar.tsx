'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar: React.FunctionComponent = () => (

  <div className="flex-initial basis-1/4 p-4">

    <div className="h-full rounded-xl p-8 bg-[#1B1A1A]">

      <p className="font-dmsans-regular text-sm text-[#757575] mb-4">
        DOCS
      </p>

      <button className="w-full py-3 px-4 rounded-lg text-lg text-left font-dmsans-regular text-black bg-[#07F3E6]">
        How to play
      </button>

    </div>

  </div>
  
);

export default Sidebar;