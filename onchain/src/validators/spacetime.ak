use aiken/collection/dict
use aiken/collection/list
use aiken/collection/pairs
use aiken/interval.{Finite}
use aiken/math/rational
use aiken/option
use asteria/types.{
  AddNewShip, AssetClass, BurnShip, GatherFuel, MineAsteria, MintShip, MoveShip,
  PelletDatum, Provide, Quit, ScriptAddress, ShipDatum, ShipRedeemer,
  ShipyardRedeemer, Speed,
}
use asteria/utils
use cardano/address.{Address, Script, VerificationKey}
use cardano/assets.{PolicyId, flatten, quantity_of, tokens, zero}
use cardano/transaction.{
  InlineDatum, OutputReference, Spend, Transaction, find_input,
}

validator spacetime(
  pellet_validator_address: ScriptAddress,
  asteria_validator_address: ScriptAddress,
  admin_token: AssetClass,
  max_speed: Speed,
  max_ship_fuel: Int,
  fuel_per_step: Int,
  _initial_fuel: Int,  // TODO: remove
  _min_asteria_distance: Int,  // TODO: remove
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

    when redeemer is {
      MoveShip(delta_x, delta_y) -> {
        expect [ship_output] =
          list.filter(
            outputs,
            fn(output) { output.address == ship_input.output.address },
          )
        expect InlineDatum(ship_output_datum) = ship_output.datum
        expect ship_output_datum: ShipDatum = ship_output_datum
        expect Finite(tx_earliest_time) = validity_range.lower_bound.bound_type
        expect Finite(tx_latest_time) = validity_range.upper_bound.bound_type

        let distance = utils.distance(delta_x, delta_y)
        let required_fuel = utils.required_fuel(distance, fuel_per_step)
        expect Some(speed) =
          rational.new(distance, tx_latest_time - tx_earliest_time)

        let input_fuel =
          quantity_of(ship_input.output.value, fuel_policy, "FUEL")
        let output_fuel = quantity_of(ship_output.value, fuel_policy, "FUEL")

        let must_preserve_pilot_token =
          pilot_token_name == ship_output_datum.pilot_token_name
        let must_update_x = ship_output_datum.pos_x == pos_x + delta_x
        let must_update_y = ship_output_datum.pos_y == pos_y + delta_y
        let must_burn_spent_fuel =
          quantity_of(mint, fuel_policy, "FUEL") == -required_fuel
        let must_update_upper_bound =
          ship_output_datum.last_move_latest_time == tx_latest_time
        let must_respect_max_speed =
          rational.compare_with(speed, <=, max_speed_rational)
        let must_respect_latest_time = last_move_latest_time <= tx_earliest_time
        let must_have_enough_fuel = required_fuel <= input_fuel
        let must_hold_ship_token =
          quantity_of(ship_output.value, shipyard_policy, ship_token_name) == 1
        let must_subtract_fuel_tokens =
          output_fuel == input_fuel - required_fuel
        let must_hold_3_assets = list.length(ship_output.value |> flatten) == 3
        let must_spend_one_script_input =
          list.length(
            list.filter(
              inputs,
              fn(input) { utils.is_script_address(input.output.address) },
            ),
          ) == 1

        and {
          must_spend_one_script_input?,
          must_include_pilot_token?,
          must_have_enough_fuel?,
          must_respect_max_speed?,
          must_respect_latest_time?,
          must_subtract_fuel_tokens?,
          must_burn_spent_fuel?,
          must_update_x?,
          must_update_y?,
          must_update_upper_bound?,
          must_preserve_pilot_token?,
          must_hold_ship_token?,
          must_hold_3_assets?,
        }
      }

      GatherFuel(amount) -> {
        expect [ship_output] =
          list.filter(
            outputs,
            fn(output) { output.address == ship_input.output.address },
          )
        expect InlineDatum(ship_output_datum) = ship_output.datum
        expect ship_output_datum: ShipDatum = ship_output_datum
        expect Some(pellet_input) =
          list.find(
            inputs,
            fn(input) {
              when input.output.address.payment_credential is {
                VerificationKey(_) -> False
                Script(addr_payment) -> addr_payment == pellet_validator_address
              }
            },
          )
        let must_be_valid_pellet =
          quantity_of(
            pellet_input.output.value,
            admin_token.policy,
            admin_token.name,
          ) > 0

        expect InlineDatum(pellet_datum) = pellet_input.output.datum
        expect pellet_datum: PelletDatum = pellet_datum
        expect Finite(tx_earliest_time) = validity_range.lower_bound.bound_type

        let input_fuel =
          quantity_of(ship_input.output.value, fuel_policy, "FUEL")
        let output_fuel = quantity_of(ship_output.value, fuel_policy, "FUEL")

        let must_have_pellet_position =
          pos_x == pellet_datum.pos_x && pos_y == pellet_datum.pos_y
        let must_not_exceed_capacity = input_fuel + amount <= max_ship_fuel
        let must_preserve_datum = ship_output_datum == datum
        let must_respect_latest_time = last_move_latest_time <= tx_earliest_time

        let must_hold_ship_token =
          quantity_of(ship_output.value, shipyard_policy, ship_token_name) == 1
        let must_add_fuel_tokens = output_fuel == input_fuel + amount
        let must_hold_3_assets = list.length(ship_output.value |> flatten) == 3

        // gathered fuel amount must be equal to amount provided by pellet
        let pellet_purpose = Spend(pellet_input.output_reference)
        let pellet_redeemer: Data = Provide(amount)
        expect pairs.get_all(redeemers, pellet_purpose) == [pellet_redeemer]

        let must_spend_two_script_inputs =
          list.length(
            list.filter(
              inputs,
              fn(input) { utils.is_script_address(input.output.address) },
            ),
          ) == 2
        let must_not_mint_tokens = mint == zero

        and {
          must_spend_two_script_inputs?,
          must_be_valid_pellet?,
          must_include_pilot_token?,
          must_have_pellet_position?,
          must_add_fuel_tokens?,
          must_not_exceed_capacity?,
          must_respect_latest_time?,
          must_preserve_datum?,
          must_hold_ship_token?,
          must_hold_3_assets?,
          must_not_mint_tokens?,
        }
      }
      MineAsteria -> {
        // check that the Asteria UTxO is present as an input
        expect Some(asteria_input) =
          list.find(
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

        expect Finite(tx_earliest_time) = validity_range.lower_bound.bound_type

        let must_have_asteria_position = (pos_x, pos_y) == (0, 0)
        let must_burn_ship_token =
          quantity_of(mint, shipyard_policy, ship_token_name) < 0
        let must_respect_latest_time = last_move_latest_time <= tx_earliest_time
        let must_spend_two_script_inputs =
          list.length(
            list.filter(
              inputs,
              fn(input) { utils.is_script_address(input.output.address) },
            ),
          ) == 2
        let must_burn_fuel_tokens =
          quantity_of(mint, fuel_policy, "FUEL") == -quantity_of(
            ship_input.output.value,
            fuel_policy,
            "FUEL",
          )

        and {
          must_spend_two_script_inputs?,
          must_be_valid_asteria?,
          must_include_pilot_token?,
          must_have_asteria_position?,
          must_burn_ship_token?,
          must_burn_fuel_tokens?,
          must_respect_latest_time?,
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
        let must_spend_one_script_input =
          list.length(
            list.filter(
              inputs,
              fn(input) { utils.is_script_address(input.output.address) },
            ),
          ) == 1
        and {
          must_spend_one_script_input?,
          must_include_pilot_token?,
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
        expect Some(asteria_input) =
          list.find(
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

        let asteria_purpose = Spend(asteria_input.output_reference)
        let asteria_redeemer: Data = AddNewShip
        let must_be_correct_purpose =
          pairs.get_all(redeemers, asteria_purpose) == [asteria_redeemer]

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
