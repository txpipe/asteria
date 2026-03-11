use async_graphql::http::GraphiQLSource;
use blockfrost::{BlockFrostSettings, BlockfrostAPI, Pagination};
use blockfrost_openapi::models::address_utxo_content_inner::AddressUtxoContentInner;
use blockfrost_openapi::models::tx_content_output_amount_inner::TxContentOutputAmountInner;
use dotenv::dotenv;
use pallas::codec::minicbor;
use pallas::ledger::primitives::{PlutusData, ToCanonicalJson};
use reqwest::Client;
use rocket::State;
use rocket::fairing::{Fairing, Info, Kind};
use rocket::futures::future::join_all;
use rocket::http::{Header, Method, Status};
use rocket::response::content::RawHtml;
use serde_json::Value;
use std::ops::Deref;
use std::vec;

use async_graphql::*;
use async_graphql_rocket::GraphQLRequest as Request;
use async_graphql_rocket::GraphQLResponse as Response;

pub struct CORS;

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to responses",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(
        &self,
        request: &'r rocket::Request<'_>,
        response: &mut rocket::Response<'r>,
    ) {
        if request.method() == Method::Options {
            response.set_status(Status::NoContent);
            response.set_header(Header::new(
                "Access-Control-Allow-Methods",
                "POST, PATCH, GET, DELETE",
            ));
            response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        }
        response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }
}

fn utxo_id(utxo: &AddressUtxoContentInner) -> String {
    format!("{}#{}", utxo.tx_hash, utxo.output_index)
}

fn try_i32(value: i64, context: &str) -> Result<i32, Error> {
    i32::try_from(value)
        .map_err(|_| Error::new(format!("value out of range for i32 in {context}: {value}")))
}

fn parse_quantity(quantity: &str) -> Result<i64, Error> {
    quantity.parse::<i64>().map_err(|e| {
        Error::new(format!(
            "failed to parse asset quantity '{quantity}' as i64: {e}"
        ))
    })
}

fn sum_assets_by_policy(
    amounts: &[TxContentOutputAmountInner],
    policy_id: &str,
) -> Result<i64, Error> {
    amounts
        .iter()
        .filter(|amount| amount.unit.starts_with(policy_id))
        .try_fold(0_i64, |acc, amount| {
            Ok(acc + parse_quantity(&amount.quantity)?)
        })
}

fn asset_amount_for_unit(amounts: &[TxContentOutputAmountInner], unit: &str) -> Result<i64, Error> {
    amounts
        .iter()
        .find(|amount| amount.unit == unit)
        .map(|amount| parse_quantity(&amount.quantity))
        .transpose()
        .map(|amount| amount.unwrap_or(0))
}

fn inline_datum_json(inline_datum: &Option<String>) -> Result<Value, Error> {
    let datum_hex = inline_datum
        .as_deref()
        .unwrap_or("")
        .strip_prefix("0x")
        .unwrap_or(inline_datum.as_deref().unwrap_or(""));

    if datum_hex.is_empty() {
        return Ok(Value::Object(Default::default()));
    }

    let bytes = hex::decode(datum_hex).map_err(|e| Error::new(e.to_string()))?;
    let plutus_data: PlutusData =
        minicbor::decode(&bytes).map_err(|e| Error::new(e.to_string()))?;
    Ok(plutus_data.to_json())
}

fn datum_field(datum: &Value, index: usize) -> Result<&Value, Error> {
    let fields = datum
        .get("fields")
        .ok_or_else(|| Error::new("datum is missing 'fields' key"))?;
    let fields_array = fields
        .as_array()
        .ok_or_else(|| Error::new("datum 'fields' is not an array"))?;
    fields_array
        .get(index)
        .ok_or_else(|| Error::new(format!("datum field at index {index} is missing")))
}

