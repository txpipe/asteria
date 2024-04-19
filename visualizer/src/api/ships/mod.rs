use graphql_client::reqwest::post_graphql;
use graphql_client::GraphQLQuery;

#[derive(GraphQLQuery)]
#[graphql(
    schema_path = "src/api/ships/schema.graphql",
    query_path = "src/api/ships/query.graphql",
    response_derives = "Debug"
)]
struct ShipView;

pub async fn get_ships() {
    let url = "http://localhost:8080";

    let variables = ship_view::Variables {
        limit: 100,
        offset: 1,
    };

    let client = reqwest::Client::new();

    let response = post_graphql::<ShipView, _>(&client, url, variables)
        .await
        .unwrap();

    dbg!(response)
}
