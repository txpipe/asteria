use aiken/list.{filter}
use aiken/transaction.{InlineDatum, ScriptContext, Transaction}
use aiken/transaction/value.{AssetName, PolicyId, quantity_of}
use asteria/types.{PelletDatum, PelletRedeemer, Provide}
use asteria/utils.{is_ship_token_input}

validator(admin_token: (PolicyId, AssetName)) {
  fn spend(
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
        fn(output) { quantity_of(output.value, admin_token.1st, admin_token.2nd) == 1 },
      )

    expect InlineDatum(out_datum) = own_output.datum
    expect out_datum: PelletDatum = out_datum

    let datum_changed_ok =
      out_datum == PelletDatum { ..datum, fuel: fuel - amount }

    is_ship_token_input(inputs, shipyard_policy) && (amount <= fuel) && datum_changed_ok
  }
}
