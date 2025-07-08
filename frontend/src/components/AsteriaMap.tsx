import { useMemo } from 'react';
import { Challenge } from '@/stores/challenge';

interface AsteriaMapProps {
  mode: 'map' | 'joystick';
  challenge: Challenge;
  className?: string;
}

const baseURL = '/visualizer/index.html';

export function AsteriaMap({ mode, challenge, className }: AsteriaMapProps) {
  const src = useMemo(() => {
    const params = new URLSearchParams([
      ['mode', mode],
      ['apiUrl', `${process.env.API_URL}/graphql`],
      ['shipyardPolicyId', challenge.shipyardPolicyId],
      ['fuelPolicyId', challenge.fuelPolicyId],
      ['shipAddress', challenge.shipAddress],
      ['fuelAddress', challenge.fuelAddress],
      ['asteriaAddress', challenge.asteriaAddress],
      ['explorerUrl', challenge.explorerUrl],
    ]);
    return `${baseURL}?${params.toString()}`;
  }, [mode, challenge]);

  return <iframe src={src} title="Asteria Map" className={className} />;
}