fn datum_int(datum: &Value, index: usize) -> Result<i32, Error> {
    let field = datum_field(datum, index)?;
    let int_value = field
        .get("int")
        .ok_or_else(|| Error::new(format!("datum field at index {index} is missing 'int'")))?
        .as_i64()
        .ok_or_else(|| {
            Error::new(format!(
                "datum field at index {index} has non-integer 'int'"
            ))
        })?;

    try_i32(int_value, &format!("datum int at index {index}"))
}

fn datum_bytes(datum: &Value, index: usize) -> Result<String, Error> {
    let field = datum_field(datum, index)?;
    let bytes = field
        .get("bytes")
        .ok_or_else(|| Error::new(format!("datum field at index {index} is missing 'bytes'")))?
        .as_str()
        .ok_or_else(|| {
            Error::new(format!(
                "datum field at index {index} has non-string 'bytes'"
            ))
        })?;

    Ok(bytes.to_string())
}

fn decode_asset_name(hex_name: &str) -> Result<String, Error> {
    let bytes = hex::decode(hex_name)
        .map_err(|e| Error::new(format!("failed to decode asset name hex '{hex_name}': {e}")))?;
    String::from_utf8(bytes).map_err(|e| {
        Error::new(format!(
            "asset name is not valid utf8 for '{hex_name}': {e}"
        ))
    })
}

fn distance_from_center(x: i32, y: i32, center: &PositionInput) -> i32 {
    (x - center.x).abs() + (y - center.y).abs()
}

fn parse_ship_number(token_name_hex: &str) -> Option<i32> {
    let stripped = token_name_hex.strip_prefix("53484950")?;

    let bytes = hex::decode(stripped).ok()?;
    let value = String::from_utf8(bytes).ok()?;
    value.parse::<i32>().ok()
}

impl TryFrom<(String, String, AddressUtxoContentInner)> for Ship {
    type Error = Error;

    fn try_from(value: (String, String, AddressUtxoContentInner)) -> Result<Self, Self::Error> {
        let (spacetime_policy_id, pellet_policy_id, utxo) = value;
        let datum_json = inline_datum_json(&utxo.inline_datum)?;

        let position_x = datum_int(&datum_json, 0)?;
        let position_y = datum_int(&datum_json, 1)?;
        let ship_token_name = datum_bytes(&datum_json, 2)?;
        let pilot_token_name = datum_bytes(&datum_json, 3)?;
        let amounts = &utxo.amount;
        let fuel = sum_assets_by_policy(amounts, &pellet_policy_id)?;
        let ship_unit = format!("{}{}", spacetime_policy_id, ship_token_name);
        let pilot_unit = format!("{}{}", spacetime_policy_id, pilot_token_name);
        let ship_amount = asset_amount_for_unit(amounts, &ship_unit)?;
        let pilot_amount = asset_amount_for_unit(amounts, &pilot_unit)?;

        Ok(Ship {
            id: ID::from(utxo_id(&utxo)),
            fuel: try_i32(fuel, "ship fuel")?,
            position: Position {
                x: position_x,
                y: position_y,
            },
            spacetime_policy: PolicyId {
                id: ID::from(spacetime_policy_id.clone()),
            },
            ship_token_name: AssetName {
                name: ship_token_name.clone(),
            },
            pilot_token_name: AssetName {
                name: pilot_token_name.clone(),
            },
            class: "Ship".to_string(),
            datum: datum_json.to_string(),
            assets: vec![
                Asset {
                    policy_id: pellet_policy_id,
                    name: "FUEL".to_string(),
                    amount: try_i32(fuel, "ship fuel asset")?,
                },
                Asset {
                    policy_id: ship_unit,
                    name: decode_asset_name(&ship_token_name)?,
                    amount: try_i32(ship_amount, "ship token amount")?,
                },
                Asset {
                    policy_id: pilot_unit,
                    name: decode_asset_name(&pilot_token_name)?,
                    amount: try_i32(pilot_amount, "pilot token amount")?,
                },
            ],
        })
    }
}

