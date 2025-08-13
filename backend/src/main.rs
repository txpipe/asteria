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

#[derive(Clone)]
pub struct Data {
    pub ships: Vec<Ship>,
    pub pellets: Vec<Pellet>,
    pub tokens: Vec<Token>,
    pub asteria: Asteria,
}

#[derive(Clone, SimpleObject)]
pub struct Asset {
    pub policy_id: String,
    pub name: String,
    pub amount: i32,
}


impl Data {
    pub fn new() -> Self {
        Data {
            ships: Vec::new(),
            pellets: Vec::new(),
            tokens: Vec::new(),
            asteria: Asteria {
                id: ID::from(uuid::Uuid::new_v4().to_string()),
                position: Position { x: 0, y: 0 },
                total_rewards: 0,
                class: "Asteria".to_string(),
                datum: "{}".to_string(),
                assets: vec![],
            },
        }
    }
}

#[derive(sqlx::FromRow, Clone, SimpleObject)]
pub struct Ship {
    id: ID,
    fuel: i32,
    position: Position,
    spacetime_policy: PolicyId,
    ship_token_name: AssetName,
    pilot_token_name: AssetName,
    class: String,
    datum: String,
    assets: Vec<Asset>,
}

#[derive(Clone, SimpleObject)]
pub struct Pellet {
    id: ID,
    fuel: i32,
    position: Position,
    spacetime_policy: PolicyId,
    class: String,
    datum: String,
    assets: Vec<Asset>,
}

#[derive(Clone, SimpleObject)]
pub struct Asteria {
    id: ID,
    position: Position,
    total_rewards: i64,
    class: String,
    datum: String,
    assets: Vec<Asset>,
}

#[derive(Clone, SimpleObject)]
pub struct AsteriaState {
    ship_counter: i32,
    spacetime_policy: PolicyId,
    reward: i64,
}

#[derive(Clone, SimpleObject)]
pub struct Token {
    id: ID,
    amount: i32,
    position: Position,
    spacetime_policy: PolicyId,
    class: String,
    name: String,
    asset_name: String,
    display_name: String,
    datum: String,
    assets: Vec<Asset>,
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

#[derive(InputObject, Clone)]
pub struct TokenInput {
    name: String,
    display_name: String,
    asset_name: String,
    policy_id: String,
    decimals: Option<i32>,
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

#[derive(SimpleObject, Clone)]
pub struct NextShipTokenName {
    ship_name: String,
    pilot_name: String,
}

#[derive(SimpleObject, Clone)]
pub struct LatestSlotNumber {
    slot: i32,
}

#[derive(Union)]
pub enum MapObject {
    Ship(Ship),
    Pellet(Pellet),
    Token(Token),
    Asteria(Asteria),
}

#[derive(Interface)]
#[graphql(
    field(name = "position", ty = "&Position"),
    field(name = "class", ty = "String")
)]
pub enum PositionalInterface {
    Ship(Ship),
    Pellet(Pellet),
    Token(Token),
    Asteria(Asteria),
}

