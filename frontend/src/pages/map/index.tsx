import { useChallengeStore } from '@/stores/challenge';
import { AsteriaMap } from '@/components/AsteriaMap';

export default function Map() {
  const { current } = useChallengeStore();

  return (
    <div className="w-full h-[calc(100vh-64px)]">
      <AsteriaMap
        mode="map"
        challenge={current()}
        className="fixed top-[64px] right-0 w-dvw h-[calc(100dvh-64px)]"
      />
    </div>
  );
}
