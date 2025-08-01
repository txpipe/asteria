import { useEffect } from 'react';
import { useChallengeStore } from '@/stores/challenge';
import { useScrollSnap } from '@/hooks/useScrollSnap';

import AsteriaMap from '@/components/ui/AsteriaMap';
import Menu from '@/components/how-to-play/Menu';
import Section from '@/components/how-to-play/Section';
import CreateShipSection from '@/components/how-to-play/create-ship/Section';
import MoveShipSection from '@/components/how-to-play/move-ship/Section';

export default function HowToPlay() {
  const { current } = useChallengeStore();
  const activeSection = useScrollSnap('main');

   // Handle initial scroll to hash position
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const targetId = hash.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        // Use a small timeout to ensure the component is fully rendered
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'instant' });
        }, 100);
      }
    }
  }, []);

  const handleScrollToCreateShip = () => {
    const createShipElement = document.getElementById('create-ship');
    if (createShipElement) {
      createShipElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="relative h-[calc(100dvh-64px)] overflow-y-scroll gap-4 snap-y snap-mandatory scroll-smooth">
      <AsteriaMap
        mode="joystick"
        challenge={current()}
        className="fixed top-[64px] right-0 w-dvw h-[calc(100dvh-64px)]"
      />
      
      <div className="relative z-1 w-fit">
        <section className="relative h-[calc(100dvh-64px)] snap-start flex" id="start">
          <div className="absolute h-full w-[100dvw] bg-[url(/board.png)] bg-bottom bg-no-repeat bg-contain" />
          <div className="relative m-16 w-[50dvw]">
            <h3 className="text-3xl text-left text-[#F1E9D9] mb-8">
              Explore a web implementation to execute transactions for the Asteria challenge, built with the Tx3 toolkit.
            </h3>
            <button className="font-mono text-black bg-[#07F3E6] py-4 px-8 rounded-full text-base" onClick={handleScrollToCreateShip}>
              Create ship
            </button>
          </div>
        </section>

        <Section title="CREATE SHIP" id="create-ship">
          <CreateShipSection isActive={activeSection === 'create-ship'} />
        </Section>

        <Section title="MOVE SHIP" id="move-ship">
          <MoveShipSection isActive={activeSection === 'move-ship'} />
        </Section>
      </div>

      <Menu />
    </main>
  );
}
