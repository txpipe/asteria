use aiken/collection/dict
use aiken/collection/list
use aiken/interval
use aiken/math/rational.{compare_with, from_int}
use aiken/option
use asteria/types.{
  AddNewShip, AssetClass, AsteriaDatum, AsteriaRedeemer, ConsumeAsteria, Mine,
}
use asteria/utils
use cardano/assets.{
  ada_asset_name, ada_policy_id, add, lovelace_of, quantity_of, tokens,
}
use cardano/transaction.{InlineDatum, OutputReference, Transaction, find_input}

validator asteria(
  admin_token: AssetClass,
  ship_mint_lovelace_fee: Int,
  max_asteria_mining: Int,
) {
  spend(
    datum: Option<AsteriaDatum>,
    redeemer: AsteriaRedeemer,
    utxo: OutputReference,
    self: Transaction,
  ) {
    let Transaction { inputs, outputs, .. } = self
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
        expect InlineDatum(asteria_output_datum) = asteria_output.datum
        expect asteria_output_datum: AsteriaDatum = asteria_output_datum

        let must_hold_admin_token =
          quantity_of(
            asteria_output.value,
            admin_token.policy,
            admin_token.name,
          ) > 0
        let must_add_fee =
          asteria_output.value == (
            asteria_input.output.value
              |> add(ada_policy_id, ada_asset_name, ship_mint_lovelace_fee)
          )
        let must_increment_counter =
          asteria_output_datum.ship_counter == ship_counter + 1
        let must_preserve_shipyard_policy =
          asteria_output_datum.shipyard_policy == shipyard_policy

        and {
          must_add_fee?,
          must_hold_admin_token?,
          must_increment_counter?,
          must_preserve_shipyard_policy?,
        }
      }

      Mine -> {
        expect [asteria_output] =
          list.filter(
            outputs,
            fn(output) { output.address == asteria_input.output.address },
          )
        expect InlineDatum(asteria_output_datum) = asteria_output.datum
        expect asteria_output_datum: AsteriaDatum = asteria_output_datum

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
        expect Some(percentage) = rational.new(max_asteria_mining, 100)
        let input_rewards = lovelace_of(asteria_input.output.value)
        let output_rewards = lovelace_of(asteria_output.value)
        let must_respect_max_mining =
          compare_with(
            from_int(output_rewards),
            >=,
            rational.mul(
              from_int(input_rewards),
              rational.sub(from_int(1), percentage),
            ),
          )
        let must_preserve_datum = datum == asteria_output_datum
        and {
          must_input_ship_token?,
          must_respect_max_mining?,
          must_preserve_datum?,
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
