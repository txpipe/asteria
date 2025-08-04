import Link from 'next/link';
import Image from 'next/image';

// Icon
import GamepadIcon from '@/components/icons/GamepadIcon';
import BotIcon from '@/components/icons/BotIcon';

export default function HeroSection() {
  return (
    <div className="min-h-[calc(100dvh-72px)] flex items-center overflow-x-hidden">
      <div className="relative pl-53 w-full">
        <Image
          src="/images/ship-vertical.svg"
          alt="Ship"
          width={318}
          height={342}
          className="-rotate-60 pointer-events-none absolute -right-10 -z-1 hidden xl:block"
        />
        <div className="max-w-[748px] text-[#F1E9D9]">
          <h1 className="text-5xl tracking-[0.5px] leading-16">
            A <span className="font-semibold">Cardano bot challenge</span> to showcase the capabilities of the <span className="font-semibold">eUTxO model.</span>
          </h1>
          <h2 className="mt-14 text-[22px]">
            Compete by coding smart bots that explore, strategize, and earn rewards in a persistent universe—powered by Cardano's eUTxO model.
          </h2>
          {/* <p className="mt-14 opacity-60">
            A competitive playground for developers to build autonomous bots—off-chain agents that interact directly with the Cardano blockchain. Each bot controls its own UTxOs, constrained by on-chain validators, and competes in a persistent universe for resources and rewards. Push the boundaries of decentralized automation and showcase your skills.
          </p> */}
          <div className="flex flex-row gap-8 items-center mt-8">
            <Link
              href="https://github.com/txpipe/asteria-starter-kit"
              className="btn btn-primary w-fit"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Build your own bot</span>
              <BotIcon />
            </Link>
            <Link href="/how-to-play" className="btn btn-primary-outline w-fit">
              <GamepadIcon />
              <span>How to play</span>
            </Link>
          </div>
        </div>

        {/* <Link href="/#" className="font-mono text-[#F1E9D9] text-base mt-8 block w-fit">
          Get started in GitHub
        </Link> */}
      </div>

    </div>
  )
}