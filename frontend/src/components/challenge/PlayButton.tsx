'use client'

import { useRouter } from 'next/navigation';
import type { MouseEventHandler } from 'react';

// Stores
import { challenges, useChallengeStore } from '@/stores/challenge';

// Icons
import PlayIcon from '@/components/icons/PlayIcon';

interface PlayButtonProps {
  slug: string;
  label?: string;
  destination?: string;
  showIcon?: boolean;
}

export default function PlayButton({ slug, label, destination, showIcon }: PlayButtonProps) {
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
      router.push(destination ?? '/explorer');
    }
  }
  return (
    <button type="button" className="btn-small btn-primary" onClick={onPlay}>
      {showIcon && (
        <PlayIcon className="size-4.5" strokeWidth={1.5} />
      )}
      {label ?? 'Play'}
    </button>
  );
}