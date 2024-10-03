use async_graphql::http::GraphiQLSource;
use dotenv::dotenv;
use rocket::response::content::RawHtml;
use std::env;
use std::ops::Deref;
use std::vec;

use async_graphql::*;
use async_graphql_rocket::GraphQLRequest as Request;
use async_graphql_rocket::GraphQLResponse as Response;
use rocket::State;

struct QueryRoot;

#[derive(Clone)]
pub struct Data {
    pub ships: Vec<Ship>,
    pub fuels: Vec<Fuel>,
    pub asteria: Asteria,
}

impl Data {
    pub fn new(amount_of_ships: usize, amount_of_fuels: usize) -> Self {
        let mut ships = Vec::new();
        for _ in 0..amount_of_ships {
            ships.push(Ship::random())
        }
        let mut fuels = Vec::new();
        for _ in 0..amount_of_fuels {
            fuels.push(Fuel::random())
        }

        Data {
            ships,
            fuels,
            asteria: Asteria {
                id: ID::from(uuid::Uuid::new_v4().to_string()),
                position: Position {
                    x: (rand::random::<f32>() * 100.0).floor() as i32,
                    y: (rand::random::<f32>() * 100.0).floor() as i32,
                },
                total_rewards: 1235431230,
                class: "Asteria".to_string(),
            },
        }
    }
    pub fn ship(self, name: &str) -> Option<Ship> {
        self.ships
            .into_iter()
            .find(|ship| ship.ship_token_name.name == name)
            .clone()
    }

    pub fn ships(self, limit: usize, offset: usize) -> Vec<Ship> {
        self.ships.clone()[offset..offset + limit].to_vec()
    }

    pub fn fuel_pellets(self, limit: usize, offset: usize) -> Vec<Fuel> {
        self.fuels.clone()[offset..offset + limit].to_vec()
    }

    pub fn objects_in_radius(self, center: Position, radius: i32) -> Vec<MapObject> {
        let mut retval = Vec::new();
        let _ = self
            .ships
            .clone()
            .into_iter()
            .filter(|ship| (ship.position.x - center.x) + (ship.position.y - center.y) < radius)
            .map(|ship| retval.push(MapObject::Ship(ship.clone())));
        let _ = self
            .fuels
            .clone()
            .into_iter()
            .filter(|fuel| (fuel.position.x - center.x) + (fuel.position.y - center.y) < radius)
            .map(|fuel| retval.push(MapObject::Fuel(fuel.clone())));

        if (self.asteria.position.x - center.x) + (self.asteria.position.y - center.y) < radius {
            retval.push(MapObject::Asteria(self.asteria.clone()))
        }
        retval
    }
}

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

impl Ship {
    pub fn random() -> Self {
        Self {
            id: ID::from(uuid::Uuid::new_v4().to_string()),
            fuel: (rand::random::<f32>() * 100.0).floor() as i32,
            position: Position {
                x: (rand::random::<f32>() * 100.0).floor() as i32,
                y: (rand::random::<f32>() * 100.0).floor() as i32,
            },
            shipyard_policy: PolicyId {
                id: ID::from(uuid::Uuid::new_v4().to_string()),
            },
            ship_token_name: AssetName {
                name: uuid::Uuid::new_v4().to_string(),
            },
            pilot_token_name: AssetName {
                name: uuid::Uuid::new_v4().to_string(),
            },
            class: "Ship".to_string(),
        }
    }
}

#[derive(Clone, SimpleObject)]
pub struct Fuel {
    id: ID,
    fuel: i32,
    position: Position,
    shipyard_policy: PolicyId,
    class: String,
}

impl Fuel {
    pub fn random() -> Self {
        Self {
            id: ID::from(uuid::Uuid::new_v4().to_string()),
            fuel: (rand::random::<f32>() * 100.0).floor() as i32,
            position: Position {
                x: (rand::random::<f32>() * 100.0).floor() as i32,
                y: (rand::random::<f32>() * 100.0).floor() as i32,
            },
            shipyard_policy: PolicyId {
                id: ID::from(uuid::Uuid::new_v4().to_string()),
            },
            class: "Fuel".to_string(),
        }
    }
}

