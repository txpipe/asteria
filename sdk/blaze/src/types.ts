import { Data, Static } from "@blaze-cardano/sdk";

const ShipDatumSchema = Data.Object({
    pos_x: Data.Integer(),
    pos_y: Data.Integer(),
    ship_token_name: Data.Bytes(),
    pilot_token_name: Data.Bytes(),
    tx_latest_posix_time: Data.Integer(),
});

type ShipDatum = Static<typeof ShipDatumSchema>;
const ShipDatum = ShipDatumSchema as unknown as ShipDatum;

const AsteriaDatumSchema = Data.Object({
    ship_counter: Data.Integer(),
    shipyard_policy: Data.Bytes(),
});
type AsteriaDatum = Static<typeof AsteriaDatumSchema>;
const AsteriaDatum = AsteriaDatumSchema as unknown as AsteriaDatum;




type OutRef = {
    tx_hash: string,
    tx_index: bigint    
}


type GameIdentifier = {
    admin_token_subject: string,
    ship_mint_fee: bigint,
    initial_fuel: bigint,
    asteria_utxo: OutRef,
    spacetime_script_reference: OutRef,
    pellet_script_reference: OutRef,
    asteria_script_reference: OutRef,
}

export { ShipDatum, AsteriaDatum, GameIdentifier, OutRef, };


