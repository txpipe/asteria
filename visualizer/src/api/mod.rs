use serde::{Deserialize, Serialize};
use tracing::error;

pub const API_URL: &str = "http://127.0.0.1:8000/graphql";

#[derive(Deserialize)]
struct AssetTokenDto {
    name: String,
}

#[derive(Deserialize)]
struct AssetPositionDto {
    x: u64,
    y: u64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct AssetDto {
    id: String,
    ship_token_name: AssetTokenDto,
    fuel: u64,
    position: AssetPositionDto,
}

#[derive(Deserialize)]
struct Data {
    ships: Vec<AssetDto>,
}

#[derive(Deserialize)]
struct Response {
    data: Data,
}

#[derive(Serialize)]
struct Request {
    query: String,
}

pub async fn get_assets() {
    let client = reqwest::Client::new();

    let response = client
        .post(API_URL)
        .header(reqwest::header::CONTENT_TYPE, "application/json")
        .body(r#"{"query":"{\n  ships {\n    id\n    fuel\n    position {\n      x\n      y\n    }\n  }\n}","variables":{}}"#)
        .send()
        .await;

    if let Err(err) = response {
        error!(error = err.to_string(), "Error to load assets");
        return;
    }

    // let response = response.unwrap().json::<Response>().await;
}
