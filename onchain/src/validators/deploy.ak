use aiken/hash.{Blake2b_224, Hash}
use aiken/list
use aiken/transaction.{ScriptContext, Transaction}
use aiken/transaction/credential.{VerificationKey}

validator {
  fn spend(
    _datum: Data,
    redeemer: Hash<Blake2b_224, VerificationKey>,
    ctx: ScriptContext,
  ) -> Bool {
    let must_be_signed = list.has(ctx.transaction.extra_signatories, redeemer)
    must_be_signed?
  }
}