impl TryFrom<(String, AddressUtxoContentInner)> for Pellet {
    type Error = Error;

    fn try_from(value: (String, AddressUtxoContentInner)) -> Result<Self, Self::Error> {
        let (pellet_policy_id, utxo) = value;
        let datum_json = inline_datum_json(&utxo.inline_datum)?;
        let position_x = datum_int(&datum_json, 0)?;
        let position_y = datum_int(&datum_json, 1)?;
        let spacetime_policy = datum_bytes(&datum_json, 2)?;
        let fuel = sum_assets_by_policy(&utxo.amount, &pellet_policy_id)?;

        Ok(Pellet {
            id: ID::from(utxo_id(&utxo)),
            fuel: try_i32(fuel, "pellet fuel")?,
            position: Position {
                x: position_x,
                y: position_y,
            },
            spacetime_policy: PolicyId {
                id: ID::from(spacetime_policy),
            },
            class: "Pellet".to_string(),
            datum: datum_json.to_string(),
            assets: vec![Asset {
                policy_id: pellet_policy_id,
                name: "FUEL".to_string(),
                amount: try_i32(fuel, "pellet fuel asset")?,
            }],
        })
    }
}

impl TryFrom<AddressUtxoContentInner> for Asteria {
    type Error = Error;

    fn try_from(utxo: AddressUtxoContentInner) -> Result<Self, Self::Error> {
        let datum_json = inline_datum_json(&utxo.inline_datum)?;
        let _spacetime_policy = datum_bytes(&datum_json, 1)?;
        let total_rewards = asset_amount_for_unit(&utxo.amount, "lovelace")? / 1_000_000;

        Ok(Asteria {
            id: ID::from(utxo_id(&utxo)),
            position: Position { x: 0, y: 0 },
            total_rewards,
            class: "Asteria".to_string(),
            datum: datum_json.to_string(),
            assets: vec![],
        })
    }
}

fn scale_token_amount(raw_amount: i64, decimals: Option<i32>) -> Result<i64, Error> {
    let decimals_value = decimals.unwrap_or(0);
    if decimals_value < 0 {
        return Err(Error::new(format!(
            "token decimals cannot be negative: {decimals_value}"
        )));
    }

    if decimals_value == 0 {
        return Ok(raw_amount);
    }

    let divisor = 10_i64.checked_pow(decimals_value as u32).ok_or_else(|| {
        Error::new(format!(
            "token decimals too large for scaling divisor: {decimals_value}"
        ))
    })?;

    Ok(raw_amount / divisor)
}

impl TryFrom<(TokenInput, AddressUtxoContentInner)> for Token {
    type Error = Error;

    fn try_from(value: (TokenInput, AddressUtxoContentInner)) -> Result<Self, Self::Error> {
        let (token, utxo) = value;
        let datum_json = inline_datum_json(&utxo.inline_datum)?;
        let position_x = datum_int(&datum_json, 0)?;
        let position_y = datum_int(&datum_json, 1)?;
        let spacetime_policy = datum_bytes(&datum_json, 2)?;

        let raw_amount = asset_amount_for_unit(&utxo.amount, &token.policy_id)?;
        let scaled_amount = scale_token_amount(raw_amount, token.decimals)?;

        Ok(Token {
            id: ID::from(utxo_id(&utxo)),
            name: token.name,
            asset_name: token.asset_name.clone(),
            display_name: token.display_name,
            amount: try_i32(scaled_amount, "token amount")?,
            position: Position {
                x: position_x,
                y: position_y,
            },
            spacetime_policy: PolicyId {
                id: ID::from(spacetime_policy),
            },
            class: "Token".to_string(),
            datum: datum_json.to_string(),
            assets: vec![Asset {
                policy_id: token.policy_id,
                name: token.asset_name,
                amount: try_i32(scaled_amount, "token asset amount")?,
            }],
        })
    }
}

