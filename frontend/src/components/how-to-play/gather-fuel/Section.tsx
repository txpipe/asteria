import { ChangeEvent, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import CodeBlock from '@/components/ui/CodeBlock';
import CopyButton from '@/components/ui/CopyButton';
import ConnectWallet from '@/components/ui/ConnectWallet';

import Tabs, { Tab } from '@/components/how-to-play/Tabs';
import GatherFuelDescription from '@/components/how-to-play/gather-fuel/Description.mdx';

import type { ResponseData } from '@/pages/api/asteria/gather-fuel';
import type { ConnectedWallet } from '@/hooks/useCardano';
import { useChallengeStore } from '@/stores/challenge';

const tx3File = `tx gather_fuel(
  p_amount: Int,
  ship_name: Bytes,
  pilot_name: Bytes,
  pellet_ref: UtxoRef,
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

  input pellet {
    ref: pellet_ref,
    redeemer: PelletRedeemer::Provide { 
      amount: p_amount,
    },
  }

  input ship {
    from: SpacetimePolicy,
    datum_is: ShipDatum,
    min_amount: AnyAsset(spacetime_policy_hash, ship_name, 1),
    redeemer: ShipRedeemer::GatherFuel { 
      amount: p_amount,
    },
  }

  input* pilot {
    from: Player,
    min_amount: AnyAsset(spacetime_policy_hash, pilot_name, 1) + fees + min_utxo(pilot_change),
  }

  output {
    to: PelletPolicy,
    amount: pellet - Fuel(p_amount),
    datum: PelletDatum {...pellet},
  }

  output {
    to: SpacetimePolicy,
    amount: ship + Fuel(p_amount),
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

const jsFile = `const fuelAmount = 4; // Replace with the desired fuel to gather
const shipName = "SHIP0"; // Replace with your ship name
const pilotName = "PILOT0"; // Replace with your pilot name
const pelletRef = "acbb34e95c67bc4432557088138dbcc00d957756ebac6480e2499d1088b0b7be#13"; // Pellet UTxO reference

const playerAddress = process.env.PLAYER_ADDRESS;
const tipSlot = 165453127; // Replace with the latest block slot

const sinceSlot = tipSlot - 100; // 100 is just to be safe

const args: GatherFuelParams = {
  player: playerAddress,
  pAmount: fuelAmount,
  pilotName: new TextEncoder().encode(pilotName),
  shipName: new TextEncoder().encode(shipName),
  pelletRef,
  sinceSlot,
};

const response = await client.gatherFuelTx(args);`;

type ActionState = {
  data?: {
    tx?: string;
  };
  errors?: Record<string, string>;
};

interface GatherFuelProps {
  isActive: boolean;
}

export default function GatherFuel(props: GatherFuelProps) {
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
      const res = await fetch('/api/asteria/gather-fuel', {
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
        <GatherFuelDescription />
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
                name="pelletRef"
                type="text"
                placeholder="Enter pellet reference"
                containerClassName="flex-1"
                label="Pellet Ref"
                error={errors.pelletRef}
                disabled={submitting}
                required
              />
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
