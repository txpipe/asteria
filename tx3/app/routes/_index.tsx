// Components
import { ConnectWallet } from '~/components/ui/connect-wallet';
import { CreateShip, createShipAction } from '~/components/home/form/CreateShip';
import { MoveShip, moveShipAction } from '~/components/home/form/MoveShip';
import { Section } from '~/components/section';

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
  return (
    <main className="h-dvh overflow-y-scroll gap-4 snap-y snap-mandatory scroll-smooth">
      <Section className="gap-4">
        <h1 className="text-3xl font-bold">Welcome to Asteria Joystick</h1>
        <ConnectWallet />
        <CreateShip />
      </Section>
      <Section>
        <MoveShip />
      </Section>
    </main>
  );
}
