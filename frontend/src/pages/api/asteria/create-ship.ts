import type { NextApiRequest, NextApiResponse } from 'next';
import { ArgValue } from "tx3-sdk/trp";

// Utils
import { protocol } from '@/utils/cli-protocol';

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
    return res.json({
      errors,
    });
  }

  try {
    const result = await protocol.createShipTx({
      player: ArgValue.from(playerAddress),
      pPosX: ArgValue.from(positionX),
      pPosY: ArgValue.from(positionY),
      txLatestPosixTime: ArgValue.from(blockSlotValue + 300), // 5 minutes from last block
      pilotName: ArgValue.from(new TextEncoder().encode(`PILOT${shipNumber}`)),
      shipName: ArgValue.from(new TextEncoder().encode(`SHIP${shipNumber}`)),
    });
    return res.json({
      data: {
        tx: result.tx,
      }
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log('Cause', e.cause);
      console.log('Message', e.message);
      return res.status(400).json({
        errors: {
          global: (typeof e.cause === 'string' ? e.cause : e.message) || 'Unknown error',
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


