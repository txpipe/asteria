use aiken/list
use aiken/math
use aiken/transaction.{InlineDatum, ScriptContext, Spend, Transaction}
use aiken/transaction/value.{PolicyId, quantity_of}

type Datum {
  ship_id: ByteArray,
  pos_x: Int,
  pos_y: Int,
  fuel: Int,
}

type Redeemer {
  delta_x: Int,
  delta_y: Int,
}

fn distance(delta_x: Int, delta_y: Int) -> Int {
  math.abs(delta_x) + math.abs(delta_y)
}

// we need to enforce:
// [x] that the speed (manhattan_distance/slot) doesn't exceed an upper bound
// [ ] that the ship has enough fuel (token) to move the desired delta
// [ ] that the new position of the ship utxo equals the last position + delta
// [ ] that the fuel required for the delta has been burned
// [ ] that the tx is signed by the owner of the ship (token holder)

validator(ship_policy_id: PolicyId, max_speed: Int, fuel_per_step: Int) {
  fn spend(datum: Datum, redeemer: Redeemer, ctx: ScriptContext) -> Bool {
    let Redeemer { delta_x, delta_y } = redeemer

    let Datum { ship_id, pos_x, pos_y, fuel } = datum

    let ScriptContext { transaction, purpose } = ctx

    let Transaction { inputs, outputs, .. } = transaction

    expect Spend(utxo_ref) = purpose

    expect Some(own_input) =
      list.find(inputs, fn(input) { input.output_reference == utxo_ref })

    expect Some(own_output) =
      list.find(
        outputs,
        fn(output) { quantity_of(output.value, ship_policy_id, ship_id) == 1 },
      )

    let must_hold_ship_asset =
      quantity_of(own_input.output.value, ship_policy_id, ship_id) == 1

    let distance = distance(delta_x, delta_y)

    // speed = distance since we consider each block the unit of time 
    let must_respect_max_speed = distance <= max_speed

    let must_have_enough_fuel = fuel >= fuel_per_step * distance

    expect InlineDatum(out_data) = own_output.datum

    expect out_data: Datum = out_data

    let final_pos_must_respect_movement =
      out_data.pos_x == pos_x + delta_x && out_data.pos_y == pos_y + delta_y

    let final_ship_id_must_match = out_data.ship_id == ship_id

    must_hold_ship_asset && must_respect_max_speed && must_have_enough_fuel && final_pos_must_respect_movement && final_ship_id_must_match
  }
}
