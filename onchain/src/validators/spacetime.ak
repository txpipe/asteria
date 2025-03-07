use aiken/collection/dict
use aiken/collection/list
use aiken/collection/pairs
use aiken/crypto.{ScriptHash}
use aiken/interval.{Finite}
use aiken/math/rational
use aiken/option
use asteria/types.{
  AddNewShip, AssetClass, BurnShip, GatherFuel, Mine, MineAsteria, MintShip,
  MoveShip, Quit, ShipDatum, ShipRedeemer, ShipyardRedeemer, Speed,
}
use asteria/utils
use cardano/address.{Address, Script, VerificationKey}
use cardano/assets.{
  PolicyId, add, from_asset, quantity_of, tokens, without_lovelace,
}
use cardano/transaction.{
  InlineDatum, Output, OutputReference, Spend, Transaction, find_input,
}

validator spacetime(
  pellet_validator_address: ScriptHash,
  asteria_validator_address: ScriptHash,
  admin_token: AssetClass,
  max_speed: Speed,
  max_ship_fuel: Int,
  fuel_per_step: Int,
) {
  // SPACETIME VALIDATOR:
  spend(
    datum: Option<ShipDatum>,
    redeemer: ShipRedeemer,
    utxo: OutputReference,
    self: Transaction,
  ) {
    let Transaction { inputs, outputs, mint, validity_range, redeemers, .. } =
      self
    expect Some(datum) = datum
    let ShipDatum {
      pos_x,
      pos_y,
      ship_token_name,
      pilot_token_name,
      last_move_latest_time,
    } = datum

    expect Some(max_speed_rational) =
      rational.new(max_speed.distance, max_speed.time)
    expect Some(ship_input) = find_input(inputs, utxo)
    expect Script(shipyard_policy) =
      ship_input.output.address.payment_credential

    // check if pilot_token is present in some input
    let must_include_pilot_token =
      option.is_some(
        list.find(
          inputs,
          fn(input) {
            list.any(
              dict.keys(tokens(input.output.value, shipyard_policy)),
              fn(name) { name == pilot_token_name },
            )
          },
        ),
      )
    let fuel_policy = pellet_validator_address

    // only one ship input can be spent (the own ship)
    // A bit pedantic, because double satisfaction is only possible if
    // the smart contract is misused: the ship output is unique because
    // ships are enumerated, but if two Asterias with same parameters exist
    // (including the admin token), ship names can collide and then the
    // attack is enabled.
    let must_spend_one_ship_input =
      list.length(
        list.filter(
          inputs,
          fn(input) {
            when input.output.address.payment_credential is {
              VerificationKey(_) -> False
              Script(addr_payment) -> addr_payment == shipyard_policy
            }
          },
        ),
      ) == 1

    when redeemer is {
      MoveShip(delta_x, delta_y) -> {
        expect Finite(tx_earliest_time) = validity_range.lower_bound.bound_type
        expect Finite(tx_latest_time) = validity_range.upper_bound.bound_type

        // calculate moving distance and required fuel
        let distance = utils.distance(delta_x, delta_y)
        let required_fuel = utils.required_fuel(distance, fuel_per_step)

        let must_respect_max_speed = {
          expect Some(speed) =
            rational.new(distance, tx_latest_time - tx_earliest_time)
          rational.compare_with(speed, <=, max_speed_rational)
        }

        let must_respect_latest_time = last_move_latest_time <= tx_earliest_time

        // check for correct ship output
        expect [ship_output] =
          list.filter(
            outputs,
            fn(output) { output.address == ship_input.output.address },
          )
        expect Output {
          address: _,
          value: ship_out_value,
          datum: InlineDatum(ship_out_datum),
          reference_script: None,
        } = ship_output
        expect ship_out_datum: ShipDatum = ship_out_datum

        // check for correct ship output datum
        let expected_ship_datum =
          ShipDatum {
            pos_x: pos_x + delta_x,
            pos_y: pos_y + delta_y,
            ship_token_name,
            pilot_token_name,
            last_move_latest_time: ship_out_datum.last_move_latest_time,
          }
        let must_have_correct_datum =
          expected_ship_datum == ship_out_datum && ship_out_datum.last_move_latest_time >= tx_latest_time

        // check for correct ship output value
        let must_have_correct_value = {
          // implies that there is enough fuel
          let expected_ship_value =
            ship_input.output.value |> add(fuel_policy, "FUEL", -required_fuel)
          without_lovelace(ship_out_value) == without_lovelace(
            expected_ship_value,
          )
        }

        // check minting
        let must_burn_spent_fuel =
          mint == from_asset(fuel_policy, "FUEL", -required_fuel)

        and {
          must_include_pilot_token?,
          must_spend_one_ship_input?,
          must_respect_max_speed?,
          must_respect_latest_time?,
          must_have_correct_datum?,
          must_have_correct_value?,
          must_burn_spent_fuel?,
        }
      }
      GatherFuel(amount) -> {
        // allows adding fuel from any external source

        expect [ship_output] =
          list.filter(
            outputs,
            fn(output) { output.address == ship_input.output.address },
          )
        expect Output {
          address: _,
          value: ship_value,
          datum: InlineDatum(ship_datum),
          reference_script: None,
        } = ship_output
        expect ship_datum: ShipDatum = ship_datum

        let must_preserve_datum = ship_datum == datum

        let must_have_correct_value = {
          let expected_ship_value =
            ship_input.output.value |> add(fuel_policy, "FUEL", amount)
          without_lovelace(ship_value) == without_lovelace(expected_ship_value)
        }

        let must_be_correct_amount = {
          let output_fuel = quantity_of(ship_value, fuel_policy, "FUEL")
          amount > 0 && output_fuel <= max_ship_fuel
        }

        and {
          must_include_pilot_token?,
          must_spend_one_ship_input?,
          must_preserve_datum?,
          must_have_correct_value?,
          must_be_correct_amount?,
        }
      }
      MineAsteria -> {
        // exactly one valid asteria input is present
        expect [asteria_input] =
          list.filter(
            inputs,
            fn(input) {
              when input.output.address.payment_credential is {
                VerificationKey(_) -> False
                Script(addr_payment) ->
                  addr_payment == asteria_validator_address
              }
            },
          )
        let must_be_valid_asteria =
          quantity_of(
            asteria_input.output.value,
            admin_token.policy,
            admin_token.name,
          ) > 0

        let must_have_correct_purpose = {
          let asteria_purpose = Spend(asteria_input.output_reference)
          let asteria_redeemer: Data = Mine
          pairs.get_all(redeemers, asteria_purpose) == [asteria_redeemer]
        }

        and {
          must_include_pilot_token?,
          must_spend_one_ship_input?,
          must_be_valid_asteria?,
          must_have_correct_purpose?,
        }
      }
      Quit -> {
        let must_burn_ship_token =
          quantity_of(mint, shipyard_policy, ship_token_name) < 0
        let must_burn_fuel_tokens =
          quantity_of(mint, fuel_policy, "FUEL") == -quantity_of(
            ship_input.output.value,
            fuel_policy,
            "FUEL",
          )

        and {
          must_include_pilot_token?,
          must_spend_one_ship_input?,
          must_burn_ship_token?,
          must_burn_fuel_tokens?,
        }
      }
    }
  }

  // SHIPYARD POLICY:
  mint(redeemer: ShipyardRedeemer, shipyard_policy: PolicyId, self: Transaction) {
    let Transaction { inputs, mint, redeemers, .. } = self
    let minted_value = mint

    when redeemer is {
      MintShip -> {
        // exactly one valid asteria input is present
        expect [asteria_input] =
          list.filter(
            inputs,
            fn(input) {
              when input.output.address.payment_credential is {
                VerificationKey(_) -> False
                Script(addr_payment) ->
                  addr_payment == asteria_validator_address
              }
            },
          )

        let must_be_valid_asteria =
          quantity_of(
            asteria_input.output.value,
            admin_token.policy,
            admin_token.name,
          ) > 0

        let must_be_correct_purpose = {
          let asteria_purpose = Spend(asteria_input.output_reference)
          let asteria_redeemer: Data = AddNewShip
          pairs.get_all(redeemers, asteria_purpose) == [asteria_redeemer]
        }

        // no need to check minted amounts here as it is checked in asteria
        and {
          must_be_valid_asteria?,
          must_be_correct_purpose?,
        }
      }

      BurnShip -> {
        let minted_tokens =
          minted_value
            |> tokens(shipyard_policy)
            |> dict.to_pairs()
        // check that only one token with this policy is burnt
        expect [Pair(_, -1)] = minted_tokens
        True
      }
    }
  }

  else(_) {
    fail
  }
}
