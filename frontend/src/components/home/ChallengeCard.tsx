import type { MouseEventHandler } from 'react';
import Image from 'next/image';

interface ChallengeCardProps {
  imageSrc?: string;
  altText?: string;
  day: number;
  month: string;
  name: string;
  network: string;
  reward: number;
  onSelect?: MouseEventHandler<HTMLButtonElement>;
}

export default function ChallengeCard({ imageSrc, altText, day, month, name, network, reward, onSelect }: ChallengeCardProps) {
  return (
    <div className="rounded-xl bg-[#141414]/70 shadow-[0px_2px_15.9px_0px_rgba(255,255,255,0.05),0px_0px_12.3px_0px_rgba(255,255,255,0.04)] overflow-hidden aspect-[390/353] w-[390px]">
      <div className="relative aspect-[390/209] w-full">
        <Image
          src={imageSrc || "/images/challenge/first.png"}
          alt={altText || "Challenge Image"}
          fill
          className="object-contain"
        />
        <div className="absolute aspect-square w-16 bottom-4.5 right-4.5 bg-[#F1E9D9]/90 text-center text-secondary-80 font-medium rounded-xl px-2 py-1">
          <div className="text-xl">{day.toString().padStart(2, '0')}</div>
          <div className="text-lg">{month.toUpperCase()}</div>
        </div>
      </div>

      <div className="relative p-6">
        <h3>{name}</h3>
        <div className="mt-6">
          <div className="flex flex-row items-center gap-3 text-[#F1E9D9]">
            <span className="opacity-30">Network |</span>
            {network}
          </div>
          <div className="flex flex-row items-center gap-3 text-[#F1E9D9] mt-1">
            <span className="opacity-30">Reward |</span>
            {reward} ₳
          </div>
        </div>

        <button
          type="button"
          className="absolute bottom-6 right-6 btn-small btn-primary w-fit"
          onClick={onSelect}
          disabled={!onSelect}
        >
          Play
        </button>
      </div>
    </div>
  )
}