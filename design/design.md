# Asteria dApp Design

## Introduction
This document describes the technical design of the Asteria dApp - the script UTxOs involved, the operations that take place both during the game and in the setup phase, and the necessary validators and minting policies.

There will be a single script UTxO for the `Pot`, several `PelletState` UTxOs and a `ShipState` UTxO for every user. The `Pot` UTxO locks the ada amount paid by each user when creating a ship, and it's position on the board is always assumed to be (0,0). Both `PelletState` and `ShipState` UTxOs have their positions specified in the datum. In order to identify valid game UTxOs, the admin will deposit a special token in the `PelletState` and `Pot` UTxOs when creating them.

Each ship will be identified by a `ShipToken`, with a fixed policy id but a token name of their own. This is the token that is minted by the _Ship minting policy_, described in the validators section.


## UTxOs specification

### ShipState UTxO:

>#### Address
>* Parameterized on admin token, `Pot` validator address and `PelletState` validator address.
>
>#### Datum
>* pos_x: **Int**
>* pos_y: **Int**
>* fuel: **Int**
>* pilot_token: **ByteArray**
>
>#### Value
>* minAda
>* `ShipToken`

### PelletState UTxO:

>#### Address
>* Parameterized on the admin token.
>
>#### Datum
>* pos_x: **Int**
>* pos_y: **Int**
>* fuel: **Int**
>* ship_token_policy: **PolicyId**
>
>#### Value
>* minAda
>* admin token

### Pot UTxO:

>#### Address
>* Parameterized on the admin token.
>
>#### Datum
>* ship_token_policy: **PolicyId**
>
>#### Value
>* minAda
>* reward amount.
>* admin token
>
>Note: the reward amount is updated during the course of the game, whenever a new user joins or reaches the pot.


## Transactions

### Create Pot UTxO:
This transaction creates the unique `Pot` UTxO locking min ada and an admin token.

![createPot diagram](img/createPot.png)


### Create a PelletState UTxO:
Creates one `PelletState` UTxO locking min ada and an admin token, setting in the datum the `pos_x` and `pos_y` coordinates where the pellet will be located on the grid and the `fuel` value equal to some initial value.

![createPellet diagram](img/createPellet.png)


### Create a ShipState UTxO:
Creates a `ShipState` UTxO locking min ada and a minted ship token, specifying in the datum the initial `pos_x` and `pos_y` coordinates of the ship, and sets `fuel` to an initial amount. Also adds to the `Pot` UTxO value the inscription fee paid by the user.

![createShip diagram](img/createShip.png)


### Move a Ship:
Updates the `pos_x` and `pos_y` datum fields of the `ShipState` UTxO with the `delta_x` and `delta_y` values specified in the redeemer.

![moveShip diagram](img/moveShip.png)


### Gather Fuel:
Updates the `fuel` datum field of both the `ShipState` and `PelletState` UTxOs, adding the `amount` (specified in the redeemer) from the first and subtracting it from the latter.

![gatherFuel diagram](img/gatherFuel.png)


### Collect Rewards:
Subtracts from the `Pot` UTxO 50% of the ada value, and pays that amount to the owner of the ship that reached the pot, toghether with the min ada locked in the locked in the `ShipState` UTxO. The ship token is burnt.

![collect diagram](img/collect.png)


### Quit Game:
Pays the min ada locked in the `ShipState` UTxO back to the ship owner and burns the ship token.

![quit diagram](img/quit.png)


## Validators & Minting Policies

### Pot validator:
* Params: admin token.

#### *AddNewPlayer Redeemer*
* `Pot` output value equals input value plus the inscription fee paid by the user.
* adminToken is in the input.
* datum doesn't change.

#### *Collect Redeemer (includes address of the player that reached the pot)*
* ship token is present in some input.
* `Pot` output value has at most 50% adas less than input value.

### PelletState validator:
* Params: admin token.

#### *Gather Redeemer (includes gathering amount)*
* ship token is present in some input.
* there is a `ShipState` input with the same x and y datum coordinates as the `PelletState` UTxO.
* the amount specified is not greater than the fuel available in the pellet.
* the amount specified is subtracted from the output `PelletState` fuel datum field, and the other fields remain unchanged.

### ShipState validator:
* Params: admin token, `Pot` validator address and `PelletState` validator address.

#### *MoveShip Redeemer (includes delta_x and delta_y displacements)*
* there is a single `ShipState` input.
* there is a single `ShipState` output.
* the `PilotToken` is present in an input.
* the `ShipState` input has enough fuel to move the desired delta.
* the pilot_token datum field is not changed.
* the x and y output datum values are updated as the previous ones (input values) plus the corresponding deltas.
* the output fuel datum field equals the input fuel minus the fuel required for the displacement.
* the distance advanced doesn't exceed the `MAX_SHIP_MOVEMENT_PER_TX`.
* the tx is signed by the ship owner.

#### *Gather Redeemer (includes gathering amount)*
* the amount specified plus the fuel before charging does not exceed the ship's capacity.
* the amount specified is added to the output `ShipState` fuel datum field, and the other fields remain unchanged.
* the `ShipState` output value is the same as the input.

#### *Collect Redeemer*
* `Pot` UTxO is input.
* the ada value in the `ShipState` UTxO plus at least 50% of the ada value in the `Pot` UTxO is paid to the ship owner.

#### *Quit Redeemer*
* there is a single `ShipState` input.
* the `PilotToken` is present in an input.
* no `ShipState` output.
* signed by ship owner.

### Ship minting policy:
* Params: `ShipState` validator address.

*Mint*:
***TX:***
* a single token is minted.
* there is a single `ShipState` output.
* signed by the player joining the game.

***DATUM:***
* the `ShipState` output datum has x and y coordinates such that distance from (0,0) is above the minimum.
* the `ShipState` fuel datum field equals some initial value.

***VALUE:***
* the minted token is paid to the `ShipState` validator address.

*Burn*:
***TX:***
* the `ShipState` input is at coordinates (0,0).