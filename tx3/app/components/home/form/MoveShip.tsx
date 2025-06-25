import { protocol } from '@tx3/protocol';
import { useEffect, useRef } from 'react';
import { data, useFetcher } from 'react-router';
import type { TxEnvelope } from 'tx3-sdk/trp';

// Components
import { Input } from '~/components/ui/input';
import { AsteriaMap } from '~/components/AsteriaMap';

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
    <div className="grid grid-cols-2 gap-4">
      <fetcher.Form method="POST" className="border border-gray-500 p-4 rounded-lg w-xl">
        <h2 className="text-2xl font-medium">Move ship</h2>
        {dataTx && (
          <div className="w-full bg-green-100 border-green-500 text-green-500 border-l-4 px-4 py-3 rounded mt-4 wrap-break-word">
            {dataTx}
          </div>
        )}
        {errors.global && (
          <div className="w-full bg-red-100 border-red-500 text-red-500 border-l-4 px-4 py-3 rounded mt-4 wrap-break-word">
            {errors.global}
          </div>
        )}
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

        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer w-fit mt-6 disabled:bg-blue-400 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Moving...' : 'Move ship'}
        </button>
      </fetcher.Form>
      <AsteriaMap
        apiUrl="https://8000-skillful-employee-kb9ou6.us1.demeter.run/graphql"
        shipyardPolicyId="f9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20"
        fuelPolicyId="fc8ad4f84181b85dc04f7b8c2984b129284c4e272ef45cd6440575fd4655454c"
        shipAddress="addr_test1wru5jl7xf6rufkjwcmft6x5rnd40zznhcyyp0km3gwkr6gq6sxzm6"
        fuelAddress="addr_test1wr7g448cgxqmshwqfaacc2vyky5jsnzwyuh0ghxkgszhtlgzrxj63"
        asteriaAddress="addr_test1wqdsuy97njefz53rkhd4v6a2kuqk0md5mrn996ygwekrdyq369wjg"
        className="aspect-square w-xl"
      />
    </div>
  );
}
