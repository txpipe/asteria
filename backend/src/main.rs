use std::ops::Deref;

use async_graphql::{Context, EmptyMutation, EmptySubscription, Schema};
use async_graphql_rocket::GraphQLRequest as Request;
use async_graphql_rocket::GraphQLResponse as Response;
use rocket::State;

struct QueryRoot;

#[async_graphql::Object]
impl QueryRoot {
    async fn hello(&self, _ctx: &Context<'_>) -> String {
        "GraphQL says hello!".to_string()
    }
}

type MySchema = Schema<QueryRoot, EmptyMutation, EmptySubscription>;

#[macro_use]
extern crate rocket;

#[get("/")]
fn index() -> &'static str {
    "Hello, world!"
}

#[rocket::post("/graphql", data = "<request>", format = "application/json")]
async fn graphql_request(schema: &State<MySchema>, request: Request) -> Response {
    request.execute(schema.deref()).await
}

#[launch]
fn rocket() -> _ {
    let schema = Schema::new(QueryRoot, EmptyMutation, EmptySubscription);
    rocket::build().manage(schema).mount("/", routes![index, graphql_request])
}
