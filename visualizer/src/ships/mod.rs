use bevy::{prelude::*, time::common_conditions::on_timer};
use bevy_rand::{prelude::WyRand, resource::GlobalEntropy};
use rand::Rng;
use std::time::Duration;

use crate::map::{Fuel, Position, ShipIdentity};
use hud::{HudState, render_hud};

mod hud;

const TILE_SIZE: u32 = 64;

#[derive(Resource)]
pub struct ShipMaterial {
    texture: Handle<Image>,
    layout: Handle<TextureAtlasLayout>,
}

impl FromWorld for ShipMaterial {
    fn from_world(world: &mut World) -> Self {
        let texture: Handle<Image> = world
            .get_resource::<AssetServer>()
            .unwrap()
            .load("ship/sprite.png");

        let layout = world
            .get_resource_mut::<Assets<TextureAtlasLayout>>()
            .unwrap()
            .add(TextureAtlasLayout::from_grid(
                Vec2::new(TILE_SIZE as f32, TILE_SIZE as f32),
                7,
                1,
                None,
                None,
            ));

        Self { texture, layout }
    }
}

#[derive(Bundle)]
pub struct Ship {
    sprite_sheet: SpriteSheetBundle,
    identity: ShipIdentity,
    position: Position,
    fuel: Fuel,
}

impl Ship {
    pub fn new(
        identity: ShipIdentity,
        position: Position,
        fuel: Fuel,
        material: &ShipMaterial,
    ) -> Self {
        Self {
            sprite_sheet: SpriteSheetBundle {
                atlas: TextureAtlas {
                    layout: material.layout.clone(),
                    index: 0,
                },
                transform: Transform {
                    scale: Vec3::new(1.5, 1.5, 1.0),
                    ..Default::default()
                },
                texture: material.texture.clone(),
                ..Default::default()
            },
            identity,
            position,
            fuel,
        }
    }
}

fn render(mut query: Query<(&mut Transform, &Position)>) {
    for (mut t, p) in query.iter_mut() {
        t.translation = Vec3::new(
            (p.x * TILE_SIZE as i32) as f32,
            (p.y * TILE_SIZE as i32) as f32,
            1.0,
        );
    }
}

fn random_move(
    mut query: Query<(&mut Position, &Fuel), With<ShipIdentity>>,
    mut rng: ResMut<GlobalEntropy<WyRand>>,
) {
    for (mut pos, fuel) in query.iter_mut() {
        if fuel.available > 300 {
            pos.x += rng.gen_range(-1..1);
            pos.y += rng.gen_range(-1..1);
        }
    }
}
pub struct ShipsPlugin;

impl Plugin for ShipsPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<ShipMaterial>()
            .add_systems(
                Update,
                (
                    (render).chain(),
                    random_move.run_if(on_timer(Duration::from_secs(2))),
                    render_hud,
                ),
            )
            .insert_state(HudState(None));
    }
}
