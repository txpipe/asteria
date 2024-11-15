use aiken/collection/dict
use aiken/collection/list.{filter}
use aiken/option
use asteria/types.{
  AssetClass, BurnFuel, ConsumePellet, FuelRedeemer, MintFuel, PelletDatum,
  PelletRedeemer, Provide,
}
use asteria/utils
use cardano/address.{Script}
use cardano/assets.{PolicyId, quantity_of, tokens}
use cardano/transaction.{
  InlineDatum, Output, OutputReference, Transaction, find_input,
}

validator pellet(admin_token: AssetClass) {
  spend(
    datum: Option<PelletDatum>,
    redeemer: PelletRedeemer,
    utxo: OutputReference,
    self: Transaction,
  ) {
    let Transaction { inputs, outputs, .. } = self

    expect Some(pellet_input) = find_input(inputs, utxo)
    expect Script(fuel_policy) = pellet_input.output.address.payment_credential

    let remaining_fuel =
      quantity_of(pellet_input.output.value, fuel_policy, "FUEL")

    when redeemer is {
      Provide(provided_amount) -> {
        expect Some(datum) = datum
        let PelletDatum { shipyard_policy, .. } = datum
        expect [pellet_output] =
          filter(
            outputs,
            fn(output) { output.address == pellet_input.output.address },
          )
        expect InlineDatum(out_datum) = pellet_output.datum
        expect out_datum: PelletDatum = out_datum

        // check if ship_token is present in some input
        let must_input_ship_token =
          option.is_some(
            list.find(
              inputs,
              fn(input) {
                list.any(
                  dict.keys(tokens(input.output.value, shipyard_policy)),
                  fn(name) { utils.has_prefix("SHIP", name) },
                )
              },
            ),
          )

        let must_have_enough_fuel = provided_amount <= remaining_fuel
        let must_hold_admin_token =
          quantity_of(pellet_output.value, admin_token.policy, admin_token.name) == 1
        let must_provide_fuel_amount =
          quantity_of(pellet_output.value, fuel_policy, "FUEL") == remaining_fuel - provided_amount
        let must_preserve_datum = out_datum == datum

        and {
          must_input_ship_token?,
          must_hold_admin_token?,
          must_have_enough_fuel?,
          must_provide_fuel_amount?,
          must_preserve_datum?,
        }
      }

      ConsumePellet -> {
        // check that there is a wallet input with the admin token
        let admin_token_input =
          list.find(
            inputs,
            fn(input) {
              not(utils.is_script_address(input.output.address)) && quantity_of(
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

  mint(redeemer: FuelRedeemer, fuel_policy: PolicyId, self: Transaction) {
    let Transaction { inputs, mint, .. } = self
    let minted_value = mint

    when redeemer is {
      MintFuel -> {
        // check that there is an input with the admin token
        let admin_token_input =
          list.find(
            inputs,
            fn(input) {
              quantity_of(
                input.output.value,
                admin_token.policy,
                admin_token.name,
              ) > 0
            },
          )

        let must_mint_fuel_tokens =
          quantity_of(minted_value, fuel_policy, "FUEL") > 0

        option.is_some(admin_token_input)? && must_mint_fuel_tokens?
      }
      BurnFuel -> {
        let must_burn_fuel_tokens =
          quantity_of(minted_value, fuel_policy, "FUEL") < 0

        must_burn_fuel_tokens?
      }
    }
  }

  else(_) {
    fail
  }
}
