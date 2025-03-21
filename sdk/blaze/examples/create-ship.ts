import { Kupmios } from "@blaze-cardano/sdk";
import { createShip } from "../src";
import { GameIdentifier, OutRef } from "../src/types";
import { Unwrapped } from "@blaze-cardano/ogmios";

async function main() {
    const address =
        "addr_test1qzjpgxkhe06gxzstfhywg02ggy5ltuwne6mfr406dlf0mpwp9a07r34cwsnkpn44tllxuydw4wp0xvstw5jqv5q9lszsk2qynn";

    const provider = new Kupmios(
        process.env.KUPO_URL!,
        await Unwrapped.Ogmios.new(process.env.OGMIOS_URL!)
    );

    const spacetime_script_reference: OutRef = {
        tx_hash:
            "41e5881cd3bdc3f08bcf341796347e9027e3bcd8d58608b4fcfca5c16cbf5921",
        tx_index: 0n,
    };

    const pellet_script_reference: OutRef = {
        tx_hash:
            "ba6fab625d70a81f5d1b699e7efde4b74922d06224bef1f6b84f3adf0a61f3f3",
        tx_index: 0n,
    };

    const asteria_script_reference: OutRef = {
        tx_hash:
            "39871aab15b7c5ab1075ba431d7475f3977fe40fbb8d654b6bdf6f6726659277",
        tx_index: 0n,
    };

    const pos_x = 20n;
    const pos_y = 20n;

    const gameIdentifier: GameIdentifier = {
        spacetime_script_reference,
        pellet_script_reference,
        asteria_script_reference,
    };

    const tx = await createShip(
        provider,
        address,
        gameIdentifier,
        pos_x,
        pos_y,
    );

    return tx;
}

main().then((tx) => {
    console.log(tx.toCbor());
});