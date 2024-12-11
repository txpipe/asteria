import { useChallengeStore } from '@/stores/challenge';

export default function Map() {
  const { current } = useChallengeStore();

  const getUrl = (): string => {
    const params = new URLSearchParams([
      ['apiUrl', `${process.env.API_URL}/graphql`],
      ['shipyardPolicyId', current().shipyardPolicyId],
      ['fuelPolicyId', current().fuelPolicyId],
      ['shipAddress', current().shipAddress],
      ['fuelAddress', current().fuelAddress],
      ['asteriaAddress', current().asteriaAddress],
      ['explorerUrl', current().explorerUrl],
    ]);
    return `/visualizer/index.html?${params.toString()}`;
  };

  return (
    <div className="w-full h-[calc(100vh-64px)]">
      <iframe src={getUrl()} width="100%" height="100%"></iframe>
    </div>
  );
}
