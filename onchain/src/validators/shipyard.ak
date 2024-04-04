use aiken/bytearray
use aiken/dict
use aiken/list
use aiken/string
use aiken/transaction.{InlineDatum, Mint, ScriptContext, Transaction}
use aiken/transaction/credential.{Address}
use aiken/transaction/value
use asteria/types.{AsteriaDatum,
  BurnShip, MintShip, ShipDatum, ShipyardRedeemer}
use asteria/utils

validator(
  asteria_validator_address: Address,
  spacetime_validator_address: Address,
  initial_fuel: Int,
  min_distance: Int,
) {
  pub fn mint(redeemer: ShipyardRedeemer, ctx: ScriptContext) -> Bool {
    let ScriptContext { transaction, purpose } = ctx
    let Transaction { inputs, outputs, mint, .. } = transaction
    expect Mint(policy_id) = purpose
    let minted_tokens =
      mint
        |> value.from_minted_value
        |> value.tokens(policy_id)
        |> dict.to_list()

    when redeemer is {
      MintShip -> {
        expect Some(asteria_input) =
          list.find(
            inputs,
            fn(input) { input.output.address == asteria_validator_address },
          )
        expect InlineDatum(asteria_datum) = asteria_input.output.datum
        expect asteria_datum: AsteriaDatum = asteria_datum
        expect [(ship_token_name, 1)] =
          list.filter(
            minted_tokens,
            fn(token) { utils.has_prefix("SHIP", token.1st) },
          )
        expect [(pilot_token_name, 1)] =
          list.filter(
            minted_tokens,
            fn(token) { utils.has_prefix("PILOT", token.1st) },
          )

        expect [ship_state] =
          list.filter(
            outputs,
            fn(output) { output.address == spacetime_validator_address },
          )
        expect InlineDatum(ship_datum) = ship_state.datum
        expect ship_datum: ShipDatum = ship_datum

        let must_respect_ship_name =
          ship_token_name == bytearray.concat(
            "SHIP",
            bytearray.from_string(string.from_int(asteria_datum.ship_counter)),
          )
        let must_respect_pilot_name =
          pilot_token_name == bytearray.concat(
            "PILOT",
            bytearray.from_string(string.from_int(asteria_datum.ship_counter)),
          )
        let must_mint_two_assets = list.length(minted_tokens) == 2
        let must_have_initial_fuel = ship_datum.fuel == initial_fuel
        let must_respect_min_distance =
          utils.distance(ship_datum.pos_x, ship_datum.pos_y) >= min_distance
        let must_have_policy = ship_datum.shipyard_policy == policy_id
        let must_have_ship_name = ship_datum.ship_token_name == ship_token_name
        let must_have_pilot_name =
          ship_datum.pilot_token_name == pilot_token_name
        let must_hold_ship_token =
          value.quantity_of(ship_state.value, policy_id, ship_token_name) == 1

        and {
          must_mint_two_assets,
          must_respect_ship_name,
          must_respect_pilot_name,
          must_have_initial_fuel,
          must_respect_min_distance,
          must_have_policy,
          must_have_ship_name,
          must_have_pilot_name,
          must_hold_ship_token,
        }
      }

      BurnShip -> {
        expect Some(ship_input) =
          list.find(
            inputs,
            fn(input) { utils.is_ship_token_in_utxo(input.output, policy_id) },
          )
        expect InlineDatum(ship_datum) = ship_input.output.datum
        expect ship_datum: ShipDatum = ship_datum
        expect [(_, -1)] = minted_tokens
        ship_datum.pos_x == 0 && ship_datum.pos_y == 0
      }
    }
  }
}
