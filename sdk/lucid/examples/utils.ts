import { Utxo } from "https://deno.land/x/lucid@0.20.5/mod.ts";

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export const delay = ms => new Promise(res => setTimeout(res, ms));

export function haveSameUTxOs(utxos_1: Utxo[], utxos_2: Utxo[]): boolean {
  if (utxos_1.length !== utxos_2.length) {
    return false;
  }

  const refs_1 = new Set(utxos_1.map(utxo => utxo.txHash + "#" + utxo.outputIndex));
  const refs_2 = new Set(utxos_2.map(utxo => utxo.txHash + "#" + utxo.outputIndex));

  if (refs_1.size !== refs_2.size) { // Check if the number of unique refs is the same
    return false;
  }

  for (const ref of refs_1) {
    if (!refs_2.has(ref)) {
      return false;
    }
  }
  return true;
}