async fn fetch_utxos_by_policy(
    api: &BlockfrostAPI,
    address: &str,
    policy_id: &str,
) -> Result<Vec<AddressUtxoContentInner>, Error> {
    api.addresses_utxos_asset(address, policy_id, Pagination::all())
        .await
        .map_err(|e| Error::new(e.to_string()))
}

async fn fetch_utxos_by_address(
    api: &BlockfrostAPI,
    address: &str,
) -> Result<Vec<AddressUtxoContentInner>, Error> {
    api.addresses_utxos(address, Pagination::all())
        .await
        .map_err(|e| Error::new(e.to_string()))
}

async fn ships_in_radius(
    api: &BlockfrostAPI,
    spacetime_address: &str,
    spacetime_policy_id: &str,
    pellet_policy_id: &str,
    radius: i32,
    center: &PositionInput,
) -> Result<Vec<PositionalInterface>, Error> {
    Ok(
        fetch_utxos_by_policy(api, spacetime_address, spacetime_policy_id)
            .await?
            .into_iter()
            .map(|x| {
                Ship::try_from((
                    spacetime_policy_id.to_string(),
                    pellet_policy_id.to_string(),
                    x,
                ))
            })
            .collect::<Result<Vec<Ship>, Error>>()?
            .into_iter()
            .filter(|ship| {
                let distance = distance_from_center(ship.position.x, ship.position.y, center);
                distance < radius
            })
            .map(|ship| PositionalInterface::Ship(ship.clone()))
            .collect::<Vec<PositionalInterface>>(),
    )
}

async fn pellets_in_radius(
    api: &BlockfrostAPI,
    pellet_address: &str,
    pellet_policy_id: &str,
    radius: i32,
    center: &PositionInput,
) -> Result<Vec<PositionalInterface>, Error> {
    Ok(
        fetch_utxos_by_policy(api, pellet_address, pellet_policy_id)
            .await?
            .into_iter()
            .map(|x| Pellet::try_from((pellet_policy_id.to_string(), x)))
            .collect::<Result<Vec<Pellet>, Error>>()?
            .into_iter()
            .filter(|pellet| {
                let distance = distance_from_center(pellet.position.x, pellet.position.y, center);
                distance < radius
            })
            .map(|pellet| PositionalInterface::Pellet(pellet.clone()))
            .collect::<Vec<PositionalInterface>>(),
    )
}

async fn asteria_in_radius(
    api: &BlockfrostAPI,
    asteria_address: &str,
    spacetime_policy_id: &str,
    radius: i32,
    center: &PositionInput,
) -> Result<Option<PositionalInterface>, Error> {
    for utxo in fetch_utxos_by_address(api, asteria_address).await? {
        let datum_json = inline_datum_json(&utxo.inline_datum)?;
        let spacetime_policy = datum_bytes(&datum_json, 1)?;
        if spacetime_policy != spacetime_policy_id {
            continue;
        }
        let asteria = Asteria::try_from(utxo)?;

        let distance = distance_from_center(asteria.position.x, asteria.position.y, center);
        if distance >= radius {
            continue;
        }

        return Ok(Some(PositionalInterface::Asteria(asteria)));
    }
    Ok(None)
}

async fn tokens_in_radius(
    api: &BlockfrostAPI,
    pellet_address: &str,
    token: &TokenInput,
    radius: i32,
    center: &PositionInput,
) -> Result<Vec<PositionalInterface>, Error> {
    Ok(fetch_utxos_by_policy(api, pellet_address, &token.policy_id)
        .await?
        .into_iter()
        .map(|utxo| Token::try_from((token.clone(), utxo)))
        .collect::<Result<Vec<Token>, Error>>()?
        .into_iter()
        .filter(|token| distance_from_center(token.position.x, token.position.y, center) <= radius)
        .filter(|token| token.amount > 0)
        .map(PositionalInterface::Token)
        .collect())
}

