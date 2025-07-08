import { protocol } from '@tx3/protocol';
import { useActionState, useEffect, useRef, useState } from 'react';

// Components
import { Code } from '@/components/ui/Code';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { CopyButton } from '@/components/CopyButton';
import { Tab, Tabs } from '@/components/Tabs';

// Store
import { useWallet } from '@/stores/wallet';

const tx3File = `// Asteria player
party Player; // Sent by Form

// Tx3 transaction for creating a ship
tx createShip(
    p_pos_x: Int, // Ship Position X - Sent by the action
    p_pos_y: Int, // Ship Position Y - Sent by the action
    initial_fuel: Int, // Initial Fuel - Sent by the action
    tx_latest_posix_time: Int, // Last Block Slot + 5 minutes - Sent by the action
    ship_mint_lovelace_fee: Int, // Lovelace fee for minting ship - Sent by the action
    ship_name: Bytes, // Name of the ship - Sent by the action doing 'SHIP{shipNumber}' - shipNumber from Form
    pilot_name: Bytes, // Name of the pilot - Sent by the action doing 'PILOT{shipNumber}' - shipNumber from Form
) {
    validity {
        until_slot: tx_latest_posix_time, // Transaction must be valid until this slot
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

    // Asteria
    reference AsteriaRef {
        ref: 0x39871aab15b7c5ab1075ba431d7475f3977fe40fbb8d654b6bdf6f6726659277#0,
    }

    // Input blocks
    // Ensure that the Player has the required assets
    input source {
        from: Player,
        min_amount: fees + Ada(ship_mint_lovelace_fee),
    }

    // Get asteria information (last ship counter and shipyard policy)
    input asteria {
        from: "addr_test1wqdsuy97njefz53rkhd4v6a2kuqk0md5mrn996ygwekrdyq369wjg",
        min_amount: AdminToken(1),
        datum_is: AsteriaDatum,
    }

    // Mint Pilot and Ship tokens
    mint {
        amount: AnyAsset(0xf9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20, pilot_name, 1)
            + AnyAsset(0xf9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20, ship_name, 1),
        redeemer: (),
    }

    mint {
        amount: Fuel(initial_fuel),
        redeemer: (),
    }

    // Output blocks
    output {
        to: Player,
        amount: source - fees - Ada(ship_mint_lovelace_fee) + AnyAsset(0xf9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20, pilot_name, 1),
    }

    // Output - Pay to Contract
    output {
        // Asteria Contract
        to: "addr_test1wqdsuy97njefz53rkhd4v6a2kuqk0md5mrn996ygwekrdyq369wjg",
        amount: asteria + Ada(ship_mint_lovelace_fee),
        datum: AsteriaDatum {
            ship_counter: asteria.ship_counter + 1,
            shipyard_policy: asteria.shipyard_policy,
        },
    }

    output {
        // SpaceTime Contract
        to: "addr_test1wru5jl7xf6rufkjwcmft6x5rnd40zznhcyyp0km3gwkr6gq6sxzm6",
        // to: ShipShardPolicy,
        amount: AnyAsset(0xf9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20, ship_name, 1) + Fuel(initial_fuel),
        datum: ShipDatum {
            pos_x: p_pos_x,
            pos_y: p_pos_y,
            ship_token_name: ship_name,
            pilot_token_name: pilot_name,
            last_move_latest_time: tx_latest_posix_time,
        },
    }
}`;

const jsFile = `const result = await protocol.createShipTx({
  initialFuel: 480, // From SpaceTime datum
  pilotName: new TextEncoder().encode(\`PILOT\${shipNumber}\`),
  player: playerAddress,
  pPosX: 20,
  pPosY: 20,
  shipMintLovelaceFee: 1_000_000,
  txLatestPosixTime: lastBlock.slot + 300, // 5 minutes from last block
  shipName: new TextEncoder().encode(\`SHIP\${shipNumber}\`),
});`;

