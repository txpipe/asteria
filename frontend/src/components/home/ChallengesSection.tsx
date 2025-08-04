'use client'

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Icon
import ChallengeIcon from '@/components/icons/ChallengeIcon';

// Stores
import { useChallengeStore } from '@/stores/challenge';

// Local
import ChallengeCard from './ChallengeCard';

export default function ChallengesSection() {
  const { challenges, selected, select } = useChallengeStore();
  const router = useRouter();
  const locationHash = typeof window !== 'undefined' ? window.location.hash : '';

  useEffect(() => {
    if (typeof window !== 'undefined' && locationHash === '#challenges') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [locationHash]);

  return (
    <div id="challenges" className="container mx-auto pt-10 pb-20 sm:pt-20 sm:pb-40">
      <h2 className="flex flex-row items-center gap-4.5 justify-center">
        <ChallengeIcon className="size-10" />
        <span className="font-mono text-[#F1E9D9] text-[34px]">Available Challenges</span>
      </h2>
      <p className="text-center mt-5 text-[#F1E9D9]/60">
        There might be any number of open challenges (games) ongoing at any point.<br />
        Everything in Asteria is open-source, so you can even run your own challenge.
      </p>
      <div className="flex flex-col md:flex-row gap-8 mt-14 justify-center items-center">
        {challenges.map((challenge, idx) => (
          <Link href={`/challenge/${challenge.slug}`} key={challenge.asteriaAddress}>
            <ChallengeCard
              {...challenge.details}
              comingSoon={challenge.comingSoon}
              name={challenge.label}
              network={challenge.network}
              onSelect={idx !== selected ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                select(idx);

                router.push('/how-to-play')
              } : undefined}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}