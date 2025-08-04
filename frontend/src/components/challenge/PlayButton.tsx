'use client'

import { useRouter } from 'next/navigation';
import type { MouseEventHandler } from 'react';

// Stores
import { challenges, useChallengeStore } from '@/stores/challenge';

// Icons
import PlayIcon from '@/components/icons/PlayIcon';


export default function PlayButton({ slug }: { slug: string }) {
  const { select, current } = useChallengeStore();

  const router = useRouter();

  const currentChallenge = current();
  if (currentChallenge.slug === slug) {
    return null; // Already selected, no need to show the button
  }

  const onPlay: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const index = challenges.findIndex(c => c.slug === slug);
    if (index >= 0) {
      select(index);
      router.push('/how-to-play');
    }
  }
  return (
    <button type="button" className="btn-small btn-primary" onClick={onPlay}>
      <PlayIcon className="size-4.5" strokeWidth={1.5} />
      Play
    </button>
  );
}