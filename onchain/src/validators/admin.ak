use aiken/collection/dict
use aiken/collection/list
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction}

pub type Action {
  Minting
  Burning
}

validator admin(outref: OutputReference) {
  mint(redeemer: Action, policy_id: PolicyId, self: Transaction) {
    let Transaction { inputs, mint, .. } = self
    expect [Pair(_asset_name, quantity)] =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()
    let is_outref_consumed =
      list.any(inputs, fn(input) { input.output_reference == outref })
    when redeemer is {
      Minting -> is_outref_consumed && (quantity >= 1)?
      Burning -> quantity < 0
    }
  }

  else(_) {
    fail
  }
}
