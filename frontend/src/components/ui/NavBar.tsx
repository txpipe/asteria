import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useChallengeStore } from '@/stores/challenge';

// Icons
import ChallengeIcon from '@/components/icons/ChallengeIcon';
import SwitchIcon from '@/components/icons/SwitchIcon';

// Tootips
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const NavBar: React.FunctionComponent = () => {
  const { current } = useChallengeStore();
  const pathname = usePathname() || '';
  const isActive = (route: string) => pathname.includes(route) || undefined;

  const challenge = current();
  
  return (
    <div className="sticky top-0 w-full px-14 py-[11.5px] flex flex-row items-center bg-[#171717] z-1">
      <div className="flex flex-row items-end flex-auto basis-1/4 gap-3">
        <Link href="/">
          <Image src="/images/logo.svg" alt="Asteria Logo" width={145} height={49} className="w-[145px] h-[49px]" />
        </Link>
        <span className="font-inter text-[#606060] pointer-events-none">
          By TxPipe
        </span>
      </div>
      <div className="flex flex-row items-center flex-initial">
        <Link href="/how-to-play" data-active={isActive('how-to-play')} className="font-mono py-2 px-4 rounded-full mx-4 text-[#F1E9D9] data-active:text-[#FFF75D]">
          How to play
        </Link>
        <span className="border-l border-l-solid border-l-[#F1E9D9] w-0 h-7 opacity-50" />
        <Link href="/explorer" data-active={isActive('explorer')} className="font-mono py-2 px-4 rounded-full mx-4 text-[#F1E9D9] data-active:text-[#FFF75D]">
          Explorer
        </Link>
        <span className="border-l border-l-solid border-l-[#F1E9D9] w-0 h-7 opacity-50" />
        <Link href="/leaderboard" data-active={isActive('leaderboard')} className="font-mono py-2 px-4 rounded-full mx-4 text-[#F1E9D9] data-active:text-[#FFF75D]">
          Leaderboard
        </Link>
      </div>
      <div className="flex flex-row justify-end items-center gap-2.5 flex-auto basis-1/4 text-base">
        <Link href="#" className="flex gap-2.5 items-center">
          <ChallengeIcon className="size-5" />
          <span className="text-[#F1E9D9] hover:text-primary-50">{challenge.label}</span>
        </Link>
        <span className="text-[#F1E9D9]/50">|</span>
        <Tooltip placement="bottom-end">
          <TooltipTrigger>
            <Link href="#" className="text-[#F1E9D9] opacity-50 hover:opacity-100">
              <SwitchIcon className="size-6" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>Change challenge</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export default NavBar;