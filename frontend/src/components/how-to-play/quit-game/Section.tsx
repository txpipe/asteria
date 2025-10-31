import { ChangeEvent, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import CodeBlock from '@/components/ui/CodeBlock';
import CopyButton from '@/components/ui/CopyButton';
import ConnectWallet from '@/components/ui/ConnectWallet';

import Tabs, { Tab } from '@/components/how-to-play/Tabs';
import QuitGameDescription from '@/components/how-to-play/quit-game/Description.mdx';

import type { ResponseData } from '@/pages/api/asteria/quit-game';
import type { ConnectedWallet } from '@/hooks/useCardano';
import { useChallengeStore } from '@/stores/challenge';

const tx3File = `tx quit_game(
  ship_name: Bytes,
  pilot_name: Bytes,
  ship_fuel: Int,
  since_slot: Int,
) {
  locals {
    spacetime_policy_hash: 0x0291ae7aebaf064b785542093c2b13169effb34462301e68d4b44f43,
    spacetime_policy_ref: 0x3d308c0f3deb1eff764cbb765452c53d30704748681d7acd61c7775aeb8a8e46#1,
    pellet_policy_ref: 0x3d308c0f3deb1eff764cbb765452c53d30704748681d7acd61c7775aeb8a8e46#2,
  }

  validity {
    since_slot: since_slot,
  }

  reference SpacetimeRef {
    ref: spacetime_policy_ref,
  }

  reference PelletRef {
    ref: pellet_policy_ref,
  }

  input ship {
    from: SpacetimePolicy,
    datum_is: ShipDatum,
    min_amount: AnyAsset(spacetime_policy_hash, ship_name, 1),
    redeemer: ShipRedeemer::Quit {},
  }

  input* pilot {
    from: Player,
    min_amount: AnyAsset(spacetime_policy_hash, pilot_name, 1) + fees + min_utxo(pilot_change),
  }

  mint {
    amount: Fuel(ship_fuel) - Fuel(ship_fuel) - Fuel(ship_fuel),
    redeemer: FuelRedeemer::BurnFuel {},
  }

  mint {
    amount: AnyAsset(spacetime_policy_hash, ship_name, 1) - AnyAsset(spacetime_policy_hash, ship_name, 1) - AnyAsset(spacetime_policy_hash, ship_name, 1),
    redeemer: ShipyardRedeemer::BurnShip {},
  }

  output {
    to: SpacetimePolicy,
    amount: ship - AnyAsset(spacetime_policy_hash, ship_name, 1) - Fuel(ship_fuel),
    datum: ShipDatum {...ship},
  }

  output pilot_change {
    to: Player,
    amount: pilot - fees,
  }

  collateral {
    from: Player,
    min_amount: fees,
  }

}`;

const jsFile = `const shipName = "SHIP0"; // Replace with your ship name
const pilotName = "PILOT0"; // Replace with your pilot name
const shipFuel = 3; // Replace with the ship fuel

const playerAddress = process.env.PLAYER_ADDRESS;
const tipSlot = 165470021; // Replace with the latest block slot

const sinceSlot = tipSlot - 100; // 100 is just to be safe

const args: QuitGameParams = {
  player: playerAddress,
  pilotName: new TextEncoder().encode(pilotName),
  shipName: new TextEncoder().encode(shipName),
  shipFuel,
  sinceSlot,
};

const response = await client.quitGameTx(args);`;

type ActionState = {
  data?: {
    tx?: string;
  };
  errors?: Record<string, string>;
};

interface QuitGameProps {
  isActive: boolean;
}

export default function QuitGame(props: QuitGameProps) {
  const { current } = useChallengeStore();

  const pathname = usePathname() || '';
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState<ResponseData>({});
  const [wallet, setWallet] = useState<ConnectedWallet|null>(null);
  const [address, setAddress] = useState<string>('');
  const [shipNumber, setShipNumber] = useState<string>('');
  const [tipSlot, setTipSlot] = useState<number|undefined>(undefined);

  const errors = formState.errors || {};
  const dataTx = formState.data?.tx;

  useEffect(() => {
    if (props.isActive) {
      window.GODOT_BRIDGE?.send({ action: 'clear_placeholder' });
    }
  }, [props.isActive]);

  const updateShipNumber = (event: ChangeEvent<HTMLInputElement>) => {
    setShipNumber(event.target.value);
    window.GODOT_BRIDGE?.send({ action: 'select_ship', shipNumber: event.target.value });
  }

  const handleFetchLastSlot = async () => {
    const slotRes = await (await fetch("https://8000-ethereal-audience-bb83g6.us1.demeter.run/graphql", {
      "headers": { "content-type": "application/json" },
      "body": "{\"query\":\"query { lastSlot { slot } }\"}",
      "method": "POST"
    })).json();

    setTipSlot(slotRes.data.lastSlot.slot);
  }

  const updateTipSlot = (event: ChangeEvent<HTMLInputElement>) => {
    setTipSlot(parseInt(event.target.value));
  }

  const handleWallet = (connectedWallet: ConnectedWallet|null) => {
    setWallet(connectedWallet);
    setAddress(connectedWallet?.changeAddress || '');
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormState({});
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data['network'] = current().network;
    try {
      const res = await fetch('/api/asteria/quit-game', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      const jsonResponse = await res.json();
      setFormState(jsonResponse);
    } catch (error) {
      console.log('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Tabs className="w-full h-full overflow-hidden" contentClassName="overflow-auto">
      <Tab label="Description">
        <QuitGameDescription />
      </Tab>

      <Tab label="Tx Form">
        <form className="flex flex-col gap-8 justify-between h-full" onSubmit={handleSubmit}>
          <div>
            <Input
              name="playerAddress"
              placeholder="Enter player address"
              label="Player Address"
              error={errors.playerAddress}
              disabled={submitting}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />

            <ConnectWallet onWalletConnected={handleWallet} />

            <div className="w-full flex flex-row gap-x-4">
              <div className="mt-[6px] flex-1">
                <Input
                  name="shipNumber"
                  type="number"
                  placeholder="Enter ship number"
                  containerClassName="flex-1"
                  label="Ship Number"
                  error={errors.shipNumber}
                  disabled={submitting}
                  value={shipNumber}
                  onChange={updateShipNumber}
                  required
                />
              </div>
              <Input
                name="blockSlot"
                type="number"
                placeholder="Latest block slot"
                containerClassName="flex-1"
                label="Latest block slot"
                error={errors.shipNumber}
                disabled={submitting}
                button="fetch last"
                onClickButton={handleFetchLastSlot}
                value={tipSlot}
                onChange={updateTipSlot}
                required
              />
            </div>

            <div className="w-full flex flex-row gap-x-4">
              <Input
                name="fuelAmount"
                type="number"
                placeholder="Enter fuel amount"
                containerClassName="flex-1"
                label="Fuel Amount"
                error={errors.fuelAmount}
                disabled={submitting}
                required
              />
            </div>
          </div>

          {dataTx && (
            <Alert type="success" title="Response">
              {dataTx}
            </Alert>
          )}

          {errors.global && <Alert type="error">{errors.global}</Alert>}

          <div className="flex flex-1 flex-row items-end w-full gap-x-4">
            <button
              type="submit"
              className="basis-1/2 font-mono text-black bg-[#07F3E6] py-2 px-4 rounded-full text-base"
              disabled={submitting}
            >
              {submitting ? 'Resolving...' : 'Resolve'}
            </button>
          </div>
        </form>
      </Tab>

      <Tab label="Tx3 File" rightAction={<CopyButton text={tx3File} />}>
        <div className="bg-[#272A36] p-4 text-sm overflow-scroll">
          <CodeBlock code={tx3File} lang="tx3" />
        </div>
      </Tab>

      <Tab label="JS Code" rightAction={<CopyButton text={jsFile} />}>
        <div className="bg-[#272A36] p-4 text-sm overflow-scroll">
          <CodeBlock code={jsFile} lang="js" />
        </div>
      </Tab>
    </Tabs>
  );
}
