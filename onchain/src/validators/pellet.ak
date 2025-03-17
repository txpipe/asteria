use aiken/collection/dict
use aiken/collection/list.{filter}
use aiken/collection/pairs
use aiken/interval.{Finite}
use aiken/option
use aiken/primitive/bytearray.{starts_with}
use asteria/types.{
  AddNewShip, AssetClass, BurnFuel, ConsumePellet, FuelRedeemer, GatherFuel,
  MintFuel, PelletDatum, PelletRedeemer, Provide, ShipDatum,
}
use asteria/utils
use cardano/address.{Address, Script, VerificationKey}
use cardano/assets.{
  PolicyId, add, quantity_of, reduce, restricted_to, tokens, zero,
}
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
    let Transaction { inputs, outputs, mint, validity_range, redeemers, .. } =
      self

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
        expect PelletDatum { pos_x, pos_y, shipyard_policy } = pellet_datum

        // check for correct pellet output datum
        let must_preserve_datum = {
          expect pellet_datum: PelletDatum = pellet_datum
          Some(pellet_datum) == datum
        }

        // check for correct pellet output value
        let must_have_correct_value = {
          let in_value = pellet_input.output.value

          // exact amounts are checked for lovelace, admin token and fuel
          // NOTE: depending on off-chain implementation, pellets may or may
          // not have admin token. if they have, they must not leave the pellet.
          let base_policies = ["", admin_token.policy, fuel_policy]
          let expected_pellet_value =
            restricted_to(in_value, base_policies)
              |> add(fuel_policy, "FUEL", -provided_amount)
          let base_checks =
            restricted_to(pellet_value, base_policies) == expected_pellet_value

          // avoid token spamming: other tokens (prize tokens) can only be removed
          let other_checks =
            reduce(
              pellet_value,
              True,
              fn(policy_id, asset_name, out_amount, res) {
                let in_amount = quantity_of(in_value, policy_id, asset_name)
                res && out_amount <= in_amount
              },
            )

          base_checks && other_checks
        }

        // check for exactly one ship input with correct state and redeemer
        expect [ship_input] =
          list.filter(
            inputs,
            fn(input) {
              when input.output.address is {
                Address(Script(addr_payment), None) ->
                  addr_payment == shipyard_policy
                _ -> False
              }
            },
          )
        expect Output {
          address: _,
          value: ship_value,
          datum: InlineDatum(ship_datum),
          reference_script: None,
        } = ship_input.output

        let ship_must_be_valid = {
          expect [ship_token_name] =
            dict.keys(tokens(ship_value, shipyard_policy))
          starts_with(ship_token_name, "SHIP")
        }

        // gathered fuel amount must be equal to amount provided by pellet
        let ship_must_have_correct_redeemer = {
          let ship_purpose = Spend(ship_input.output_reference)
          let ship_redeemer: Data = GatherFuel(provided_amount)
          pairs.get_all(redeemers, ship_purpose) == [ship_redeemer]
        }

        // check ship datum
        expect ShipDatum {
          pos_x: ship_pos_x,
          pos_y: ship_pos_y,
          last_move_latest_time,
          ..
        } = ship_datum

        let ship_must_have_correct_position =
          (pos_x, pos_y) == (ship_pos_x, ship_pos_y)

        let must_respect_latest_time = {
          expect Finite(tx_earliest_time) =
            validity_range.lower_bound.bound_type
          last_move_latest_time <= tx_earliest_time
        }

        let must_not_mint = mint == zero

        let must_spend_two_script_inputs =
          list.length(
            list.filter(
              inputs,
              fn(input) { utils.is_script_address(input.output.address) },
            ),
          ) == 2

        and {
          must_preserve_datum?,
          must_have_correct_value?,
          ship_must_be_valid?,
          ship_must_have_correct_redeemer?,
          ship_must_have_correct_position?,
          must_respect_latest_time?,
          must_not_mint?,
          must_spend_two_script_inputs?,
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

        let must_be_admin_or_add_new_ship =
          when admin_token_input.output.address.payment_credential is {
            // admin token is in a wallet input
            VerificationKey(_) -> True
            // admin token is in an Asteria input with redeemer AddNewShip
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

        amount > 0 && must_be_admin_or_add_new_ship?
      }
      BurnFuel -> amount < 0
    }
  }

  else(_) {
    fail
  }
}