struct QueryRoot;

#[derive(Clone)]
pub struct Data {
    pub ships: Vec<Ship>,
    pub pellets: Vec<Pellet>,
    pub tokens: Vec<Token>,
    pub asteria: Asteria,
}

#[derive(Clone, SimpleObject, Debug)]
pub struct Asset {
    pub policy_id: String,
    pub name: String,
    pub amount: i32,
}

impl Default for Data {
    fn default() -> Self {
        Self::new()
    }
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

#[derive(Clone, SimpleObject)]
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

#[derive(Clone, SimpleObject, Debug)]
pub struct Asteria {
    id: ID,
    position: Position,
    total_rewards: i64,
    class: String,
    datum: String,
    assets: Vec<Asset>,
}

#[derive(Clone, SimpleObject, Debug)]
pub struct AsteriaState {
    ship_counter: i32,
    spacetime_policy: PolicyId,
    reward: i64,
}

#[derive(Clone, SimpleObject, Debug)]
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

#[derive(Clone, SimpleObject, Debug)]
pub struct Position {
    x: i32,
    y: i32,
}

#[derive(Clone, SimpleObject, Debug)]
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
    #[allow(clippy::too_many_arguments)]
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
        let api = ctx
            .data::<BlockfrostAPI>()
            .map_err(|e| Error::new(e.message))?;

        let mut map_objects = Vec::new();

        let (ships, pellets, asteria, tokens) = tokio::join!(
            ships_in_radius(
                api,
                &spacetime_address,
                &spacetime_policy_id,
                &pellet_policy_id,
                radius,
                &center,
            ),
            pellets_in_radius(api, &pellet_address, &pellet_policy_id, radius, &center),
            asteria_in_radius(api, &asteria_address, &spacetime_policy_id, radius, &center),
            async {
                match tokens.as_ref().map(|tokens| {
                    tokens
                        .iter()
                        .map(|token| tokens_in_radius(api, &pellet_address, token, radius, &center))
                        .collect::<Vec<_>>()
                }) {
                    Some(futs) => join_all(futs).await,
                    None => Vec::new(),
                }
            }
        );

        map_objects.extend(ships?);
        map_objects.extend(pellets?);
        map_objects.extend(asteria?.into_iter());
        for token_objects in tokens {
            map_objects.extend(token_objects?);
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
        let api = ctx
            .data::<BlockfrostAPI>()
            .map_err(|e| Error::new(e.message))?;
        let utxos = fetch_utxos_by_policy(api, &spacetime_address, &spacetime_policy_id).await?;

        let mut records: Vec<(i32, LeaderboardRecord)> = utxos
            .into_iter()
            .map(|utxo| {
                let datum_json = inline_datum_json(&utxo.inline_datum)?;
                let position_x = datum_int(&datum_json, 0)?;
                let position_y = datum_int(&datum_json, 1)?;
                let distance = position_x.abs() + position_y.abs();
                let ship_token_name = datum_bytes(&datum_json, 2)?;
                let pilot_token_name = datum_bytes(&datum_json, 3)?;
                let fuel = sum_assets_by_policy(&utxo.amount, &pellet_policy_id)?;

                Ok::<_, Error>((
                    distance,
                    LeaderboardRecord {
                        ranking: 0,
                        address: utxo_id(&utxo),
                        ship_name: ship_token_name,
                        pilot_name: pilot_token_name,
                        fuel: try_i32(fuel, "leaderboard player fuel")?,
                        distance,
                    },
                ))
            })
            .collect::<Result<Vec<_>, Error>>()?;

        records.sort_by_key(|(distance, _)| *distance);

        let ranked = records
            .into_iter()
            .enumerate()
            .map(|(index, (_, mut record))| {
                record.ranking = index as i32 + 1;
                record
            })
            .collect();

        Ok(ranked)
    }