#[derive(Clone, SimpleObject)]
pub struct Asteria {
    id: ID,
    position: Position,
    total_rewards: i64,
    class: String,
}

#[derive(Clone, SimpleObject)]
pub struct AsteriaState {
    ship_counter: i32,
    shipyard_policy: PolicyId,
    reward: i64,
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
    GatherFuel,
}

#[derive(Union)]
pub enum MapObject {
    Ship(Ship),
    Fuel(Fuel),
    Asteria(Asteria),
}

#[derive(Interface)]
#[graphql(
    field(name = "position", ty = "&Position"),
    field(name = "class", ty = "String")
)]

pub enum PositionalInterface {
    Ship(Ship),
    Fuel(Fuel),
    Asteria(Asteria),
}

#[Object]
impl QueryRoot {
    async fn ship(
        &self,
        ctx: &Context<'_>,
        ship_token_name: AssetNameInput,
    ) -> Result<Option<Ship>> {
        let data = ctx.data::<Data>().map_err(|e| Error::new(e.message))?;
        Ok(data.clone().ship(&ship_token_name.name))
    }

    async fn ships(
        &self,
        ctx: &Context<'_>,
        limit: Option<i32>,
        offset: Option<i32>,
    ) -> Result<Vec<Ship>> {
        let data = ctx.data::<Data>().map_err(|e| Error::new(e.message))?;
        Ok(data.clone().ships(
            limit.unwrap_or(10).try_into().unwrap(),
            offset.unwrap_or(0).try_into().unwrap(),
        ))
    }

    async fn fuel_pellets(
        &self,
        ctx: &Context<'_>,
        limit: Option<i32>,
        offset: Option<i32>,
    ) -> Result<Vec<Fuel>> {
        let data = ctx.data::<Data>().map_err(|e| Error::new(e.message))?;
        Ok(data.clone().fuel_pellets(
            limit.unwrap_or(10).try_into().unwrap(),
            offset.unwrap_or(0).try_into().unwrap(),
        ))
    }

    async fn asteria(&self, ctx: &Context<'_>) -> Result<AsteriaState> {
        let data = ctx.data::<Data>().map_err(|e| Error::new(e.message))?;
        Ok(AsteriaState {
            ship_counter: data.ships.len() as i32,
            shipyard_policy: PolicyId {
                id: ID::from(uuid::Uuid::new_v4().to_string()),
            },
            reward: 15000000,
        })
    }

    async fn objects_in_radius(
        &self,
        ctx: &Context<'_>,
        center: PositionInput,
        radius: i32,
    ) -> Result<Vec<MapObject>, Error> {
        let data = ctx.data::<Data>().map_err(|e| Error::new(e.message))?;
        Ok(data.clone().objects_in_radius(
            Position {
                x: center.x,
                y: center.y,
            },
            radius,
        ))
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
                position: Position {
                    x: i as i32 * 5,
                    y: i as i32 * 10,
                },
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
                action_type: if i % 2 == 0 {
                    ShipActionType::Move
                } else {
                    ShipActionType::GatherFuel
                },
                position: Position {
                    x: 100 + i as i32,
                    y: 200 + i as i32,
                },
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

#[rocket::get("/graphql")]
async fn graphiql() -> RawHtml<String> {
    rocket::response::content::RawHtml(GraphiQLSource::build().endpoint("/graphql").finish())
}

#[launch]
async fn rocket() -> _ {
    dotenv().ok();

    let shipyard_policy_id =
        env::var("SHIPYARD_POLICY_ID").expect("SHIPYARD_POLICY_ID must be set in the environment");

    let shipyard_policy_id = PolicyId {
        id: ID::from(shipyard_policy_id),
    };

    let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription)
        .register_output_type::<PositionalInterface>()
        .data(shipyard_policy_id)
        .data(Data::new(20, 50))
        .finish();

    rocket::build()
        .manage(schema)
        .mount("/", routes![index, graphql_request, graphiql])
}
