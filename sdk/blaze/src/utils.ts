import { Address, AssetId, NetworkId, TransactionId, TransactionInput } from "@blaze-cardano/core";
import { Unwrapped } from "@blaze-cardano/ogmios";
import { Blaze, ColdWallet, Core, Kupmios } from "@blaze-cardano/sdk";
import { GameIdentifier, OutRef } from "./types";

async function blazeInit(address: string): Promise<Blaze<Kupmios, ColdWallet>> {
    const blaze_address = Core.Address.fromBech32(address);
    const provider = new Kupmios(
        "https://kupo1dce45wncnj6zgxxext7.preview-v2.kupo-m1.demeter.run",
        await Unwrapped.Ogmios.new(
            "https://ogmios13lw5mnhwypg5shrt9eh.preview-v5.ogmios-m1.demeter.run",
        ),
    );
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