    async fn leaderboard_winners(
        &self,
        ctx: &Context<'_>,
        spacetime_policy_id: String,
        pellet_policy_id: String,
        spacetime_address: String,
    ) -> Result<Vec<LeaderboardRecord>, Error> {
        let api = ctx
            .data::<BlockfrostAPI>()
            .map_err(|e| Error::new(e.message))?;
        let utxos = fetch_utxos_by_policy(api, &spacetime_address, &spacetime_policy_id).await?;

        let mut winners = Vec::new();

        for utxo in utxos {
            let datum_json = inline_datum_json(&utxo.inline_datum)?;
            let position_x = datum_int(&datum_json, 0)?;
            let position_y = datum_int(&datum_json, 1)?;
            let distance = position_x.abs() + position_y.abs();
            if distance != 0 {
                continue;
            }

            let ship_token_name = datum_bytes(&datum_json, 2)?;
            let pilot_token_name = datum_bytes(&datum_json, 3)?;
            let fuel = sum_assets_by_policy(&utxo.amount, &pellet_policy_id)?;

            winners.push(LeaderboardRecord {
                ranking: 0,
                address: utxo_id(&utxo),
                ship_name: ship_token_name,
                pilot_name: pilot_token_name,
                fuel: try_i32(fuel, "leaderboard winner fuel")?,
                distance: 0,
            });
        }

        let ranked = winners
            .into_iter()
            .enumerate()
            .map(|(index, mut record)| {
                record.ranking = index as i32 + 1;
                record
            })
            .collect();

        Ok(ranked)
    }

    async fn next_ship_token_name(
        &self,
        ctx: &Context<'_>,
        spacetime_address: String,
        spacetime_policy_id: String,
    ) -> Result<NextShipTokenName, Error> {
        let api = ctx
            .data::<BlockfrostAPI>()
            .map_err(|e| Error::new(e.message))?;
        let utxos = fetch_utxos_by_policy(api, &spacetime_address, &spacetime_policy_id).await?;

        let mut max_ship_number = 0;
        for utxo in utxos {
            let datum_json = inline_datum_json(&utxo.inline_datum)?;
            let ship_token_name = datum_bytes(&datum_json, 2)?;
            if let Some(number) = parse_ship_number(&ship_token_name)
                && number > max_ship_number
            {
                max_ship_number = number;
            }
        }

        let ship_number = max_ship_number + 1;

        Ok(NextShipTokenName {
            ship_name: format!("SHIP{}", ship_number),
            pilot_name: format!("PILOT{}", ship_number),
        })
    }

    async fn last_slot(&self, ctx: &Context<'_>) -> Result<LatestSlotNumber, Error> {
        let api = ctx
            .data::<BlockfrostAPI>()
            .map_err(|e| Error::new(e.message))?;
        let block = api
            .blocks_latest()
            .await
            .map_err(|e| Error::new(e.to_string()))?;

        let slot = block.slot.unwrap_or(0);

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

    let mut settings = BlockFrostSettings::new();
    settings.base_url = Some(
        std::env::var("BLOCKFROST_BASE_URL")
            .expect("BLOCKFROST_BASE_URL must be set in the environment"),
    );

    if let Ok(dmtr_api_key) = std::env::var("DMTR_API_KEY") {
        settings.headers =
            std::collections::HashMap::from([("dmtr-api-key".to_string(), dmtr_api_key)]);
    }

    let project_id =
        std::env::var("BLOCKFROST_PROJECT_ID").unwrap_or("asteria-backend".to_string());

    let client =
        BlockfrostAPI::new_with_client(&project_id, settings, Client::builder().use_rustls_tls())
            .expect("failed to create Blockfrost client");

    let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription)
        .register_output_type::<PositionalInterface>()
        .data(client)
        .data(Data::new())
        .finish();

    rocket::build()
        .manage(schema)
        .mount("/", routes![index, graphql_request, graphiql])
        .attach(CORS)
}
