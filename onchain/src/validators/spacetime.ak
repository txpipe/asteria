use aiken/list.{is_empty}
use aiken/transaction.{InlineDatum, ScriptContext, Spend, Transaction}
use aiken/transaction/credential.{Address}
use aiken/transaction/value.{from_minted_value, quantity_of}
use asteria/types.{
  AssetClass, GatherFuel, MineAsteria, MoveShip, Quit, ShipDatum, ShipRedeemer,
}
use asteria/utils

validator(
  pellet_validator_address: Address,
  asteria_validator_address: Address,
  _admin_token: AssetClass,
  max_distance: Int,
  max_ship_fuel: Int,
  fuel_per_step: Int,
) {
  pub fn spend(datum: ShipDatum, redeemer: ShipRedeemer, ctx: ScriptContext) -> Bool {
    let ScriptContext { transaction, purpose } = ctx
    let Transaction { inputs, outputs, mint, .. } = transaction
    let ShipDatum {
      fuel,
      pos_x,
      pos_y,
      shipyard_policy,
      ship_token_name,
      pilot_token_name,
    } = datum

    expect Spend(ship_ref) = purpose
    expect [ship_input] =
      list.filter(inputs, fn(input) { input.output_reference == ship_ref })
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

    when redeemer is {
      MoveShip(delta_x, delta_y) -> {
        expect [ship_output] =
          list.filter(
            outputs,
            fn(output) { utils.is_ship_token_in_utxo(output, shipyard_policy) },
          )
        expect InlineDatum(ship_output_datum) = ship_output.datum
        expect ship_output_datum: ShipDatum = ship_output_datum

        let must_hold_ship_token =
          quantity_of(ship_input.output.value, shipyard_policy, ship_token_name) == 1
        let distance = utils.distance(delta_x, delta_y)
        let required_fuel = utils.required_fuel(distance, fuel_per_step)
        let must_have_enough_fuel = required_fuel <= fuel
        let must_preserve_ship_value =
          ship_input.output.value == ship_output.value
        let must_preserve_pilot_token =
          pilot_token_name == ship_output_datum.pilot_token_name
        let must_update_x = ship_output_datum.pos_x == pos_x + delta_x
        let must_update_y = ship_output_datum.pos_y == pos_y + delta_y
        let must_update_fuel = ship_output_datum.fuel == fuel - required_fuel
        let must_respect_max_distance = distance <= max_distance

        and {
          must_hold_ship_token,
          must_have_enough_fuel,
          must_preserve_ship_value,
          must_preserve_pilot_token,
          must_update_x,
          must_update_y,
          must_update_fuel,
          must_respect_max_distance,
        }
      }

      GatherFuel(amount) -> {
        expect [ship_output] =
          list.filter(
            outputs,
            fn(output) { utils.is_ship_token_in_utxo(output, shipyard_policy) },
          )
        expect InlineDatum(ship_output_datum) = ship_output.datum
        expect ship_output_datum: ShipDatum = ship_output_datum
        expect Some(pellet_input) =
          list.find(
            inputs,
            fn(input) { input.output.address == pellet_validator_address },
          )
        expect InlineDatum(pellet_datum) = pellet_input.output.datum
        expect pellet_datum: ShipDatum = pellet_datum

        let must_have_pellet_position =
          pos_x == pellet_datum.pos_x && pos_y == pellet_datum.pos_y
        let must_not_exceed_capacity = fuel + amount <= max_ship_fuel
        let must_update_datum =
          ship_output_datum == ShipDatum { ..datum, fuel: fuel + amount }
        let must_preserve_ship_value =
          ship_input.output.value == ship_output.value

        and {
          must_have_pellet_position,
          must_not_exceed_capacity,
          must_update_datum,
          must_preserve_ship_value,
        }
      }
      MineAsteria -> {
        expect Some(_) =
          list.find(
            inputs,
            fn(input) { input.output.address == asteria_validator_address },
          )
        let must_have_asteria_position = (pos_x, pos_y) == (0, 0)
        let must_burn_ship_token =
          quantity_of(from_minted_value(mint), shipyard_policy, ship_token_name) < 0
        and {
          must_have_asteria_position,
          must_burn_ship_token,
        }
      }
      Quit ->
        is_empty(
          list.filter(
            outputs,
            fn(output) { utils.is_ship_token_in_utxo(output, shipyard_policy) },
          ),
        )
    }
  }
}
