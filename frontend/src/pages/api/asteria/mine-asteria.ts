import type { NextApiRequest, NextApiResponse } from 'next';

// Utils
import { getProtocol } from '@/utils/cli-protocol';

export type ResponseData = {
  data?: { tx?: string; };
  errors?: Record<string, string>;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    res.status(405).json({ errors: { global: 'Method not allowed' } });
    return;
  }
  const formData = req.body;

  const shipNumber = formData['shipNumber'] as string;
  const blockSlot = formData['blockSlot'] as string;
  const playerAddress = formData['playerAddress'] as string;
  const fuelAmountValue = formData['fuelAmount'] as string;
  const mineAmountValue = formData['mineAmount'] as string;

  const errors: Record<string, string> = {};

  if (!shipNumber) errors.shipNumber = 'Ship number is required';
  if (!playerAddress) errors.playerAddress = 'Player address is required';
  if (!fuelAmountValue) errors.fuelAmount = 'Fuel amount is required';
  if (!mineAmountValue) errors.mineAmount = 'Mine amount is required';
  if (!blockSlot) errors.blockSlot = 'Block Slot is required';

  const fuelAmount = Number(fuelAmountValue);
  if (Number.isNaN(fuelAmount)) errors.fuelAmount = 'Fuel amount is not a number';

  const mineAmount = Number(mineAmountValue);
  if (Number.isNaN(mineAmount)) errors.mineAmount = 'Mine amount is not a number';

  const blockSlotValue = Number(blockSlot);
  if (Number.isNaN(blockSlotValue)) errors.blockSlot = 'Block Slot is not a number';

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const result = await getProtocol(formData['network']).mineAsteriaTx({
      player: playerAddress,
      shipFuel: fuelAmount,
      pilotName: new TextEncoder().encode(`PILOT${shipNumber}`),
      shipName: new TextEncoder().encode(`SHIP${shipNumber}`),
      mineAmount,
      sinceSlot: blockSlotValue - 100,
    });

    return res.json({
      data: {
        tx: result.tx,
      }
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return res.status(400).json({
        errors: {
          global: `${e.message}\nCause: ${JSON.stringify(e.cause)}` || 'Unknown error',
        }
      });
    }
  }

  return res.status(500).json({
    errors: {
      global: 'An unknown error occurred while creating the ship transaction.',
    },
  });
}
