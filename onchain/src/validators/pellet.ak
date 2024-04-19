use aiken/list.{filter}
use aiken/transaction.{InlineDatum, Output, ScriptContext, Spend, Transaction}
use aiken/transaction/value.{quantity_of}
use asteria/types.{AssetClass, PelletDatum, PelletRedeemer, Provide}
use asteria/utils

validator(admin_token: AssetClass) {
  pub fn spend(
    datum: PelletDatum,
    redeemer: PelletRedeemer,
    ctx: ScriptContext,
  ) -> Bool {
    let Provide(amount) = redeemer
    let PelletDatum { fuel, shipyard_policy, .. } = datum
    let ScriptContext { transaction, purpose } = ctx
    let Transaction { inputs, outputs, .. } = transaction

    expect Spend(utxo_ref) = purpose
    expect [own_input] =
      list.filter(inputs, fn(input) { input.output_reference == utxo_ref })
    expect [own_output] =
      filter(
        outputs,
        fn(output) {
          quantity_of(output.value, admin_token.policy, admin_token.name) == 1
        },
      )
    expect InlineDatum(out_datum) = own_output.datum
    expect out_datum: PelletDatum = out_datum

    expect Some(_) =
      list.find(
        inputs,
        fn(input) { utils.is_ship_token_in_utxo(input.output, shipyard_policy) },
      )

    let has_enough_fuel = amount <= fuel
    let own_input_has_admin_token =
      quantity_of(own_input.output.value, admin_token.policy, admin_token.name) == 1
    let value_not_changed = own_input.output.value == own_output.value
    let datum_update_ok =
      out_datum == PelletDatum { ..datum, fuel: fuel - amount }

    and {
      has_enough_fuel?,
      datum_update_ok?,
      value_not_changed?,
      own_input_has_admin_token?,
    }
  }
}
