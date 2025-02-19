use aiken/collection/dict
use aiken/collection/list
use aiken/crypto.{ScriptHash}
use aiken/interval.{Finite}
use aiken/math/rational.{compare_with, from_int}
use aiken/option
use aiken/primitive/bytearray
use aiken/primitive/string
use asteria/types.{
  AddNewShip, AssetClass, AsteriaDatum, AsteriaRedeemer, ConsumeAsteria, Mine,
  ShipDatum,
}
use asteria/utils
use cardano/address.{Address, Script}
use cardano/assets.{
  ada_asset_name, ada_policy_id, add, lovelace_of, quantity_of, tokens,
}
use cardano/transaction.{
  InlineDatum, Output, OutputReference, Transaction, find_input,
}

validator asteria(
  pellet_address: ScriptHash,
  admin_token: AssetClass,
  ship_mint_lovelace_fee: Int,
  max_asteria_mining: Int,
  min_asteria_distance: Int,
  initial_fuel: Int,
) {
  spend(
    datum: Option<AsteriaDatum>,
    redeemer: AsteriaRedeemer,
    utxo: OutputReference,
    self: Transaction,
  ) {
    let Transaction { inputs, outputs, mint, validity_range, .. } = self
    expect Some(datum) = datum
    let AsteriaDatum { ship_counter, shipyard_policy } = datum
    expect Some(asteria_input) = find_input(inputs, utxo)

    when redeemer is {
      AddNewShip -> {
        expect [asteria_output] =
          list.filter(
            outputs,
            fn(output) { output.address == asteria_input.output.address },
          )
        expect Output {
          address: _,
          value: asteria_value,
          datum: InlineDatum(asteria_datum),
          reference_script: None,
        } = asteria_output

        // check for correct Asteria output datum
        expect asteria_datum: AsteriaDatum = asteria_datum
        let asteria_must_have_correct_datum =
          AsteriaDatum { ship_counter: ship_counter + 1, shipyard_policy } == asteria_datum

        // check for correct Asteria output value
        let must_hold_admin_token =
          quantity_of(asteria_value, admin_token.policy, admin_token.name) > 0
        let must_add_fee =
          asteria_value == (
            asteria_input.output.value
              |> add(ada_policy_id, ada_asset_name, ship_mint_lovelace_fee)
          )
        let asteria_must_have_correct_value = and {
            must_add_fee?,
            must_hold_admin_token?,
          }

        // check for correct creation of ship UTxO
        expect [ship_output] =
          transaction.find_script_outputs(outputs, shipyard_policy)
        expect Output {
          address: Address(_, None),
          value: ship_value,
          datum: InlineDatum(ship_datum),
          reference_script: None,
        } = ship_output

        // check for correct creation of ship UTxO: check datum
        expect ShipDatum {
          pos_x,
          pos_y,
          ship_token_name,
          pilot_token_name,
          last_move_latest_time,
        } = ship_datum
        let must_respect_min_distance =
          utils.distance(pos_x, pos_y) >= min_asteria_distance
        let must_have_ship_name =
          ship_token_name == bytearray.concat(
            "SHIP",
            bytearray.from_string(string.from_int(ship_counter)),
          )
        let must_have_pilot_name =
          pilot_token_name == bytearray.concat(
            "PILOT",
            bytearray.from_string(string.from_int(ship_counter)),
          )
        let must_have_latest_time = {
          expect Finite(tx_latest_time) = validity_range.upper_bound.bound_type
          last_move_latest_time >= tx_latest_time
        }
        let ship_must_have_correct_datum = and {
            must_respect_min_distance?,
            must_have_ship_name?,
            must_have_pilot_name?,
            must_have_latest_time?,
          }

        // check for correct creation of ship UTxO: check value
        let expected_ship_value =
          assets.from_asset(shipyard_policy, ship_token_name, 1)
            |> assets.add(pellet_address, "FUEL", initial_fuel)
        let ship_must_have_correct_value =
          assets.match(ship_value, expected_ship_value, >=)

        // check minting
        let expected_minted_value =
          assets.from_asset(shipyard_policy, ship_token_name, 1)
            |> assets.add(shipyard_policy, pilot_token_name, 1)
            |> assets.add(pellet_address, "FUEL", initial_fuel)
        let must_mint_expected_value = mint == expected_minted_value

        and {
          asteria_must_have_correct_value?,
          asteria_must_have_correct_datum?,
          ship_must_have_correct_datum?,
          ship_must_have_correct_value?,
          must_mint_expected_value?,
        }
      }

      Mine -> {
        expect [asteria_output] =
          list.filter(
            outputs,
            fn(output) { output.address == asteria_input.output.address },
          )
        expect Output {
          address: Address(_, None),
          value: asteria_value,
          datum: InlineDatum(asteria_datum),
          reference_script: None,
        } = asteria_output

        // check for correct Asteria output datum
        let asteria_must_preserve_datum = {
          expect asteria_datum: AsteriaDatum = asteria_datum
          datum == asteria_datum
        }

        // check for correct Asteria output value
        // first lovelace: output_rewards >= input_rewards * (1 - max_asteria_mining / 100)
        let asteria_must_respect_max_mining = {
          let input_rewards = lovelace_of(asteria_input.output.value)
          let output_rewards = lovelace_of(asteria_value)
          expect Some(percentage) = rational.new(max_asteria_mining, 100)
          compare_with(
            from_int(output_rewards),
            >=,
            rational.mul(
              from_int(input_rewards),
              rational.sub(from_int(1), percentage),
            ),
          )
        }
        let asteria_must_preserve_other_tokens =
          assets.without_lovelace(asteria_value) == assets.without_lovelace(
            asteria_input.output.value,
          )

        // check for correct state in ship input
        // TODO: CHANGE FOR FILTER
        expect Some(ship_input) =
          list.find(
            inputs,
            fn(input) {
              list.any(
                dict.keys(tokens(input.output.value, shipyard_policy)),
                fn(name) { utils.has_prefix("SHIP", name) },
              )
            },
          )
        expect Output {
          address: Address(Script(ship_address), None),
          value: ship_value,
          datum: InlineDatum(ship_datum),
          reference_script: None,
        } = ship_input.output
        let ship_must_have_correct_address = ship_address == shipyard_policy

        expect ShipDatum {
          pos_x,
          pos_y,
          ship_token_name,
          pilot_token_name,
          last_move_latest_time,
        } = ship_datum

        // check ship datum
        let ship_must_have_asteria_position = (pos_x, pos_y) == (0, 0)
        let ship_must_respect_latest_time = {
          expect Finite(tx_earliest_time) =
            validity_range.lower_bound.bound_type
          last_move_latest_time <= tx_earliest_time
        }

        // check minting
        // TODO: we can also just burn all ship_value without lovelace:
        let must_burn_expected_value = {
          let fuel_amount = quantity_of(ship_value, pellet_address, "FUEL")
          let expected_minted_value =
            assets.from_asset(shipyard_policy, ship_token_name, -1)
              |> assets.add(pellet_address, "FUEL", -fuel_amount)
          mint == expected_minted_value
        }

        and {
          asteria_must_preserve_datum?,
          asteria_must_respect_max_mining?,
          asteria_must_preserve_other_tokens?,
          ship_must_have_correct_address?,
          ship_must_have_asteria_position?,
          ship_must_respect_latest_time?,
          must_burn_expected_value?,
        }
      }

      ConsumeAsteria -> {
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

  else(_) {
    fail
  }
}
