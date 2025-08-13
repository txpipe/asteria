import type { MouseEventHandler } from 'react';
import Image from 'next/image';

// Stores
import type { Challenge } from '@/stores/challenge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type ChallengeDetails = Challenge['details'];

interface ChallengeCardProps extends ChallengeDetails {
  comingSoon?: boolean;
  name: string;
  network: string;
  onSelect?: MouseEventHandler<HTMLButtonElement>;
}

export default function ChallengeCard({ comingSoon, image, day, month, name, network, reward, sponsors, moreSponsors, onSelect }: ChallengeCardProps) {
  const adaPrefix = network === 'preview' ? 't' : '';
  return (
    <div className="rounded-xl bg-[#141414]/70 shadow-[0px_2px_15.9px_0px_rgba(255,255,255,0.05),0px_0px_12.3px_0px_rgba(255,255,255,0.04)] overflow-hidden aspect-[390/353] w-[390px]">
      <div className="relative aspect-[390/209] w-full">
        <Image
          src={image || "/images/challenge/first.png"}
          alt={`Image for ${name}`}
          fill
          className="object-contain"
        />
        {(!!day || !!month) && (
          <div className="absolute aspect-square w-16 bottom-4.5 right-4.5 bg-[#F1E9D9]/90 flex items-center justify-center flex-col text-secondary-80 font-medium rounded-xl px-2 py-1">
            {day && (
              <div className="text-xl">{day.toString().padStart(2, '0')}</div>
            )}
            {month && (
              <div className="text-lg">{month.toUpperCase()}</div>
            )}
          </div>
        )}
      </div>

      <div className="relative p-6">
        <h3>{name}</h3>
        <div className="mt-6">
          <div className="flex flex-row items-center gap-3 text-[#F1E9D9]">
            <span className="opacity-30">Network |</span>
            <span className="capitalize">{network}</span>
          </div>
          <div className="flex flex-row items-center gap-3 text-[#F1E9D9] mt-1">
            <span className="opacity-30">Reward |</span>
            {reward ? `${reward} ${adaPrefix}₳` : '???'}
          </div>
        </div>

        <button
          type="button"
          className="absolute bottom-6 right-6 btn-small btn-primary w-fit"
          onClick={!comingSoon ? onSelect : undefined}
          disabled={comingSoon || !onSelect}
        >
          {comingSoon ? 'Coming Soon' : onSelect ? 'Select' : 'Selected' }
        </button>

        {sponsors && sponsors.length > 0 && (
          <div className="absolute flex top-6 right-6">
            {sponsors.map(([imageSrc, altText]) => (
              <Tooltip key={imageSrc} placement="top">
                <TooltipTrigger asChild>
                  <Image
                    src={imageSrc}
                    alt={altText}
                    width={32}
                    height={32}
                    className="rounded-full -mr-3 overflow-hidden border border-black"
                  />
                </TooltipTrigger>
                <TooltipContent>{altText}</TooltipContent>
              </Tooltip>
            ))}
            {moreSponsors && (
              <div className="rounded-full -mr-3 overflow-hidden border border-black bg-secondary-80 size-8 flex items-center justify-center text-xs">
                +{moreSponsors}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}