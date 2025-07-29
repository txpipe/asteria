import { useEffect } from 'react';
import { useChallengeStore } from '@/stores/challenge';
import { useScrollSnap } from '@/hooks/useScrollSnap';

import { ConnectWallet } from '@/components/ui/ConnectWallet';
import { Section } from '@/components/Section';
import { AsteriaMap } from '@/components/AsteriaMap';
import { CreateShip } from '@/components/home/form/CreateShip';
import { MoveShip } from '@/components/home/form/MoveShip';
import { SectionsMenu } from '@/components/home/SectionsMenu';

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

  return (
    <main className="relative h-[calc(100dvh-64px)] overflow-y-scroll gap-4 snap-y snap-mandatory scroll-smooth">
      <AsteriaMap
        mode="joystick"
        challenge={current()}
        className="fixed top-[64px] right-0 w-dvw h-[calc(100dvh-64px)]"
      />
      
      <div className="relative z-1 w-fit">
        <section className="relative h-[calc(100dvh-64px)] snap-start flex" id="connect-wallet">
          <div className="m-16 w-[50dvw]">
            <h3 className="font-dmsans-regular text-3xl text-left text-[#F1E9D9] mb-8">
              Explore a web implementation to execute transactions for the Asteria challenge, built with the Tx3 toolkit.
            </h3>
            <ConnectWallet />
          </div>
          <div className="absolute h-full w-[100dvw] bg-[url(/board.png)] bg-bottom bg-no-repeat bg-contain" />
        </section>

        <Section title="CREATE SHIP" id="create-ship">
          <CreateShip isActive={activeSection === 'create-ship'} />
        </Section>

        <Section title="MOVE SHIP" id="move-ship">
          <MoveShip isActive={activeSection === 'move-ship'} />
        </Section>

        {/* <Section id="actions" title="ACTIONS">
          <button
            type="button"
            className="font-monocraft-regular text-black bg-[#07F3E6] py-2 px-4 rounded-full text-md"
            onClick={() =>
              window.GODOT_BRIDGE?.send({
                action: 'select_ship',
                id: '3cd194e473e901de0b7f1b7150bd1e848840196dbccc26c261ccea621928c35e#0',
              })
            }
          >
            Focus ship
          </button>

          <button
            type="button"
            className="font-monocraft-regular text-black bg-[#07F3E6] py-2 px-4 rounded-full text-md"
            onClick={() => window.GODOT_BRIDGE?.send({ action: 'clear_ship' })}
          >
            Clear focus ship
          </button>

          <button
            type="button"
            className="font-monocraft-regular text-black bg-[#07F3E6] py-2 px-4 rounded-full text-md"
            onClick={() => window.GODOT_BRIDGE?.send({ action: 'move_ship', x: 14, y: 18 })}
          >
            Set move ship position
          </button>

          <button
            type="button"
            className="font-monocraft-regular text-black bg-[#07F3E6] py-2 px-4 rounded-full text-md"
            onClick={() => window.GODOT_BRIDGE?.send({ action: 'clear_move_ship' })}
          >
            Clear move ship
          </button>

          <button
            type="button"
            className="font-monocraft-regular text-black bg-[#07F3E6] py-2 px-4 rounded-full text-md"
            onClick={() => window.GODOT_BRIDGE?.send({ action: 'refresh_data' })}
          >
            Refresh asteria
          </button>
        </Section> */}
      </div>

      <SectionsMenu />
    </main>
  );
}
