use std::ops::Deref;

use async_graphql::*;
use async_graphql_rocket::GraphQLRequest as Request;
use async_graphql_rocket::GraphQLResponse as Response;
use rocket::State;

struct QueryRoot;

#[derive(Clone, SimpleObject)]
pub struct Ship {
    id: ID,
    fuel: i32,
    position: Position,
    shipyard_policy: PolicyId,
    ship_token_name: AssetName,
    pilot_token_name: AssetName,
    class: String,
}

#[derive(Clone, SimpleObject)]
pub struct FuelPellet {
    id: ID,
    fuel: i32,
    position: Position,
    shipyard_policy: PolicyId,
    class: String,
}

#[derive(Clone, SimpleObject)]
pub struct RewardPot {
    id: ID,
    position: Position,
    total_rewards: f32,
    class: String,
}

#[derive(Clone, SimpleObject)]
pub struct AsteriaState {
    ship_counter: i32,
    shipyard_policy: PolicyId,
}

#[derive(Clone, SimpleObject)]
pub struct Position {
    x: i32,
    y: i32,
}

#[derive(Clone, SimpleObject)]
pub struct PolicyId {
    id: ID,
}

#[derive(Clone, SimpleObject)]
pub struct AssetName {
    name: String,
}

#[derive(InputObject)]
pub struct AssetNameInput {
    name: String,
}

#[derive(InputObject, Clone, Copy)]
pub struct PositionInput {
    x: i32,
    y: i32,
}

#[derive(SimpleObject, Clone)]
pub struct ShipAction {
    action_id: ID,
    ship_id: ID,
    action_type: ShipActionType,
    position: Position,
    timestamp: String,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum ShipActionType {
    Move,
    GatherFuel
}

#[derive(Union)]
pub enum MapObject {
    Ship(Ship),
    FuelPellet(FuelPellet),
    RewardPot(RewardPot),
}

#[derive(Interface)]
#[graphql(
    field(name = "position", ty = "&Position"),
    field(name = "class", ty = "String")
)]

pub enum PositionalInterface {
    Ship(Ship),
    FuelPellet(FuelPellet),
    RewardPot(RewardPot),
}

#[Object]
impl QueryRoot {
    async fn ship(&self, _ctx: &Context<'_>, ship_token_name: AssetNameInput) -> Ship {
        Ship {
            id: ID::from("ship-1234"), 
            fuel: 100, 
            position: Position { x: 10, y: 20 },
            shipyard_policy: PolicyId { id: ID::from("policy-5678") }, 
            ship_token_name: AssetName { name: ship_token_name.name.clone() },
            pilot_token_name: AssetName { name: "PilotOne".to_string() },
            class: "Ship".to_string(),
        }
    }

    async fn ships(&self, _ctx: &Context<'_>, limit: Option<i32>, offset: Option<i32>) -> Vec<Ship> {
        let mut ships = Vec::new();
        let num_ships = limit.unwrap_or(10);
        let start = offset.unwrap_or(0) as usize;

        // Generate fake data for ships
        for i in start..(start + num_ships as usize) {
            ships.push(Ship {
                id: ID::from(format!("ship-{}", i)),
                fuel: 100,
                position: Position { x: i as i32 * 10, y: i as i32 * 20 },
                shipyard_policy: PolicyId { id: ID::from(format!("policy-{}", i)) },
                ship_token_name: AssetName { name: format!("Explorer-{}", i) },
                pilot_token_name: AssetName { name: format!("Pilot-{}", i) },
                class: "Battleship".to_string(),
            });
        }

        ships
    }

    async fn fuel_pellets(&self, _ctx: &Context<'_>, limit: Option<i32>, offset: Option<i32>) -> Vec<FuelPellet> {
        let mut fuel_pellets = Vec::new();
        let num_pellets = limit.unwrap_or(10);
        let start = offset.unwrap_or(0) as usize;

        // Generate fake data for fuel pellets
        for i in start..(start + num_pellets as usize) {
            fuel_pellets.push(FuelPellet {
                id: ID::from(format!("pellet-{}", i)),
                fuel: 100, 
                position: Position { x: i as i32 * 5, y: i as i32 * 10 },
                shipyard_policy: PolicyId { id: ID::from(format!("policy-{}", i)) },
                class: "Standard".to_string(),
            });
        }

        fuel_pellets
    }

