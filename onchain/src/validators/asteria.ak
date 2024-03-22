use aiken/transaction.{ScriptContext}
use aiken/transaction/value.{AssetName, PolicyId}
use asteria/types.{AsteriaDatum, AsteriaRedeemer}

validator(_admin_token: (PolicyId, AssetName)) {
  fn spend(
    _datum: AsteriaDatum,
    _redeemer: AsteriaRedeemer,
    _ctx: ScriptContext,
  ) -> Bool {
    True
  }
}
