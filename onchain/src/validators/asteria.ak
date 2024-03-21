use aiken/transaction.{ScriptContext}
use aiken/transaction/value.{AssetName, PolicyId}

validator(_admin_token: (PolicyId, AssetName)) {
  fn spend(_datum: Data, _redeemer: Data, _ctx: ScriptContext) -> Bool {
    True
  }
}
