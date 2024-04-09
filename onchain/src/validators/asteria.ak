use aiken/list
use aiken/math/rational.{compare_with, from_int}
use aiken/transaction.{InlineDatum, ScriptContext, Spend, Transaction}
use aiken/transaction/value.{ada_asset_name, ada_policy_id}
use asteria/types.{AddNewShip, AssetClass, AsteriaDatum, AsteriaRedeemer, Mine}
use asteria/utils

validator(
  admin_token: AssetClass,
  ship_mint_lovelace_fee: Int,
  max_asteria_mining: Int,
) {
  pub fn spend(
    datum: AsteriaDatum,
    redeemer: AsteriaRedeemer,
    ctx: ScriptContext,
  ) -> Bool {
    let ScriptContext { transaction, purpose } = ctx
    let Transaction { inputs, outputs, .. } = transaction
    let AsteriaDatum { ship_counter, shipyard_policy } = datum
    expect Spend(asteria_ref) = purpose
    expect [asteria_input] =
      list.filter(inputs, fn(input) { input.output_reference == asteria_ref })
    expect [asteria_output] =
      list.filter(
        outputs,
        fn(output) { output.address == asteria_input.output.address },
      )
    expect InlineDatum(asteria_output_datum) = asteria_output.datum
    expect asteria_output_datum: AsteriaDatum = asteria_output_datum
    when redeemer is {
      AddNewShip -> {
        let must_hold_admin_token =
          value.quantity_of(
            asteria_input.output.value,
            admin_token.policy,
            admin_token.name,
          ) > 0
        let must_add_fee =
          asteria_output.value == (
            asteria_input.output.value
              |> value.add(ada_policy_id, ada_asset_name, ship_mint_lovelace_fee)
          )
        let must_increment_counter =
          asteria_output_datum.ship_counter == ship_counter + 1
        let must_preserve_shipyard_policy =
          asteria_output_datum.shipyard_policy == shipyard_policy

        and {
          must_hold_admin_token,
          must_add_fee,
          must_increment_counter,
          must_preserve_shipyard_policy,
        }
      }

      Mine -> {
        expect Some(_) =
          list.find(
            inputs,
            fn(input) {
              utils.is_ship_token_in_utxo(input.output, shipyard_policy)
            },
          )
        expect Some(percentage) = rational.new(max_asteria_mining, 100)
        let rewards = value.lovelace_of(asteria_input.output.value)
        let must_respect_max_mining =
          compare_with(
            from_int(value.lovelace_of(asteria_output.value)),
            >=,
            rational.mul(
              from_int(rewards),
              rational.sub(from_int(1), percentage),
            ),
          )
        let must_preserve_datum = datum == asteria_output_datum
        and {
          must_respect_max_mining,
          must_preserve_datum,
        }
      }
    }
  }
}
