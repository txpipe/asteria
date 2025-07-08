import { bech32 } from 'bech32';
import { Buffer } from 'buffer';

export enum NetworkId {
  MAINNET = 1,
  TESTNET = 0,
}

export function decodeHexAddress(hex: string) {
  const hexAddress = hex.toLowerCase();
  const addressType = hexAddress.charAt(0);
  const networkId = Number(hexAddress.charAt(1)) as NetworkId;
  const addressBytes = Buffer.from(hexAddress, 'hex');
  const words = bech32.toWords(addressBytes);
  let prefix = ['e', 'f'].includes(addressType) ? 'stake' : 'addr';
  if (networkId === NetworkId.TESTNET) {
    prefix += '_test';
  }

  return bech32.encode(prefix, words, 1000);
}
