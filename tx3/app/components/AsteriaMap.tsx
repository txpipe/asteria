import { useMemo } from 'react';

interface AsteriaMapProps {
  className?: string;
  apiUrl: string;
  shipyardPolicyId: string;
  fuelPolicyId: string;
  shipAddress: string;
  fuelAddress: string;
  asteriaAddress: string;
  explorerUrl: string;
}

const baseURL = '/visualizer/index.html';

export function AsteriaMap({
  apiUrl,
  className,
  shipyardPolicyId,
  fuelPolicyId,
  shipAddress,
  fuelAddress,
  asteriaAddress,
  explorerUrl,
}: AsteriaMapProps) {
  const src = useMemo(() => {
    const params = new URLSearchParams([
      ['mode', 'joystick'],
      ['apiUrl', apiUrl],
      ['shipyardPolicyId', shipyardPolicyId],
      ['fuelPolicyId', fuelPolicyId],
      ['shipAddress', shipAddress],
      ['fuelAddress', fuelAddress],
      ['asteriaAddress', asteriaAddress],
      ['explorerUrl', explorerUrl],
    ]);
    return `${baseURL}?${params.toString()}`;
  }, [apiUrl, shipyardPolicyId, fuelPolicyId, shipAddress, fuelAddress, asteriaAddress, explorerUrl]);

  return <iframe src={src} title="Asteria Map" className={className} />;
}