    async fn asteria_state(&self, _ctx: &Context<'_>) -> AsteriaState {
        AsteriaState {
            ship_counter: 123,
            shipyard_policy: PolicyId {
                id: ID::from("some-policy-id"),
            },
        }
    }

    async fn reward_pot(&self, _ctx: &Context<'_>) -> RewardPot {
        RewardPot {
            id: ID::from("reward-123"),
            position: Position { x: 100, y: 200 },
            total_rewards: 5000.0,
            class: "Standard".to_string(),
        }
    }

    async fn objects_in_radius(
        &self,
        _ctx: &Context<'_>,
        center: PositionInput,
        radius: i32
    ) -> Vec<MapObject> {
        // Sample static data for testing
        vec![
            MapObject::Ship(Ship {
                id: ID::from("ship-1"),
                fuel: 100,
                position: Position { x: center.x + 10, y: center.y + 10 },
                shipyard_policy: PolicyId { id: ID::from("policy-1") },
                ship_token_name: AssetName { name: "Explorer-1".to_string() },
                pilot_token_name: AssetName { name: "Pilot-1".to_string() },
                class: "Ship".to_string(),
            }),
            MapObject::FuelPellet(FuelPellet {
                id: ID::from("pellet-1"),
                fuel: 50,
                position: Position { x: center.x + 15, y: center.y + 15 },
                shipyard_policy: PolicyId { id: ID::from("policy-2") },
                class: "Fuel".to_string(),
            }),
            MapObject::RewardPot(RewardPot {
                id: ID::from("reward-1"),
                position: Position { x: center.x - 5, y: center.y - 5 },
                total_rewards: 5000.0,
                class: "Reward".to_string(),
            }),
        ]
    }

    async fn all_ship_actions(
        &self,
        _ctx: &Context<'_>,
        limit: Option<i32>,
        offset: Option<i32>,
    ) -> Vec<ShipAction> {
        let mut actions = Vec::new();
        let num_actions = limit.unwrap_or(10) as usize;
        let start = offset.unwrap_or(0) as usize;

        // Generate fake data for ship actions
        for i in start..(start + num_actions) {
            actions.push(ShipAction {
                action_id: ID::from(format!("action-{}", i)),
                ship_id: ID::from("ship-1"),
                action_type: ShipActionType::Move,
                position: Position { x: i as i32 * 5, y: i as i32 * 10 },
                timestamp: "01/01/1971".to_string(),
            });
        }

        actions
    }

    async fn ship_actions(
        &self,
        _ctx: &Context<'_>,
        ship_id: ID,
        limit: Option<i32>,
        offset: Option<i32>,
    ) -> Vec<ShipAction> {
        let mut actions = Vec::new();
        let num_actions = limit.unwrap_or(5) as usize;
        let start = offset.unwrap_or(0) as usize;

        // Generate fake data for specific ship actions
        for i in start..(start + num_actions) {
            actions.push(ShipAction {
                action_id: ID::from(format!("action-{}-{}", *ship_id, i)),
                ship_id: ship_id.clone(),
                action_type: if i % 2 == 0 { ShipActionType::Move } else { ShipActionType::GatherFuel },
                position: Position { x: 100 + i as i32, y: 200 + i as i32 },
                timestamp: "01/01/1971".to_string(),
            });
        }

        actions
    }
}

type AsteriaSchema = Schema<QueryRoot, EmptyMutation, EmptySubscription>;

#[macro_use]
extern crate rocket;

#[get("/")]
fn index() -> &'static str {
    "Hello, world!"
}

#[rocket::post("/graphql", data = "<request>", format = "application/json")]
async fn graphql_request(schema: &State<AsteriaSchema>, request: Request) -> Response {
    request.execute(schema.deref()).await
}

#[launch]
fn rocket() -> _ {
    let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription)
        .register_output_type::<PositionalInterface>()
        .finish();

    rocket::build().manage(schema).mount("/", routes![index, graphql_request])
}
