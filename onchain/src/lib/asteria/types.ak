use aiken/transaction/value.{AssetName, PolicyId}

pub type AssetClass {
  policy: PolicyId,
  name: AssetName,
}

pub type ShipDatum {
  fuel: Int,
  pos_x: Int,
  pos_y: Int,
  shipyard_policy: PolicyId,
  ship_token_name: AssetName,
  pilot_token_name: AssetName,
}

pub type ShipRedeemer {
  MoveShip { delta_x: Int, delta_y: Int }
  GatherFuel { amount: Int }
  MineAsteria
  Quit
}

pub type PelletDatum {
  fuel: Int,
  pos_x: Int,
  pos_y: Int,
  shipyard_policy: PolicyId,
}

pub type PelletRedeemer {
  Provide { amount: Int }
}

pub type AsteriaDatum {
  ship_counter: Int,
  shipyard_policy: PolicyId,
}

pub type AsteriaRedeemer {
  AddNewShip
  Mine
}

pub type ShipyardRedeemer {
  Mint
  Burn
}
