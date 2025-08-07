import { ChangeEvent, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import CodeBlock from '@/components/ui/CodeBlock';
import CopyButton from '@/components/ui/CopyButton';
import ConnectWallet from '@/components/ui/ConnectWallet';

import Tabs, { Tab } from '@/components/how-to-play/Tabs';
import MoveShipDescription from '@/components/how-to-play/move-ship/Description.mdx';

import type { ResponseData } from '@/pages/api/asteria/move-ship';
import type { ConnectedWallet } from '@/hooks/useCardano';

const tx3File = `tx move_ship(
    p_delta_x: Int,
    p_delta_y: Int,
    ship_name: Bytes,
    pilot_name: Bytes,
    required_fuel: Int,
    tip_slot: Int, // TODO: remove when tip_slot() implemented
) {
    locals {
        spacetime_policy_hash: 0x0291ae7aebaf064b785542093c2b13169effb34462301e68d4b44f43,
        spacetime_policy_ref: 0x3d308c0f3deb1eff764cbb765452c53d30704748681d7acd61c7775aeb8a8e46#1,
        pellet_policy_ref: 0x3d308c0f3deb1eff764cbb765452c53d30704748681d7acd61c7775aeb8a8e46#2,
    }

    validity {
        until_slot: tip_slot, // tip_slot() + 300
    }

    reference SpacetimeRef {
        ref: spacetime_policy_ref,
    }

    reference PelletRef {
        ref: pellet_policy_ref,
    }

    input source {
        from: Player,
        min_amount: fees,
    }

    input ship {
        from: SpacetimePolicy,
        datum_is: ShipDatum,
        min_amount: AnyAsset(spacetime_policy_hash, ship_name, 1),
        redeemer: ShipActions::MoveShip { 
            delta_x: p_delta_x,
            delta_y: p_delta_y,
        },
    }

    input pilot {
        from: Player,
        min_amount: AnyAsset(spacetime_policy_hash, pilot_name, 1),
    }

    burn {
        amount: Fuel(required_fuel),
        redeemer: (),
    }

    output {
        to: SpacetimePolicy,
        amount: ship - Fuel(required_fuel),
        datum: ShipDatum {
            pos_x: ship.pos_x + p_delta_x,
            pos_y: ship.pos_y + p_delta_y,
            last_move_latest_time: tip_slot,
            ...ship
        },
    }

    output {
        to: Player,
        amount: source - fees + pilot,
    }
}`;

const jsFile = `const distance = Math.abs(positionX) + Math.abs(positionY);

const result = await protocol.moveShipTx({
  player: playerAddress,
  pDeltaX: positionX,
  pDeltaY: positionY,
  shipName: new TextEncoder().encode(\`SHIP\${shipNumber}\`),
  pilotName: new TextEncoder().encode(\`PILOT\${shipNumber}\`),
  requiredFuel: distance * 60, // fuel_per_step from SpaceTime datum
  tip_slot: blockSlotValue + 300, // 5 minutes from last block
});`;

type ActionState = {
  data?: {
    tx?: string;
  };
  errors?: Record<string, string>;
};

interface MoveShipProps {
  isActive: boolean;
}

export default function MoveShip(props: MoveShipProps) {
  const pathname = usePathname() || '';
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState<ResponseData>({});
  const [position, setPosition] = useState<{ x: number; y: number }|null>(null);
  const [wallet, setWallet] = useState<ConnectedWallet|null>(null);
  const [address, setAddress] = useState<string>('');
  const [shipNumber, setShipNumber] = useState<string>('');

  const errors = formState.errors || {};
  const dataTx = formState.data?.tx;

  useEffect(() => {
    if (props.isActive) {
      window.GODOT_BRIDGE?.send({ action: 'clear_placeholder' });
    }
  }, [props.isActive]);

  useEffect(() => {
    window.addEventListener('message', (event) => {
      if (pathname.includes('how-to-play') && window.location.hash === '#move-ship') {
        if (event.data.action == 'map_click') {
          updatePosition(event.data.position.x, event.data.position.y);
        }
      }
    });
  }, []);

  const updatePositionX = (event: ChangeEvent<HTMLInputElement>) => {
    updatePosition(parseInt(event.target.value), position ? position.y : 0);
  }

  const updatePositionY = (event: ChangeEvent<HTMLInputElement>) => {
    updatePosition(position ? position.x : 0, parseInt(event.target.value));
  }
  
  const updatePosition = (x: number, y: number) => {
    setPosition({ x, y });
    console.log({ x, y, shipNumber });
    window.GODOT_BRIDGE?.send({ action: 'select_ship', shipNumber });
    window.GODOT_BRIDGE?.send({ action: 'move_ship', x, y });
  }

  const updateShipNumber = (event: ChangeEvent<HTMLInputElement>) => {
    setShipNumber(event.target.value);
    window.GODOT_BRIDGE?.send({ action: 'select_ship', shipNumber: event.target.value });
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
    try {
      const res = await fetch('/api/asteria/move-ship', {
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
        <MoveShipDescription />
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
              <Input
                name="blockSlot"
                type="number"
                placeholder="Latest block slot"
                containerClassName="flex-1"
                label="Latest block slot"
                error={errors.shipNumber}
                disabled={submitting}
                required
              />
            </div>

            <div className="w-full flex flex-row gap-x-4">
              <Input
                name="positionX"
                type="number"
                placeholder="Enter position X"
                label="Position X"
                error={errors.positionX}
                disabled={submitting}
                required
                containerClassName="flex-1"
                value={position?.x ?? ''}
                onChange={updatePositionX}
              />

              <Input
                name="positionY"
                type="number"
                placeholder="Enter position Y"
                label="Position Y"
                error={errors.positionY}
                disabled={submitting}
                required
                containerClassName="flex-1"
                value={position?.y ?? ''}
                onChange={updatePositionY}
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