#[Object]
impl QueryRoot {
    async fn objects_in_radius(
        &self,
        ctx: &Context<'_>,
        center: PositionInput,
        radius: i32,
        spacetime_policy_id: String,
        spacetime_address: String,
        pellet_policy_id: String,
        pellet_address: String,
        asteria_address: String,
        tokens: Option<Vec<TokenInput>>,
    ) -> Result<Vec<PositionalInterface>, Error> {
        // Access the connection pool from the GraphQL context
        let pool = ctx
            .data::<sqlx::PgPool>()
            .map_err(|e| Error::new(e.message))?;

        // Query to select map objects within a radius using Manhattan distance
        let fetched_objects = sqlx::query!(
            "
            WITH data AS (
                SELECT 
                    id,
                    'Ship' as class,
                    CAST(utxo_subject_amount(era, cbor, decode($5::varchar, 'hex')) AS INTEGER) AS fuel,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 0 ->> 'int' AS INTEGER) AS position_x,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 1 ->> 'int' AS INTEGER) AS position_y,
                    $4::varchar AS spacetime_policy,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 2 ->> 'bytes' AS TEXT) AS ship_token_name,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 3 ->> 'bytes' AS TEXT) AS pilot_token_name,
                    CAST(utxo_subject_amount(era, cbor, decode(CONCAT($4::varchar, CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 2 ->> 'bytes' AS TEXT)), 'hex')) AS INTEGER) AS ship_asset_amount,
                    CAST(utxo_subject_amount(era, cbor, decode(CONCAT($4::varchar, CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 2 ->> 'bytes' AS TEXT)), 'hex')) AS INTEGER) AS pilot_asset_amount,
                    0 AS total_rewards,
                    utxo_plutus_data(era, cbor) as datum
                FROM 
                    utxos
                WHERE 
                    utxo_address(era, cbor) = from_bech32($6::varchar)
                    AND utxo_has_policy_id(era, cbor, decode($4::varchar, 'hex'))
                    AND spent_slot IS NULL
                UNION ALL
                
                SELECT 
                    id,
                    'Pellet' as class,
                    CAST(utxo_subject_amount(era, cbor, decode($5::varchar, 'hex')) AS INTEGER) AS fuel,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 0 ->> 'int' AS INTEGER) AS position_x,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 1 ->> 'int' AS INTEGER) AS position_y,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 2 ->> 'bytes' AS VARCHAR(56)) AS spacetime_policy,
                    NULL AS ship_token_name,
                    NULL AS pilot_token_name,
                    NULL AS ship_asset_amount,
                    NULL AS pilot_asset_amount,
                    0 AS total_rewards,
                    utxo_plutus_data(era, cbor) as datum
                FROM 
                    utxos
                WHERE 
                    utxo_address(era, cbor) = from_bech32($7::varchar)
                    AND CAST(utxo_subject_amount(era, cbor, decode($5::varchar, 'hex')) AS INTEGER) > 0
                    AND spent_slot IS NULL
                UNION ALL
                
                SELECT 
                    id,
                    'Asteria' as class,
                    0 AS fuel,
                    0 AS position_x,
                    0 AS position_y,
                    CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 1 ->> 'bytes' AS VARCHAR(56)) AS spacetime_policy,
                    NULL AS ship_token_name,
                    NULL AS pilot_token_name,
                    NULL AS ship_asset_amount,
                    NULL AS pilot_asset_amount,
                    utxo_lovelace(era, cbor) as total_rewards,
                    utxo_plutus_data(era, cbor) as datum
                FROM 
                    utxos
                WHERE 
                    utxo_address(era, cbor) = from_bech32($8::varchar)
                    AND spent_slot IS NULL
            )
            SELECT
                id,
                fuel,
                position_x,
                position_y,
                spacetime_policy,
                ship_token_name,
                pilot_token_name,
                class,
                total_rewards,
                datum,
                ship_asset_amount,
                pilot_asset_amount
             FROM
                data
             WHERE
                ABS(position_x - $1::int) + ABS(position_y - $2::int) < $3::int
                AND spacetime_policy = $4::text
            ",
            center.x,
            center.y,
            radius,
            spacetime_policy_id,
            pellet_policy_id,
            spacetime_address,
            pellet_address,
            asteria_address,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| Error::new(e.to_string()))?;

        let mut map_objects: Vec<PositionalInterface> = fetched_objects
            .into_iter()
            .map(|record| match record.class.as_deref() {
                Some("Ship") => PositionalInterface::Ship(Ship {
                    id: ID::from(record.id.unwrap_or_default()),
                    fuel: record.fuel.unwrap_or(0),
                    position: Position {
                        x: record.position_x.unwrap_or(0),
                        y: record.position_y.unwrap_or(0),
                    },
                    spacetime_policy: PolicyId {
                        id: ID::from(record.spacetime_policy.clone().unwrap_or_default()),
                    },
                    ship_token_name: AssetName {
                        name: record.ship_token_name.clone().unwrap_or_default(),
                    },
                    pilot_token_name: AssetName {
                        name: record.pilot_token_name.clone().unwrap_or_default(),
                    },
                    class: record.class.unwrap_or_default(),
                    datum: record.datum.unwrap_or_default().to_string(),
                    assets: vec![
                        Asset {
                            policy_id: pellet_policy_id.clone(),
                            name: "FUEL".to_string(),
                            amount: record.fuel.unwrap_or(0),
                        },
                        Asset {
                            policy_id: format!("{}{}", record.spacetime_policy.clone().unwrap_or_default(), record.ship_token_name.clone().unwrap_or_default()),
                            name: String::from_utf8(hex::decode(record.ship_token_name.clone().unwrap_or_default()).unwrap_or_default()).unwrap_or_default(),
                            amount: record.ship_asset_amount.unwrap_or(0),
                        },
                        Asset {
                            policy_id: format!("{}{}", record.spacetime_policy.clone().unwrap_or_default(), record.pilot_token_name.clone().unwrap_or_default()),
                            name: String::from_utf8(hex::decode(record.pilot_token_name.unwrap_or_default()).unwrap_or_default()).unwrap_or_default(),
                            amount: record.pilot_asset_amount.unwrap_or(0),
                        },
                    ],
                }),
                Some("Pellet") => PositionalInterface::Pellet(Pellet {
                    id: ID::from(record.id.unwrap_or_default()),
                    fuel: record.fuel.unwrap_or(0),
                    position: Position {
                        x: record.position_x.unwrap_or(0),
                        y: record.position_y.unwrap_or(0),
                    },
                    spacetime_policy: PolicyId {
                        id: ID::from(record.spacetime_policy.unwrap_or_default()),
                    },
                    class: record.class.unwrap_or_default(),
                    datum: record.datum.unwrap_or_default().to_string(),
                    assets: vec![
                        Asset {
                            policy_id: pellet_policy_id.clone(),
                            name: "FUEL".to_string(),
                            amount: record.fuel.unwrap_or(0),
                        },
                    ],
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
                        .unwrap_or(0) / 1_000_000,
                    class: record.class.unwrap_or_default(),
                    datum: record.datum.unwrap_or_default().to_string(),
                    assets: vec![],
                }),
                _ => panic!("Unknown class type or class not provided"),
            })
            .collect();

        if tokens.is_some() {
            for token in tokens.unwrap() {
                let fetched_tokens = sqlx::query!(
                    "
                    SELECT 
                        id,
                        CAST(utxo_subject_amount(era, cbor, decode($6::varchar, 'hex')) AS BIGINT) AS amount,
                        CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 0 ->> 'int' AS INTEGER) AS position_x,
                        CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 1 ->> 'int' AS INTEGER) AS position_y,
                        CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 2 ->> 'bytes' AS VARCHAR(56)) AS spacetime_policy,
                        utxo_plutus_data(era, cbor) as datum
                    FROM 
                        utxos
                    WHERE
                        ABS(CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 0 ->> 'int' AS INTEGER) - $1::int) +
                        ABS(CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 1 ->> 'int' AS INTEGER) - $2::int) < $3::int
                        AND CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 2 ->> 'bytes' AS VARCHAR(56)) = $4::text
                        AND CAST(utxo_subject_amount(era, cbor, decode($6::varchar, 'hex')) AS BIGINT) > 0
                        AND utxo_address(era, cbor) = from_bech32($5::varchar)
                        AND spent_slot IS NULL
                    ",
                    center.x,
                    center.y,
                    radius,
                    spacetime_policy_id,
                    pellet_address,
                    token.policy_id,
                )
                .fetch_all(pool)
                .await
                .map_err(|e| Error::new(e.to_string()))?;

                for record in fetched_tokens {
                    let amount = (record.amount.unwrap_or(0) / 10i64.pow(token.decimals.unwrap_or(0).to_u32().unwrap_or(0))).to_i32().unwrap_or(0);

                    map_objects.push(PositionalInterface::Token(Token {
                        id: ID::from(record.id),
                        name: token.name.clone(),
                        asset_name: token.asset_name.clone(),
                        display_name: token.display_name.clone(),
                        amount: amount,
                        position: Position {
                            x: record.position_x.unwrap_or(0),
                            y: record.position_y.unwrap_or(0),
                        },
                        spacetime_policy: PolicyId {
                            id: ID::from(record.spacetime_policy.unwrap_or_default()),
                        },
                        class: "Token".to_string(),
                        datum: record.datum.unwrap_or_default().to_string(),
                        assets: vec![
                            Asset {
                                policy_id: token.policy_id.clone(),
                                name: token.asset_name.clone(),
                                amount: amount,
                            },
                        ],
                    }));
                }
            }
        }

        Ok(map_objects)
    }

    async fn leaderboard_players(
        &self,
        ctx: &Context<'_>,
        spacetime_policy_id: String,
        pellet_policy_id: String,
        spacetime_address: String,
    ) -> Result<Vec<LeaderboardRecord>, Error> {
        let pool = ctx
            .data::<sqlx::PgPool>()
            .map_err(|e| Error::new(e.message))?;

        let fetched_objects = sqlx::query!(
            "
            SELECT 
                id,
                CAST(utxo_subject_amount(era, cbor, decode($2::varchar, 'hex')) AS INTEGER) AS fuel,
                CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 2 ->> 'bytes' AS TEXT) AS ship_token_name,
                CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 3 ->> 'bytes' AS TEXT) AS pilot_token_name,
                ABS(CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 0 ->> 'int' AS INTEGER)) + ABS(CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 1 ->> 'int' AS INTEGER)) AS distance
            FROM 
                utxos
            WHERE 
                utxo_address(era, cbor) = from_bech32($3::varchar)
                AND utxo_has_policy_id(era, cbor, decode($1::varchar, 'hex'))
                AND spent_slot IS NULL
            ORDER BY distance ASC
            ",
            spacetime_policy_id,
            pellet_policy_id,
            spacetime_address,
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

    async fn leaderboard_winners(
        &self,
        ctx: &Context<'_>,
        spacetime_policy_id: String,
        pellet_policy_id: String,
        spacetime_address: String,
    ) -> Result<Vec<LeaderboardRecord>, Error> {
        let pool = ctx
            .data::<sqlx::PgPool>()
            .map_err(|e| Error::new(e.message))?;

        let fetched_objects = sqlx::query!(
            "
            SELECT 
                id,
                CAST(utxo_subject_amount(era, cbor, decode($2::varchar, 'hex')) AS INTEGER) AS fuel,
                CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 2 ->> 'bytes' AS TEXT) AS ship_token_name,
                CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 3 ->> 'bytes' AS TEXT) AS pilot_token_name
            FROM 
                utxos
            WHERE 
                utxo_address(era, cbor) = from_bech32($3::varchar)
                AND utxo_has_policy_id(era, cbor, decode($1::varchar, 'hex'))
                AND ABS(CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 0 ->> 'int' AS INTEGER)) + ABS(CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 1 ->> 'int' AS INTEGER)) = 0
            order by slot ASC
            ",
            spacetime_policy_id,
            pellet_policy_id,
            spacetime_address,
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
                distance: 0
            })
            .collect();

        Ok(map_objects)
    }

    async fn next_ship_token_name(
        &self,
        ctx: &Context<'_>,
        spacetime_address: String,
        spacetime_policy_id: String,
    ) -> Result<NextShipTokenName, Error> {
        let pool = ctx
            .data::<sqlx::PgPool>()
            .map_err(|e| Error::new(e.message))?;

        let fetched_objects = sqlx::query!(
            "
            SELECT
                CAST(REPLACE(CAST(utxo_plutus_data(era, cbor) -> 'fields' -> 2 ->> 'bytes' AS TEXT), '53484950', '') AS INTEGER) AS ship_number
            FROM 
                utxos
            WHERE 
                utxo_address(era, cbor) = from_bech32($1::varchar) AND utxo_has_policy_id(era, cbor, decode($2::varchar, 'hex'))
            ORDER BY ship_number DESC
            LIMIT 1
            ",
            spacetime_address,
            spacetime_policy_id,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| Error::new(e.to_string()))?;

        let ship_number_encoded = fetched_objects
            .get(0)
            .and_then(|r| r.ship_number.clone())
            .unwrap_or_default();

        let ship_number = String::from_utf8(hex::decode(format!("{}", ship_number_encoded))?)?.parse::<i32>().unwrap_or_default() + 1;

        Ok(NextShipTokenName {
            ship_name: format!("SHIP{}", ship_number),
            pilot_name: format!("PILOT{}", ship_number),
        })
    }

    async fn last_slot(
        &self,
        ctx: &Context<'_>,
    ) -> Result<LatestSlotNumber, Error> {
        let pool = ctx
            .data::<sqlx::PgPool>()
            .map_err(|e| Error::new(e.message))?;

        let fetched_objects = sqlx::query!("SELECT slot FROM blocks ORDER BY slot DESC LIMIT 1")
        .fetch_all(pool)
        .await
        .map_err(|e| Error::new(e.to_string()))?;

        let slot = fetched_objects
            .get(0)
            .and_then(|r| Some(r.slot.clone()))
            .unwrap_or_default();

        Ok(LatestSlotNumber { slot })
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

    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url.as_str())
        .await
        .expect("Failed to create pool");

    let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription)
        .register_output_type::<PositionalInterface>()
        .data(pool)
        .data(Data::new())
        .finish();

    rocket::build()
        .manage(schema)
        .mount("/", routes![index, graphql_request, graphiql])
        .attach(CORS)
}
