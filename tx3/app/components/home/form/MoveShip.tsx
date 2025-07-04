import { protocol } from '@tx3/protocol';
import { useEffect, useRef } from 'react';
import { data, useFetcher } from 'react-router';
import type { TxEnvelope } from 'tx3-sdk/trp';

// Components
import { Input } from '~/components/ui/Input';
import { Alert } from '~/components/ui/Alert';
import { Code } from '~/components/ui/Code';
import { Tab, Tabs } from '~/components/Tabs';
import { CopyButton } from '~/components/CopyButton';

// Store
import { useWallet } from '~/store/wallet';

export async function moveShipAction(formData: FormData) {
  const shipNumber = formData.get('shipNumber') as string;
  const playerAddress = formData.get('playerAddress') as string;
  const positionXValue = formData.get('positionX') as string;
  const positionYValue = formData.get('positionY') as string;

  const errors: Record<string, string> = {};

  if (!shipNumber) errors.shipNumber = 'Ship number is required';
  if (!playerAddress) errors.playerAddress = 'Player address is required';
  if (!positionXValue) errors.positionX = 'Position X is required';

  const positionX = Number(positionXValue);
  if (Number.isNaN(positionX)) errors.positionX = 'Position X is not a number';

  if (!positionYValue) errors.positionY = 'Position Y is required';
  const positionY = Number(positionYValue);
  if (Number.isNaN(positionY)) errors.positionY = 'Position Y is not a number';

  if (Object.keys(errors).length > 0) {
    return data({ errors }, { status: 400 });
  }

  // 83_176_681 <- Get this number from blockfrost using latest epoch from a latest block.
  try {
    const lastBlock = await (await fetch(`${process.env.BLOCKFROST_URL}/blocks/latest`)).json();

    const distance = Math.abs(positionX) + Math.abs(positionY);

    const result = await protocol.moveShipTx({
      pDeltaX: positionX,
      pDeltaY: positionY,
      player: playerAddress,
      // distance,
      requiredFuel: distance * 60, // fuel_per_step from SpaceTime datum
      shipName: new TextEncoder().encode(`SHIP${shipNumber}`),
      pilotName: new TextEncoder().encode(`PILOT${shipNumber}`),
      txLatestPosixTime: lastBlock.slot + 300, // 5 minutes from last block
    });

    return data({ data: result }, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log('Cause', e.cause);
      console.log('Message', e.message);
      return data(
        {
          errors: {
            global: (typeof e.cause === 'string' ? e.cause : e.message) || 'Unknown error',
          },
        },
        { status: 500 },
      );
    }
  }
  return null;
}

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
  txLatestPosixTime: lastBlock.slot + 300, // 5 minutes from last block
});`;

export function MoveShip() {
  const walletApi = useWallet((s) => s.api);
  const walletAddress = useWallet((s) => s.changeAddress);
  const addressRef = useRef<HTMLInputElement>(null);

  const fetcher = useFetcher<{
    errors?: Record<string, string>;
    data?: TxEnvelope;
  }>();

  const errors = fetcher.data?.errors || {};
  const dataTx = fetcher.data?.data?.tx;

  useEffect(() => {
    if (dataTx && walletApi) {
      walletApi.signTx(dataTx, true).then((signedTx) => {
        console.log('Signed transaction:', signedTx);
      });
    }
  }, [dataTx, walletApi]);

  useEffect(() => {
    if (addressRef.current && walletAddress) {
      addressRef.current.value = walletAddress;
    }
  }, [walletAddress]);

  const isSubmitting = fetcher.state === 'submitting';

  return (
    <Tabs className="w-full h-full overflow-hidden" contentClassName="overflow-auto">
      <Tab label="Tx Form">
        <fetcher.Form method="POST" className="flex flex-col gap-8 justify-between h-full">
          <div>
            <input type="hidden" name="ACTION" value="moveShip" />
            <Input
              name="shipNumber"
              type="number"
              placeholder="Enter ship number"
              label="Ship Number"
              disabled={isSubmitting}
              error={errors.shipNumber}
              defaultValue={10}
              required
            />

            <Input
              ref={addressRef}
              name="playerAddress"
              placeholder="Enter player address"
              label="Player Address"
              disabled={isSubmitting}
              error={errors.playerAddress}
              defaultValue={walletAddress ?? ''}
              required
            />

            <Input
              name="positionX"
              type="number"
              placeholder="Enter position X"
              label="Position X"
              disabled={isSubmitting}
              error={errors.positionX}
              required
            />

            <Input
              name="positionY"
              type="number"
              placeholder="Enter position Y"
              label="Position Y"
              disabled={isSubmitting}
              error={errors.positionY}
              required
            />
          </div>

          <div className="flex flex-1 flex-col gap-2 min-h-0">
            {dataTx && (
              <Alert type="success" title="Response">
                {dataTx}
              </Alert>
            )}
            {errors.global && <Alert type="error">{errors.global}</Alert>}
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer w-fit mt-6 disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Moving...' : 'Move ship'}
          </button>
        </fetcher.Form>
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
