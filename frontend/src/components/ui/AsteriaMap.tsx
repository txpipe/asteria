import { useMemo } from 'react';
import { Challenge, Token } from '@/stores/challenge';

interface AsteriaMapProps {
  mode: 'map' | 'joystick';
  challenge: Challenge;
  className?: string;
}

const baseURL = '/visualizer/index.html';

const getTokensQuery = (tokens: Token[]) => {
  const data = tokens.map(token => `{assetName: "${token.assetName}", policyId: "${token.policyId}"}`).join(',');
  return `[${data}]`;
};

export default function AsteriaMap({ mode, challenge, className }: AsteriaMapProps) {
  const src = useMemo(() => {
    const params = new URLSearchParams([
      ['mode', mode],
      ['apiUrl', `${process.env.API_URL}/graphql`],
      ['spacetimePolicyId', challenge.spacetimePolicyId],
      ['spacetimeAddress', challenge.spacetimeAddress],
      ['pelletPolicyId', challenge.pelletPolicyId],
      ['pelletAddress', challenge.pelletAddress],
      ['asteriaAddress', challenge.asteriaAddress],
      ['tokens', getTokensQuery(challenge.tokens)],
    ]);
    return `${baseURL}?${params.toString()}`;
  }, [mode, challenge]);

  return <iframe src={src} title="Asteria Map" className={className} />;
}
