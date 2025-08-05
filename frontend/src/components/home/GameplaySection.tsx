import type { PropsWithChildren } from 'react';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface GameplayCardProps extends PropsWithChildren {
  className?: string;
  image: string;
  title: string;
}

function GameplayCard({ children, title, image }: GameplayCardProps) {
  return (
    <div className="relative col-span-2 bg-[#18181B]/70 rounded-[14px] shadow-[0px_0px_0px_0px_rgb(255,255,255),0px_0px_0px_0.92px_rgba(244,244,245,0.1),0px_0px_0px_0px_rgba(0,0,0,0)] w-[390px]">
      <Image src={image} alt={title} fill className="object-contain object-top" />
      <div className="relative px-6 pb-6 pt-[50%]">
        <h3 className="text-[#F1E9D9] text-xl mb-4">{title}</h3>
        <p className="text-white/60 text-base">
          {children}
        </p>
      </div>
    </div>
  )
}

// If we need to add tooltip to highlight in future we support it here
function Highlight({ children, tooltipContent }: PropsWithChildren<{ tooltipContent?: string }>) {
  const component = (
    <span className="text-[#FFF75D] underline underline-offset-2">
      {children}
    </span>
  );

  if (!tooltipContent) {
    return component;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {component}
      </TooltipTrigger>
      <TooltipContent>
        <div>
          {tooltipContent}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default function GameplaySection() {
  return (
    <div className="container mx-auto pt-10 pb-20 sm:pt-20 sm:pb-40">
      <h2 className="flex flex-row items-center gap-4.5 justify-center">
        <span className="font-mono text-[#F1E9D9] text-[34px]">Gameplay</span>
      </h2>
      <p className="text-center mt-5 text-[#F1E9D9]/60 mb-16 max-w-[960px] mx-auto">
        Developers participate by building their own bots (automated agents) that interact directly with the Cardano blockchain.
        Each bot can be defined as an off-chain process that controls particular UTxOs that are constrained by on-chain validators.
      </p>

      <div className="flex flex-col md:flex-row gap-8 mt-14 justify-center flex-wrap">
        <GameplayCard image="/images/gameplay/2d-space-game.png" title="A 2D Space Game">
          Players join the game by minting a ship token that will be moved across a 2D <Highlight>grid</Highlight>. The grid contains 
          other players' ships, fuel pellets, collectible tokens, and the central Asteria asteroid—each represented as 
          Cardano UTxOs on the blockchain.
        </GameplayCard>

        <GameplayCard image="/images/gameplay/move-your-ship.png" title="Move your ship">
          You change the <Highlight>ship</Highlight> location by submitting a transaction that consumes its datum and generates
          a new one with the updated position. UTxOs are locked at a script address that constrains the max speed (distance/slots).
          We call this the <Highlight>Space-Time contract</Highlight>
        </GameplayCard>

        <GameplayCard image="/images/gameplay/gather-fuel.png" title="Gather fuel">
          Ships burn fuel proportional to the distance they travel. Fuel is represented by a Cardano native-token. There's
          plenty of <Highlight>Fuel Pellets</Highlight> scattered across the grid. Ships can gather fuel UTxOs as long
          as their coordinates overlap.
        </GameplayCard>

        <GameplayCard image="/images/gameplay/gather-tokens.png" title="Gather Tokens">
          Ships can also collect <Highlight>sponsor tokens</Highlight> scattered across the grid. Each token
          is represented as a UTxO with specific coordinates. You claim a token by overlapping your ship's
          position with the token's UTxO and consuming it in a transaction.
        </GameplayCard>

        <GameplayCard image="/images/gameplay/mine-asteria.png" title="Mine Asteria">
          The ultimate goal is to reach the center of the grid with your ship at coordinates (0, 0). There you will
          find <Highlight>Asteria</Highlight> asteroid which is an UTxO that holds the challenge rewards. It
          contains a datum with a counter to ensure ship uniqueness when multiple bots reach the center simultaneously.
        </GameplayCard>
      </div>
    </div>
  )  
}