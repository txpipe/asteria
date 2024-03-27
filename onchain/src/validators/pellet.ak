use aiken/list.{filter}
use aiken/transaction.{InlineDatum, Output, ScriptContext, Transaction}
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
    let ScriptContext { transaction, .. } = ctx
    let Transaction { inputs, outputs, .. } = transaction

    expect [own_output] =
      filter(
        outputs,
        fn(output) {
          quantity_of(output.value, admin_token.policy, admin_token.name) == 1
        },
      )

    expect InlineDatum(out_datum) = own_output.datum
    expect out_datum: PelletDatum = out_datum

    let has_enough_fuel = amount <= fuel
    let datum_update_ok =
      out_datum == PelletDatum { ..datum, fuel: fuel - amount }

    has_enough_fuel && datum_update_ok && utils.is_ship_token_input(
      inputs,
      shipyard_policy,
    )
  }
}
