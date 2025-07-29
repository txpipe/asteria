import { useEffect, useRef, useState } from 'react';

// Components
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Code } from '@/components/ui/Code';
import { Tab, Tabs } from '@/components/Tabs';
import { CopyButton } from '@/components/CopyButton';

import MoveShipDescription from '@/components/how-to-play/MoveShip.mdx';

// Store
import { useWallet } from '@/stores/wallet';

// Pages
import type { ResponseData } from '@/pages/api/asteria/move-ship';

const tx3File = `// Asteria player
party Player; // Sent by Form

tx moveShip(
    p_delta_x: Int,
    p_delta_y: Int,
    tx_latest_posix_time: Int,
    // ship_tx_hash: Bytes,
    ship_name: Bytes,
    pilot_name: Bytes,
    // distance: Int,
    required_fuel: Int,
) {
    validity {
        until_slot: tx_latest_posix_time,
    }

    // References
    // SpaceTime
    reference SpaceTimeRef {
        ref: 0x41e5881cd3bdc3f08bcf341796347e9027e3bcd8d58608b4fcfca5c16cbf5921#0,
    }

    // Pellet
    reference PelletRef {
        ref: 0xba6fab625d70a81f5d1b699e7efde4b74922d06224bef1f6b84f3adf0a61f3f3#0,
    }

    // Inputs
    input source {
        from: Player,
        min_amount: fees,
    }

    input spaceTime {
        ref: 0x41e5881cd3bdc3f08bcf341796347e9027e3bcd8d58608b4fcfca5c16cbf5921#0,
        datum_is: SpaceTimeDatum,
    }

    // Is possible to get the SHIP token name using the txhash?
    input ship {
        from: "addr_test1wru5jl7xf6rufkjwcmft6x5rnd40zznhcyyp0km3gwkr6gq6sxzm6",
        datum_is: ShipDatum,
        // Ideally
        // min_amount: AnyAsset(0xf9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20, ship_name, 1) + Fuel(distance * fuel_per_step),
        min_amount: AnyAsset(0xf9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20, ship_name, 1),

        // Is this correct?
        redeemer: ShipActions::MoveShip { 
            delta_x: p_delta_x,
            delta_y: p_delta_y,
        },
    }

    input pilot {
        from: Player,
        // min_amount: AnyAsset(0xf9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20, ship.pilot_token_name, 1),
        min_amount: AnyAsset(0xf9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20, pilot_name, 1),
    }

    // Burn
    burn {
        // amount: Fuel(distance * fuel_per_step),
        amount: Fuel(required_fuel),
        redeemer: (),
    }

    // Outputs
    output {
        // SpaceTime Contract
        to: "addr_test1wru5jl7xf6rufkjwcmft6x5rnd40zznhcyyp0km3gwkr6gq6sxzm6",
        // amount: ship - Fuel(distance * fuel_per_step),
        amount: ship - Fuel(required_fuel),
        datum: ShipDatum {
            pos_x: ship.pos_x + p_delta_x,
            pos_y: ship.pos_y + p_delta_y,
            last_move_latest_time: tx_latest_posix_time,
            ...ship
        },
    }

    output {
        to: Player,
        amount: source - fees + pilot,
    }
}
`;

const jsFile = `const distance = Math.abs(positionX) + Math.abs(positionY);

const result = await protocol.moveShipTx({
  pDeltaX: positionX,
  pDeltaY: positionY,
  player: playerAddress,
  // distance,
  requiredFuel: distance * 60, // fuel_per_step from SpaceTime datum
  shipName: new TextEncoder().encode(\`SHIP\${shipNumber}\`),
  pilotName: new TextEncoder().encode(\`PILOT\${shipNumber}\`),
  txLatestPosixTime: blockSlotValue + 300, // 5 minutes from last block
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

export function MoveShip(props: MoveShipProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState<ResponseData>({});

  const errors = formState.errors || {};
  const dataTx = formState.data?.tx;

  const walletApi = useWallet((s) => s.api);
  const walletAddress = useWallet((s) => s.changeAddress);
  const addressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dataTx && walletApi) {
      walletApi.signTx(dataTx, true).then((signedTx) => {
        console.log('Signed transaction:', signedTx);
      }).catch((error) => {
        console.log('Error signing transaction:', error)
      });
    }
  }, [dataTx, walletApi]);

  useEffect(() => {
    if (addressRef.current && walletAddress) {
      addressRef.current.value = walletAddress;
    }
  }, [walletAddress]);

  useEffect(() => {
    if (props.isActive) {
      window.GODOT_BRIDGE?.send({ action: 'clear_placeholder' });
    }
  }, [props.isActive]);

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
              ref={addressRef}
              name="playerAddress"
              placeholder="Enter player address"
              label="Player Address"
              error={errors.playerAddress}
              defaultValue={walletAddress ?? ''}
              disabled={submitting}
              required
            />

            <div className="w-full flex flex-row gap-x-4">
              <Input
                name="shipNumber"
                type="number"
                placeholder="Enter ship number"
                containerClassName="flex-1"
                label="Ship Number"
                error={errors.shipNumber}
                defaultValue={10}
                disabled={submitting}
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
                defaultValue={20}
                disabled={submitting}
                required
                containerClassName="flex-1"
              />

              <Input
                name="positionY"
                type="number"
                placeholder="Enter position Y"
                label="Position Y"
                error={errors.positionY}
                defaultValue={20}
                disabled={submitting}
                required
                containerClassName="flex-1"
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
              className="basis-1/2 font-monocraft-regular text-black bg-[#07F3E6] py-2 px-4 rounded-full text-md"
              disabled={submitting}
            >
              {submitting ? 'Moving ship...' : 'Move ship'}
            </button>
          </div>
        </form>
      </Tab>

      <Tab label="Tx3 File" rightAction={<CopyButton text={tx3File} />}>
        <Code code={tx3File} lang="tx3" />
      </Tab>

      <Tab label="JS Code" rightAction={<CopyButton text={jsFile} />}>
        <Code code={jsFile} lang="js" />
      </Tab>
    </Tabs>
  );
}
