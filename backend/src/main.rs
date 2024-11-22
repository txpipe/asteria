use async_graphql::http::GraphiQLSource;
use dotenv::dotenv;
use num_traits::{cast::ToPrimitive, Zero};
use rocket::response::content::RawHtml;
use sqlx::types::BigDecimal;
use std::env;
use std::ops::Deref;
use std::vec;

use async_graphql::*;
use async_graphql_rocket::GraphQLRequest as Request;
use async_graphql_rocket::GraphQLResponse as Response;
use rocket::State;
use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::{Header, Method, Status};

pub struct CORS;

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to responses",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r rocket::Request<'_>, response: &mut rocket::Response<'r>) {
        if request.method() == Method::Options {
            response.set_status(Status::NoContent);
            response.set_header(Header::new("Access-Control-Allow-Methods", "POST, PATCH, GET, DELETE"));
            response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        }
        response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }
}

struct QueryRoot;

pub struct ChainParameters {
    ship_address: String,
    fuel_address: String,
    asteria_address: String,
}
impl ChainParameters {
    pub fn from_env() -> Self {
        Self {
            ship_address: env::var("SHIP_ADDRESS")
                .expect("SHIP_ADDRESS must be set in the environment"),
            fuel_address: env::var("FUEL_ADDRESS")
                .expect("FUEL_ADDRESS must be set in the environment"),
            asteria_address: env::var("ASTERIA_ADDRESS")
                .expect("ASTERIA_ADDRESS must be set in the environment"),
        }
    }
}

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
                position: Position { x: 0, y: 0 },
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

    pub fn objects_in_radius(self, center: Position, radius: i32, _shipyard_policy_id: String) -> Vec<PositionalInterface> {
        let mut retval = Vec::new();

        for ship in self.ships {
            if (ship.position.x - center.x).abs() + (ship.position.y - center.y).abs() < radius {
                retval.push(PositionalInterface::Ship(ship.clone()));
            }
        }
        for fuel in self.fuels {
            if (fuel.position.x - center.x).abs() + (fuel.position.y - center.y).abs() < radius {
                retval.push(PositionalInterface::Fuel(fuel.clone()));
            }
        }
        if (self.asteria.position.x - center.x).abs() + (self.asteria.position.y - center.y).abs()
            < radius
        {
            retval.push(PositionalInterface::Asteria(self.asteria.clone()))
        }
        retval
    }
}

