/**
 * CIP-30 Cardano dApp-Wallet Web Bridge Type Definitions
 * Based on the official CIP-30 specification
 */

// Basic types
type HexString = string;
type Address = HexString;
type Value = HexString;
type TransactionHash = HexString;
type Cbor = HexString;

// Network ID enum
enum NetworkId {
  TESTNET = 0,
  MAINNET = 1,
}

// Pagination
interface Paginate {
  page: number;
  limit: number;
}

// Extensions
interface Extension {
  cip: number;
}

// Wallet API (enabled wallet interface)
declare interface CardanoWalletAPI {
  // Core API methods
  getNetworkId(): Promise<NetworkId>;
  getUtxos(amount?: Cbor, paginate?: Paginate): Promise<HexString[] | null>;
  getBalance(): Promise<Value>;
  getUsedAddresses(paginate?: Paginate): Promise<Address[]>;
  getUnusedAddresses(): Promise<Address[]>;
  getChangeAddress(): Promise<Address>;
  getRewardAddresses(): Promise<Address[]>;
  signTx(tx: Cbor, partialSign?: boolean): Promise<Cbor>;
  signData(
    addr: Address,
    payload: HexString,
  ): Promise<{
    signature: HexString;
    key: HexString;
  }>;
  submitTx(tx: Cbor): Promise<TransactionHash>;

  // Optional experimental methods
  getCollateral?(params?: { amount?: Value }): Promise<HexString[] | null>;

  // Extension support
  experimental?: {
    // biome-ignore lint/suspicious/noExplicitAny: Allow any type for experimental features
    [key: string]: any;
  };
}

// Wallet Info (before enabling)
declare interface CardanoWalletInfo {
  name: string;
  icon: string;
  apiVersion: string;
  enable(): Promise<CardanoWalletAPI>;
  isEnabled(): Promise<boolean>;
  supportedExtensions?: Extension[];

  // Optional experimental features
  experimental?: {
    // biome-ignore lint/suspicious/noExplicitAny: Allow any type for experimental features
    [key: string]: any;
  };
}

// Main Cardano interface
interface Cardano {
  [walletName: string]: CardanoWalletInfo;
}

interface Window {
  cardano?: Cardano;
}
