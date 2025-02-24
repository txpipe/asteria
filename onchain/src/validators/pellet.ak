use aiken/collection/dict
use aiken/collection/list.{filter}
use aiken/collection/pairs
use aiken/option
use asteria/types.{
  AddNewShip, AssetClass, BurnFuel, ConsumePellet, FuelRedeemer, MintFuel,
  PelletDatum, PelletRedeemer, Provide,
}
use asteria/utils
use cardano/address.{Script, VerificationKey}
use cardano/assets.{PolicyId, quantity_of, tokens}
use cardano/transaction.{
  InlineDatum, Output, OutputReference, Spend, Transaction, find_input,
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

    when redeemer is {
      Provide(provided_amount) -> {
        expect [pellet_output] =
          filter(
            outputs,
            fn(output) { output.address == pellet_input.output.address },
          )
        expect Output {
          address: _,
          value: pellet_value,
          datum: InlineDatum(pellet_datum),
          reference_script: None,
        } = pellet_output

        // check for correct pellet output datum
        let must_preserve_datum = {
          expect pellet_datum: PelletDatum = pellet_datum
          Some(pellet_datum) == datum
        }

        // check for correct pellet output value
        // implies that there is enough fuel
        let must_provide_fuel_amount = {
          let expected_pellet_value =
            pellet_input.output.value
              |> assets.add(fuel_policy, "FUEL", -provided_amount)
          pellet_value == expected_pellet_value
        }

        // check if ship_token is present in some input
        expect Some(datum) = datum
        let PelletDatum { shipyard_policy, .. } = datum
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

        and {
          must_input_ship_token?,
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
    let Transaction { inputs, mint, redeemers, .. } = self

    // only "FUEL" can be minted, extract amount
    expect [Pair("FUEL", amount)] =
      mint
        |> tokens(fuel_policy)
        |> dict.to_pairs()

    when redeemer is {
      MintFuel -> {
        // fuel can be minted by admin when creating a Pellet
        // or by a user when creating a ship (Asteria is spent)

        // there is an input with the admin token
        expect Some(admin_token_input) =
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

        // admin token is in a wallet input
        let must_be_admin =
          not(utils.is_script_address(admin_token_input.output.address))

        // admin token is in an Asteria input with redeemer AddNewShip
        let must_be_add_new_ship =
          when admin_token_input.output.address.payment_credential is {
            VerificationKey(_) -> False
            Script(addr_payment) -> {
              // it is a script and not a pellet, then it is Asteria
              let must_be_asteria = addr_payment != fuel_policy

              let asteria_purpose = Spend(admin_token_input.output_reference)
              let asteria_redeemer: Data = AddNewShip
              let must_be_correct_purpose =
                pairs.get_all(redeemers, asteria_purpose) == [asteria_redeemer]

              must_be_asteria? && must_be_correct_purpose?
            }
          }

        amount > 0 && ( must_be_admin? || must_be_add_new_ship? )
      }
      BurnFuel -> amount < 0
    }
  }

  else(_) {
    fail
  }
}