#[derive(sqlx::FromRow, Clone, SimpleObject)]
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
            position: Position::random(),
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
            position: Position::random(),
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
impl Position {
    pub fn random() -> Self {
        Self {
            x: (rand::random::<f32>() * 200.0 - 100.0).floor() as i32,
            y: (rand::random::<f32>() * 200.0 - 100.0).floor() as i32,
        }
    }
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

#[derive(SimpleObject, Clone)]
pub struct LeaderboardRecord {
    ranking: i32,
    address: String,
    ship_name: String,
    pilot_name: String,
    fuel: i32,
    distance: i32,
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
        shipyard_policy_id: String,
    ) -> Result<Vec<PositionalInterface>, Error> {
        // Access the connection pool from the GraphQL context
        let pool = ctx
            .data::<sqlx::PgPool>()
            .map_err(|e| Error::new(e.message))?;

        let chain_parameters = ctx
            .data::<ChainParameters>()
            .map_err(|e| Error::new(e.message))?;

        // Query to select map objects within a radius using Manhattan distance
        let fetched_objects = sqlx::query!(
            "
            WITH data AS (
                SELECT 
                    id,
                    'Ship' as class,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 0 ->> 'int' AS INTEGER) AS fuel,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 1 ->> 'int' AS INTEGER) AS position_x,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 2 ->> 'int' AS INTEGER) AS position_y,
                    $4::varchar AS shipyard_policy,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 3 ->> 'bytes' AS TEXT) AS ship_token_name,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 4 ->> 'bytes' AS TEXT) AS pilot_token_name,
                    0 AS total_rewards
                FROM 
                    utxos
                WHERE 
                    utxo_address(era, cbor) = from_bech32($5::varchar)
                    AND utxo_has_policy_id(era, cbor, decode($4::varchar, 'hex'))
                    AND spent_slot IS NULL
                
                UNION ALL
                
                SELECT 
                    id,
                    'Fuel' as class,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 0 ->> 'int' AS INTEGER) AS fuel,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 1 ->> 'int' AS INTEGER) AS position_x,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 2 ->> 'int' AS INTEGER) AS position_y,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 3 ->> 'bytes' AS VARCHAR(56)) AS shipyard_policy,
                    NULL AS ship_token_name,
                    NULL AS pilot_token_name,
                    0 AS total_rewards
                FROM 
                    utxos
                WHERE 
                    utxo_address(era, cbor) = from_bech32($6::varchar)
                    AND spent_slot IS NULL

                UNION ALL
                
                SELECT 
                    id,
                    'Asteria' as class,
                    0 AS fuel,
                    0 AS position_x,
                    0 AS position_y,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 1 ->> 'bytes' AS VARCHAR(56)) AS shipyard_policy,
                    NULL AS ship_token_name,
                    NULL AS pilot_token_name,
                    utxo_lovelace(era, cbor) as total_rewards
                FROM 
                    utxos
                WHERE 
                    utxo_address(era, cbor) = from_bech32($7::varchar)
                    AND spent_slot IS NULL
            )
            SELECT
                id,
                fuel,
                position_x,
                position_y,
                shipyard_policy,
                ship_token_name,
                pilot_token_name,
                class,
                total_rewards
             FROM
                data
             WHERE
                ABS(position_x - $1::int) + ABS(position_y - $2::int) < $3::int
                AND shipyard_policy = $4::text
            ",
            center.x,
            center.y,
            radius,
            shipyard_policy_id,
            chain_parameters.ship_address,
            chain_parameters.fuel_address,
            chain_parameters.asteria_address,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| Error::new(e.to_string()))?;

        let map_objects: Vec<PositionalInterface> = fetched_objects
            .into_iter()
            .map(|record| match record.class.as_deref() {
                Some("Ship") => PositionalInterface::Ship(Ship {
                    id: ID::from(record.id.unwrap_or_default()),
                    fuel: record.fuel.unwrap_or(0),
                    position: Position {
                        x: record.position_x.unwrap_or(0),
                        y: record.position_y.unwrap_or(0),
                    },
                    shipyard_policy: PolicyId {
                        id: ID::from(record.shipyard_policy.unwrap_or_default()),
                    },
                    ship_token_name: AssetName {
                        name: record.ship_token_name.unwrap_or_default(),
                    },
                    pilot_token_name: AssetName {
                        name: record.pilot_token_name.unwrap_or_default(),
                    },
                    class: record.class.unwrap_or_default(),
                }),
                Some("Fuel") => PositionalInterface::Fuel(Fuel {
                    id: ID::from(record.id.unwrap_or_default()),
                    fuel: record.fuel.unwrap_or(0),
                    position: Position {
                        x: record.position_x.unwrap_or(0),
                        y: record.position_y.unwrap_or(0),
                    },
                    shipyard_policy: PolicyId {
                        id: ID::from(record.shipyard_policy.unwrap_or_default()),
                    },
                    class: record.class.unwrap_or_default(),
                }),
                Some("Asteria") => PositionalInterface::Asteria(Asteria {
                    id: ID::from(record.id.unwrap_or_default()),
                    position: Position {
                        x: record.position_x.unwrap_or(0),
                        y: record.position_y.unwrap_or(0),
                    },
                    total_rewards: record
                        .total_rewards
                        .unwrap_or(BigDecimal::zero())
                        .to_i64()
                        .unwrap_or(0),
                    class: record.class.unwrap_or_default(),
                }),
                _ => panic!("Unknown class type or class not provided"),
            })
            .collect();

        Ok(map_objects)
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

    async fn leaderboard(
        &self,
        ctx: &Context<'_>,
        shipyard_policy_id: String,
    ) -> Result<Vec<LeaderboardRecord>, Error> {
        let pool = ctx
            .data::<sqlx::PgPool>()
            .map_err(|e| Error::new(e.message))?;

        let chain_parameters = ctx
            .data::<ChainParameters>()
            .map_err(|e| Error::new(e.message))?;

        let fetched_objects = sqlx::query!(
            "
            SELECT 
                id,
                CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 0 ->> 'int' AS INTEGER) AS fuel,
                CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 3 ->> 'bytes' AS TEXT) AS ship_token_name,
                CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 4 ->> 'bytes' AS TEXT) AS pilot_token_name,
                ABS(CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 1 ->> 'int' AS INTEGER)) + ABS(CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 2 ->> 'int' AS INTEGER)) AS distance
            FROM 
                utxos
            WHERE 
                utxo_address(era, cbor) = from_bech32($2::varchar)
                AND utxo_has_policy_id(era, cbor, decode($1::varchar, 'hex'))
                AND spent_slot IS NULL
            ORDER BY distance ASC
            ",
            shipyard_policy_id,
            chain_parameters.ship_address,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| Error::new(e.to_string()))?;

        let map_objects: Vec<LeaderboardRecord> = fetched_objects
            .into_iter()
            .enumerate()
            .map(|(i, record)| LeaderboardRecord {
                ranking: i as i32 + 1,
                address: record.id,
                ship_name: record.ship_token_name.unwrap_or_default(),
                pilot_name: record.pilot_token_name.unwrap_or_default(),
                fuel: record.fuel.unwrap_or(0),
                distance: record.distance.unwrap_or(0)
            })
            .collect();

        Ok(map_objects)
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

    let database_url =
        env::var("DATABASE_URL").expect("DATABASE_URL must be set in the environment");

    let chain_parameters = ChainParameters::from_env();

    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url.as_str())
        .await
        .expect("Failed to create pool");

    let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription)
        .register_output_type::<PositionalInterface>()
        .data(chain_parameters)
        .data(pool)
        .data(Data::new(200, 100))
        .finish();

    rocket::build()
        .manage(schema)
        .mount("/", routes![index, graphql_request, graphiql])
        .attach(CORS)
}
