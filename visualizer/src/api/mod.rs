use serde::Deserialize;
use serde_json::json;
use std::error::Error;

pub const API_URL: &str = "http://127.0.0.1:8000/graphql";

#[derive(Debug, Deserialize)]
pub enum AssetClass {
    Ship,
    Fuel,
}

#[derive(Debug, Deserialize)]
pub struct AssetTokenDto {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct AssetPositionDto {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetDto {
    pub id: String,
    pub ship_token_name: Option<AssetTokenDto>,
    pub fuel: u32,
    pub position: AssetPositionDto,
    pub class: AssetClass,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Data {
    pub objects_in_radius: Vec<AssetDto>,
}

#[derive(Deserialize)]
struct Response {
    data: Data,
}

pub async fn get_assets() -> Result<Vec<AssetDto>, Box<dyn Error>> {
    let client = reqwest::Client::new();

    let query = r"
        query QueryRoot($center: PositionInput!, $radius: Int!) {
            objectsInRadius(center: $center, radius: $radius) {
                ... on Ship {
                    id
                    fuel
                    shipTokenName {
                        name
                    }
                    position {
                        x, y
                    }
                    class
                }
                ... on Fuel {
                    id 
                    fuel
                    position {
                        x, y
                    }
                    class
                }
            }
        }
    ";

    let body = json!({
        "query": query,
        "variables": {
            "center": {
                "x": 0,
                "y": 0
            },
            "radius": 500
        }
    });
    let response = client
        .post(API_URL)
        .header(reqwest::header::CONTENT_TYPE, "application/json")
        .json(&body)
        .send()
        .await?;

    response.error_for_status_ref()?;

    let response = response.json::<Response>().await?;

    Ok(response.data.objects_in_radius)
}
