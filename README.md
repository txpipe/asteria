# Asteria

An Cardano bot challenge that leverages the full power of the eUTxO model.

## Mechanics

In this bot challenge you compete by moving a ship (your bot) through a 2D grid. The ship that reaches the center is allowed to collect the rewards.

Ships are implemented as UTxOs with a datum holding a pair of (x, y) coordinates that represent their position in the 2D grid. To move a ship, a transaction must consume the UTxO and create a new one with holding the new position.

![sample map](https://github.com/txpipe/asteria/assets/653886/9ed497bc-1476-44c4-b816-fb6857342674)

Movement of the ships is constrained by a _Space-Time_ on-chain script that limits their velocity. Strictly speaking, the max distance that a ship can move in any given transaction has a constant upper bound. Distances are defined using [Manhattan distance] to simplify the math.

![movement](https://github.com/txpipe/asteria/assets/653886/6f970a4c-03fd-4358-a702-37a179a3847f)

Movement of the ships is also constrained by a _fuel_ token that is required for any change in position. An specifc amount of _fuel_ is required per distance unit. The lack of the required fuel amount will block the movement of the ship.

![fuel](https://github.com/txpipe/asteria/assets/653886/19ec1c2a-99d6-465c-8781-64019b64c69d)

To accumulate fuel, ships must _gather_ these tokens which are distributed randomly across the same grid. To gather a fuel token, your ship needs to be in the same coordinates as the fuel.

To create a ship, a participant must mint the corresponding NFT from the valid policy id. A minimum amount of ADA will be requried for the mint. This ADA used to mint the ships will be increment the rewards locked for the winner. The initial position of the ship is decided by the player but is contrainted to the external boundary of the grid.

A unique UTxO will be place at the center of the grid to hold the rewards for the winner of the challenge. To claim rewards, a ship must be located at the center of the grid. Each claim is allowed to collect 1/2 of the total rewards.

## Backstory

// TODO

## Getting started

// TODO

## Monitoring progress

We have a basic visual 2D map that allows you to show the position of all the ships and fuel in real-time (updated at each block). We encourage developers to create their own visualizers, we'll showcase any project in the homepage of the challenge.
