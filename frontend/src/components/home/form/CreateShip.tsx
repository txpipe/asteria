import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// Components
import { Code } from '@/components/ui/Code';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { CopyButton } from '@/components/CopyButton';
import { Tab, Tabs } from '@/components/Tabs';

// Pages
import type { ResponseData } from '@/pages/api/asteria/create-ship';

// Store
import { useWallet } from '@/stores/wallet';

const tx3File = `// Asteria player
party Player; // Sent by Form

// Tx3 transaction for creating a ship
tx createShip(
    p_pos_x: Int, // Ship Position X
    p_pos_y: Int, // Ship Position Y
    tx_latest_posix_time: Int,
    ship_name: Bytes, // Name of the ship
    pilot_name: Bytes, // Name of the pilot
) {
    locals {
        shipshard_policy_hash: 0xf9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20,
        initial_fuel: 480, // Should be taken from spaceTime datum
        ship_mint_lovelace_fee: 1000000, // Should be taken from asteria script datum
    }

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

    input spaceTime {
        ref: 0x41e5881cd3bdc3f08bcf341796347e9027e3bcd8d58608b4fcfca5c16cbf5921#0,
        datum_is: SpaceTimeDatum,
    }

    input asteria {
        // Asteria Contract
        from: "addr_test1wqdsuy97njefz53rkhd4v6a2kuqk0md5mrn996ygwekrdyq369wjg",
        min_amount: AdminToken(1),
        datum_is: AsteriaDatum,
    }

    // Optional mint/burn blocks
    // mint {
    //     amount: AnyAsset(shipshard_policy_hash, "PILOT" + asteria.ship_counter + 1, 1)
    //         + AnyAsset(shipshard_policy_hash, "SHIP" + asteria.ship_counter + 1, 1),
    //     redeemer: (),
    // }
    mint {
        amount: AnyAsset(shipshard_policy_hash, pilot_name, 1)
            + AnyAsset(shipshard_policy_hash, ship_name, 1),
        redeemer: (),
    }

    mint {
        // amount: Fuel(spaceTime.initial_fuel),
        amount: Fuel(initial_fuel),
        redeemer: (),
    }

    // Output blocks
    output {
        to: Player,
        amount: source - fees - Ada(ship_mint_lovelace_fee) + AnyAsset(shipshard_policy_hash, pilot_name, 1),
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
        // amount: AnyAsset(shipshard_policy_hash, ship_name, 1) + Fuel(spaceTime.initial_fuel),
        amount: AnyAsset(shipshard_policy_hash, ship_name, 1) + Fuel(initial_fuel),
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
  player: playerAddress,
  pPosX: positionX,
  pPosY: positionY,
  txLatestPosixTime: blockSlotValue + 300, // 5 minutes from last block
  pilotName: new TextEncoder().encode(\`PILOT\${shipNumber}\`),
  shipName: new TextEncoder().encode(\`SHIP\${shipNumber}\`),
});`;

export function CreateShip() {
  const pathname = usePathname() || '';
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState<ResponseData>({});
  const [position, setPosition] = useState<{ x: number; y: number }|null>(null);

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
    window.addEventListener('message', (event) => {
      if (pathname.includes('how-to-play')) {
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
    window.GODOT_BRIDGE?.send({ action: 'move_map', x, y });
  }

  const handlePreview = () => {
    const { x, y } = position || { x: 0, y: 0 };
    window.GODOT_BRIDGE?.send({ action: 'move_map', x, y });
    window.GODOT_BRIDGE?.send({ action: 'create_placeholder', x, y });
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormState({});
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    try {
      const res = await fetch('/api/asteria/create-ship', {
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
        <p className="mt-6 text-md text-[#F1E9D9] font-dmsans-regular leading-7">
          Creates a `ShipState` UTxO locking min ada and a `ShipToken` (minted in this tx), specifying in the datum the initial `pos_x` and `pos_y` coordinates of the ship, and setting `fuel` to an initial amount. Also adds to the `AsteriaUTxO` value the `SHIP_MINT_FEE` paid by the user.
        </p>
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
                defaultValue={0}
                disabled={submitting}
                required
                containerClassName="flex-1"
                value={position?.x ?? '0'}
                onChange={updatePositionX}
              />

              <Input
                name="positionY"
                type="number"
                placeholder="Enter position Y"
                label="Position Y"
                error={errors.positionY}
                defaultValue={0}
                disabled={submitting}
                required
                containerClassName="flex-1"
                value={position?.y ?? '0'}
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
              className="basis-1/2 font-monocraft-regular text-black bg-[#07F3E6] py-2 px-4 rounded-full text-md"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>

            <button
              type="button"
              className="basis-1/2 font-monocraft-regular text-[#07F3E6] border border-[#07F3E6] py-2 px-4 rounded-full text-md"
              onClick={handlePreview}
            >
              Preview
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
