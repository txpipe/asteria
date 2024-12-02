import { Address, AssetId, NetworkId, TransactionId, TransactionInput } from "@blaze-cardano/core";
import { Unwrapped } from "@blaze-cardano/ogmios";
import { Blaze, ColdWallet, Core, Kupmios } from "@blaze-cardano/sdk";
import { GameIdentifier, KupmiosConfig, OutRef } from "./types";

async function blazeInit(address: string, kupmios_config: KupmiosConfig): Promise<Blaze<Kupmios, ColdWallet>> {
    const blaze_address = Core.Address.fromBech32(address);
    const provider = new Kupmios(
        kupmios_config.kupo_url,
        await Unwrapped.Ogmios.new(kupmios_config.ogmios_url)
    )
    const wallet = new ColdWallet(blaze_address, NetworkId.Testnet, provider);

    return Blaze.from(provider, wallet);
}

function utf8ToHex(utf: string): string {
    return Buffer.from(utf).toString("hex");
}

function slotToUnix(
    slot: number,
) {
    const preview_knownTime = 1666656000000;
    const msAfterBegin = slot * 1000;
    return preview_knownTime + msAfterBegin;
}



function outRefToTransactionInput(outref: OutRef): TransactionInput {
    return new TransactionInput(
        TransactionId(outref.tx_hash),
        outref.tx_index,
    );
}

function extractPolicyIdFromAddress(address: Address): string {
    const addressBytes = address.toBytes();
    return addressBytes.slice(2, 58);
}

function subjectToAssetId(subject: string): AssetId {
    const policy_id = subject.slice(0, 56);
    const asset_name = subject.slice(56);
    return AssetId(policy_id + asset_name);
}

export { blazeInit,slotToUnix, utf8ToHex, outRefToTransactionInput, extractPolicyIdFromAddress, subjectToAssetId };
