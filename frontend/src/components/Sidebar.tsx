"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Item = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();

  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`block w-full py-3 px-4 rounded-lg text-lg text-left font-dmsans-regular ${
        active ? "bg-[#07F3E6] text-black" : "text-gray-400"
      }`}
    >
      {children}
    </Link>
  );
};

const Sidebar: React.FunctionComponent = () => {
  return (
    <div className="flex-initial basis-1/4 p-4">
      <div className="h-full rounded-xl p-8 bg-[#1B1A1A]">
        <p className="font-dmsans-regular text-sm text-[#757575] mb-3">
          INTRODUCTION
        </p>

        <Item href="/how-to-play">Introduction</Item>
        <Item href="/how-to-play/gameplay">Gameplay</Item>
        <Item href="/how-to-play/glossary">Glossary</Item>

        <p className="font-dmsans-regular text-sm text-[#757575] mb-3 mt-8">
          GUIDES
        </p>

        <Item href="/how-to-play/build-ship">Build Ship</Item>
        <Item href="/how-to-play/move-ship">Move Ship</Item>
        <Item href="/how-to-play/gather-fuel">Gather Fuel</Item>
        <Item href="/how-to-play/mine-asteria">Mine Asteria</Item>
      </div>
    </div>
  );
};

export default Sidebar;
