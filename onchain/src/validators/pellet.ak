use aiken/transaction.{ScriptContext}
use aiken/transaction/value.{AssetName, PolicyId}
use asteria/types.{PelletDatum, PelletRedeemer}

validator(_admin_token: (PolicyId, AssetName)) {
  fn spend(
    _datum: PelletDatum,
    _redeemer: PelletRedeemer,
    _ctx: ScriptContext,
  ) -> Bool {
    True
  }
}
