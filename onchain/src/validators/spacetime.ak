use aiken/bytearray
use aiken/dict
use aiken/interval.{Finite}
use aiken/list
use aiken/math/rational
use aiken/option
use aiken/string
use aiken/transaction.{InlineDatum, Mint, ScriptContext, Spend, Transaction}
use aiken/transaction/credential.{
  Address, ScriptCredential, VerificationKeyCredential,
}
use aiken/transaction/value.{from_minted_value, quantity_of}
use asteria/types.{
  AssetClass, AsteriaDatum, BurnShip, GatherFuel, MineAsteria, MintShip,
  MoveShip, PelletDatum, Quit, ScriptAddress, ShipDatum, ShipRedeemer,
  ShipyardRedeemer, Speed,
}
use asteria/utils

validator(
  pellet_validator_address: ScriptAddress,
  asteria_validator_address: ScriptAddress,
  _admin_token: AssetClass,
  max_speed: Speed,
  max_ship_fuel: Int,
  fuel_per_step: Int,
  initial_fuel: Int,
  min_asteria_distance: Int,
) {
  // SPACETIME VALIDATOR:
  pub fn spend(datum: ShipDatum, redeemer: ShipRedeemer, ctx: ScriptContext) -> Bool {
    let ScriptContext { transaction, purpose } = ctx
    let Transaction { inputs, outputs, mint, validity_range, .. } = transaction
    let ShipDatum {
      fuel,
      pos_x,
      pos_y,
      ship_token_name,
      pilot_token_name,
      last_move_latest_time,
    } = datum

    expect Some(max_speed_rational) =
      rational.new(max_speed.distance, max_speed.time)
    expect Spend(ship_ref) = purpose
    expect [ship_input] =
      list.filter(inputs, fn(input) { input.output_reference == ship_ref })
    expect ScriptCredential(shipyard_policy) =
      ship_input.output.address.payment_credential

    expect Some(_) =
      list.find(
        inputs,
        fn(input) {
          utils.is_pilot_token_in_utxo(
            input.output,
            shipyard_policy,
            pilot_token_name,
          )
        },
      )

    let must_hold_ship_token =
      quantity_of(ship_input.output.value, shipyard_policy, ship_token_name) == 1

    when redeemer is {
      MoveShip(delta_x, delta_y) -> {
        expect [ship_output] =
          list.filter(
            outputs,
            fn(output) { output.address == ship_input.output.address },
          )
        expect InlineDatum(ship_output_datum) = ship_output.datum
        expect ship_output_datum: ShipDatum = ship_output_datum
        expect Finite(tx_earliest_time) = validity_range.lower_bound.bound_type
        expect Finite(tx_latest_time) = validity_range.upper_bound.bound_type

        let distance = utils.distance(delta_x, delta_y)
        let required_fuel = utils.required_fuel(distance, fuel_per_step)
        expect Some(speed) =
          rational.new(distance, tx_latest_time - tx_earliest_time)

        let must_preserve_pilot_token =
          pilot_token_name == ship_output_datum.pilot_token_name
        let must_update_x = ship_output_datum.pos_x == pos_x + delta_x
        let must_update_y = ship_output_datum.pos_y == pos_y + delta_y
        let must_update_fuel = ship_output_datum.fuel == fuel - required_fuel
        let must_update_upper_bound =
          ship_output_datum.last_move_latest_time == tx_latest_time
        let must_respect_max_speed =
          rational.compare_with(speed, <=, max_speed_rational)
        let must_respect_latest_time = last_move_latest_time <= tx_earliest_time
        let must_have_enough_fuel = required_fuel <= fuel
        let must_have_token_and_minada =
          list.length(ship_output.value |> value.flatten) == 2 && quantity_of(
            ship_output.value,
            shipyard_policy,
            ship_token_name,
          ) == 1

        and {
          must_update_x?,
          must_update_y?,
          must_update_fuel?,
          must_update_upper_bound?,
          must_hold_ship_token?,
          must_have_enough_fuel?,
          must_preserve_pilot_token?,
          must_respect_max_speed?,
          must_respect_latest_time?,
          must_have_token_and_minada?,
        }
      }

      GatherFuel(amount) -> {
        expect [ship_output] =
          list.filter(
            outputs,
            fn(output) { output.address == ship_input.output.address },
          )
        expect InlineDatum(ship_output_datum) = ship_output.datum
        expect ship_output_datum: ShipDatum = ship_output_datum
        expect Some(pellet_input) =
          list.find(
            inputs,
            fn(input) {
              when input.output.address.payment_credential is {
                VerificationKeyCredential(_) -> False
                ScriptCredential(addr_payment) ->
                  addr_payment == pellet_validator_address
              }
            },
          )
        expect InlineDatum(pellet_datum) = pellet_input.output.datum
        expect pellet_datum: PelletDatum = pellet_datum
        expect Finite(tx_earliest_time) = validity_range.lower_bound.bound_type

        let must_have_pellet_position =
          pos_x == pellet_datum.pos_x && pos_y == pellet_datum.pos_y
        let must_not_exceed_capacity = fuel + amount <= max_ship_fuel
        let must_update_datum =
          ship_output_datum == ShipDatum { ..datum, fuel: fuel + amount }
        let must_respect_latest_time = last_move_latest_time <= tx_earliest_time
        let must_have_token_and_minada =
          list.length(ship_output.value |> value.flatten) == 2 && quantity_of(
            ship_output.value,
            shipyard_policy,
            ship_token_name,
          ) == 1

        and {
          must_hold_ship_token?,
          must_have_pellet_position?,
          must_not_exceed_capacity?,
          must_update_datum?,
          must_respect_latest_time?,
          must_have_token_and_minada?,
        }
      }
      MineAsteria -> {
        expect Some(_) =
          list.find(
            inputs,
            fn(input) {
              when input.output.address.payment_credential is {
                VerificationKeyCredential(_) -> False
                ScriptCredential(addr_payment) ->
                  addr_payment == asteria_validator_address
              }
            },
          )
        expect Finite(tx_earliest_time) = validity_range.lower_bound.bound_type

        let must_have_asteria_position = (pos_x, pos_y) == (0, 0)
        let must_burn_ship_token =
          quantity_of(from_minted_value(mint), shipyard_policy, ship_token_name) < 0
        let must_respect_latest_time = last_move_latest_time <= tx_earliest_time

        and {
          must_hold_ship_token?,
          must_have_asteria_position?,
          must_burn_ship_token?,
          must_respect_latest_time?,
        }
      }
      Quit -> {
        let must_burn_ship_token =
          quantity_of(from_minted_value(mint), shipyard_policy, ship_token_name) < 0
        and {
          must_hold_ship_token?,
          must_burn_ship_token?,
        }
      }
    }
  }

  // SHIPYARD POLICY:
  pub fn mint(redeemer: ShipyardRedeemer, ctx: ScriptContext) -> Bool {
    let ScriptContext { transaction, purpose } = ctx
    let Transaction { inputs, outputs, mint, validity_range, .. } = transaction
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
            fn(input) {
              when input.output.address.payment_credential is {
                VerificationKeyCredential(_) -> False
                ScriptCredential(addr_payment) ->
                  addr_payment == asteria_validator_address
              }
            },
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
          transaction.find_script_outputs(outputs, policy_id)
        expect InlineDatum(ship_datum) = ship_state.datum
        expect ship_datum: ShipDatum = ship_datum
        expect Finite(tx_latest_time) = validity_range.upper_bound.bound_type

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
        let must_respect_min_distance =
          utils.distance(ship_datum.pos_x, ship_datum.pos_y) >= min_asteria_distance
        let must_have_initial_fuel = ship_datum.fuel == initial_fuel
        let must_have_ship_name = ship_datum.ship_token_name == ship_token_name
        let must_have_pilot_name =
          ship_datum.pilot_token_name == pilot_token_name
        let must_have_latest_time =
          ship_datum.last_move_latest_time == tx_latest_time
        let must_have_token_and_minada =
          list.length(ship_state.value |> value.flatten) == 2 && quantity_of(
            ship_state.value,
            policy_id,
            ship_token_name,
          ) == 1

        and {
          must_mint_two_assets?,
          must_respect_ship_name?,
          must_respect_pilot_name?,
          must_respect_min_distance?,
          must_have_initial_fuel?,
          must_have_ship_name?,
          must_have_pilot_name?,
          must_have_latest_time?,
          must_have_token_and_minada?,
        }
      }

      BurnShip -> {
        let ship_input =
          list.find(
            inputs,
            fn(input) { utils.is_ship_token_in_utxo(input.output, policy_id) },
          )
        expect [(_, -1)] = minted_tokens
        option.is_some(ship_input)?
      }
    }
  }
}
