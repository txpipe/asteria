use aiken/list.{filter}
use aiken/option
use aiken/transaction.{InlineDatum, Output, ScriptContext, Spend, Transaction}
use aiken/transaction/value.{quantity_of}
use asteria/types.{
  AssetClass, ConsumePellet, PelletDatum, PelletRedeemer, Provide,
}
use asteria/utils

validator(admin_token: AssetClass) {
  pub fn spend(
    datum: PelletDatum,
    redeemer: PelletRedeemer,
    ctx: ScriptContext,
  ) -> Bool {
    let ScriptContext { transaction, purpose } = ctx
    let Transaction { inputs, outputs, .. } = transaction
    when redeemer is {
      Provide(amount) -> {
        let PelletDatum { fuel, shipyard_policy, .. } = datum

        expect Spend(utxo_ref) = purpose
        expect [own_input] =
          list.filter(inputs, fn(input) { input.output_reference == utxo_ref })
        expect [own_output] =
          filter(
            outputs,
            fn(output) { output.address == own_input.output.address },
          )
        expect InlineDatum(out_datum) = own_output.datum
        expect out_datum: PelletDatum = out_datum

        expect Some(_) =
          list.find(
            inputs,
            fn(input) {
              utils.is_ship_token_in_utxo(input.output, shipyard_policy)
            },
          )

        let has_enough_fuel = amount <= fuel
        let own_input_has_admin_token =
          quantity_of(
            own_input.output.value,
            admin_token.policy,
            admin_token.name,
          ) == 1
        let own_output_has_admin_token =
          quantity_of(own_output.value, admin_token.policy, admin_token.name) == 1
        let datum_update_ok =
          out_datum == PelletDatum { ..datum, fuel: fuel - amount }

        and {
          has_enough_fuel?,
          datum_update_ok?,
          own_input_has_admin_token?,
          own_output_has_admin_token?,
        }
      }

      ConsumePellet -> {
        let admin_token_input =
          list.find(
            inputs,
            fn(input) {
              utils.is_wallet_address(input.output.address) && value.quantity_of(
                input.output.value,
                admin_token.policy,
                admin_token.name,
              ) > 0
            },
          )
        option.is_some(admin_token_input)?
      }
    }
  }
}
