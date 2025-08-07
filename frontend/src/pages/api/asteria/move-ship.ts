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
  const positionXValue = formData['positionX'] as string;
  const positionYValue = formData['positionY'] as string;

  const errors: Record<string, string> = {};

  if (!shipNumber) errors.shipNumber = 'Ship number is required';
  if (!playerAddress) errors.playerAddress = 'Player address is required';
  if (!positionXValue) errors.positionX = 'Position X is required';

  const positionX = Number(positionXValue);
  if (Number.isNaN(positionX)) errors.positionX = 'Position X is not a number';

  if (!positionYValue) errors.positionY = 'Position Y is required';
  const positionY = Number(positionYValue);
  if (Number.isNaN(positionY)) errors.positionY = 'Position Y is not a number';

  if (!blockSlot) errors.blockSlot = 'Block Slot is required';
  const blockSlotValue = Number(blockSlot);
  if (Number.isNaN(blockSlotValue)) errors.blockSlot = 'Block Slot is not a number';

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // 83_176_681 <- Get this number from blockfrost using latest epoch from a latest block.
  try {
    const distance = Math.abs(positionX) + Math.abs(positionY);

    const result = await getProtocol(formData['network']).moveShipTx({
      pDeltaX: positionX,
      pDeltaY: positionY,
      player: playerAddress,
      requiredFuel: distance * 60, // fuel_per_step from SpaceTime datum
      shipName: new TextEncoder().encode(`SHIP${shipNumber}`),
      pilotName: new TextEncoder().encode(`PILOT${shipNumber}`),
      tipSlot: blockSlotValue + 300, // 5 minutes from last block
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