const initialState = {
  tx: null,
  errors: null,
};

type ActionState = typeof initialState;

async function createShipAction(_initialState: ActionState, formData: FormData) {
    'use server';

    const shipNumber = formData.get('shipNumber') as string;
    const playerAddress = formData.get('playerAddress') as string;
    const positionXValue = formData.get('positionX') as string;
    const positionYValue = formData.get('positionY') as string;

    const errors: Record<string, string> = {};

    if (!playerAddress) errors.playerAddress = 'Player address is required';

    if (!positionXValue) errors.positionX = 'Position X is required';
    const positionX = Number(positionXValue);
    if (Number.isNaN(positionX)) errors.positionX = 'Position X is not a number';

    if (!positionYValue) errors.positionY = 'Position Y is required';
    const positionY = Number(positionYValue);
    if (Number.isNaN(positionY)) errors.positionY = 'Position Y is not a number';

    if (Object.keys(errors).length > 0) {
      return {
        errors,
      }
    }

    // 83_176_681 <- Get this number from blockfrost using latest epoch from a latest block.
    try {
      const lastBlock = await (await fetch(`${process.env.BLOCKFROST_URL}/blocks/latest`)).json();
      const result = await protocol.createShipTx({
        player: playerAddress,
        pPosX: positionX,
        pPosY: positionY,
        txLatestPosixTime: lastBlock.slot + 300, // 5 minutes from last block
        pilotName: new TextEncoder().encode(`PILOT${shipNumber}`),
        shipName: new TextEncoder().encode(`SHIP${shipNumber}`),
      });
      return {
        tx: result.tx,
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.log('Cause', e.cause);
        console.log('Message', e.message);
        return {
          errors: {
            global: (typeof e.cause === 'string' ? e.cause : e.message) || 'Unknown error',
          }
        };
      }
    }
  }

export function CreateShip() {
  const [state, formAction, submitting] = useActionState(createShipAction, initialState)

  const walletApi = useWallet((s) => s.api);
  const walletAddress = useWallet((s) => s.changeAddress);
  const addressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.tx && walletApi) {
      walletApi.signTx(state.tx, true).then((signedTx) => {
        console.log('Signed transaction:', signedTx);
      }).catch((error) => {
        console.log('Error signing transaction:', error)
      });
    }
  }, [state?.tx, walletApi]);

  useEffect(() => {
    if (addressRef.current && walletAddress) {
      addressRef.current.value = walletAddress;
    }
  }, [walletAddress]);

  return (
    <Tabs className="w-full h-full overflow-hidden" contentClassName="overflow-auto">
      <Tab label="Tx Form">
        <form className="flex flex-col gap-8 justify-between h-full" action={formAction}>
          <div>
            <Input
              name="shipNumber"
              type="number"
              placeholder="Enter ship number"
              label="Ship Number"
              error={state?.errors?.shipNumber}
              defaultValue={10}
              disabled={submitting}
              required
            />

            <Input
              ref={addressRef}
              name="playerAddress"
              placeholder="Enter player address"
              label="Player Address"
              error={state?.errors?.playerAddress}
              defaultValue={walletAddress ?? ''}
              disabled={submitting}
              required
            />

            <div className="w-full flex flex-row gap-x-4">
              <Input
                name="positionX"
                type="number"
                placeholder="Enter position X"
                label="Position X"
                error={state?.errors?.positionX}
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
                error={state?.errors?.positionY}
                defaultValue={20}
                disabled={submitting}
                required
                containerClassName="flex-1"
              />
            </div>
          </div>

          {state?.tx && (
            <Alert type="success" title="Response">
              {state.tx}
            </Alert>
          )}

          {state?.errors?.global && <Alert type="error">{state?.errors?.global}</Alert>}

          <div className="flex flex-row">
            <button
              type="submit"
              className="basis-1/2 font-monocraft-regular text-black bg-[#07F3E6] py-2 px-4 rounded-full text-md"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
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
