import { useEffect } from 'react';

// Components
import { ConnectWallet } from '~/components/ui/ConnectWallet';
import { Section } from '~/components/Section';
import { AsteriaMap } from '~/components/AsteriaMap';
import { CreateShip, createShipAction } from '~/components/home/form/CreateShip';
import { MoveShip, moveShipAction } from '~/components/home/form/MoveShip';
import { SectionsMenu } from '~/components/home/SectionsMenu';

// Hooks
import { useScrollSnap } from '~/hooks/useScrollSnap';

// Types
import type { Route } from './+types/_index';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Asteria Joystick' }, { name: 'description', content: 'Asteria controls using TX3' }];
}

export async function action({ request }: Route.ActionArgs) {
  // Create a ship transaction cbor
  const formData = await request.formData();
  const action = formData.get('ACTION');
  switch (action) {
    case 'createShip':
      return createShipAction(formData);
    case 'moveShip':
      return moveShipAction(formData);
    default:
      return null;
  }
}

export default function Home() {
  useScrollSnap('main');

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
    <main className="relative h-dvh overflow-y-scroll gap-4 snap-y snap-mandatory scroll-smooth">
      <div className="relative z-1 w-fit">
        <Section className="gap-4" title="CREATE SHIP" id="create-ship">
          <ConnectWallet />
          <CreateShip />
        </Section>
        <Section title="MOVE SHIP" id="move-ship">
          <MoveShip />
        </Section>

        <Section id="actions" title="ACTIONS">
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer w-fit mt-6 disabled:bg-blue-400 disabled:cursor-not-allowed"
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
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer w-fit mt-6 disabled:bg-blue-400 disabled:cursor-not-allowed"
            onClick={() => window.GODOT_BRIDGE?.send({ action: 'clear_ship' })}
          >
            Clear focus ship
          </button>

          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer w-fit mt-6 disabled:bg-blue-400 disabled:cursor-not-allowed"
            onClick={() => window.GODOT_BRIDGE?.send({ action: 'move_ship', x: 14, y: 18 })}
          >
            Set move ship position
          </button>

          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer w-fit mt-6 disabled:bg-blue-400 disabled:cursor-not-allowed"
            onClick={() => window.GODOT_BRIDGE?.send({ action: 'clear_move_ship' })}
          >
            Clear move ship
          </button>

          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer w-fit mt-6 disabled:bg-blue-400 disabled:cursor-not-allowed"
            onClick={() => window.GODOT_BRIDGE?.send({ action: 'refresh_data' })}
          >
            Refresh asteria
          </button>
        </Section>
      </div>

      <SectionsMenu />

      <AsteriaMap
        apiUrl="https://8000-skillful-employee-kb9ou6.us1.demeter.run/graphql"
        shipyardPolicyId="f9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20"
        fuelPolicyId="fc8ad4f84181b85dc04f7b8c2984b129284c4e272ef45cd6440575fd4655454c"
        shipAddress="addr_test1wru5jl7xf6rufkjwcmft6x5rnd40zznhcyyp0km3gwkr6gq6sxzm6"
        fuelAddress="addr_test1wr7g448cgxqmshwqfaacc2vyky5jsnzwyuh0ghxkgszhtlgzrxj63"
        asteriaAddress="addr_test1wqdsuy97njefz53rkhd4v6a2kuqk0md5mrn996ygwekrdyq369wjg"
        explorerUrl="https://preview.cexplorer.io/tx/"
        className="fixed top-0 right-0 w-dvw h-dvh z-0"
      />
    </main>
  );
}
