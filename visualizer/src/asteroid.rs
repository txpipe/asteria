use bevy::prelude::*;

use crate::map::{Fuel, Position};

const TILE_SIZE: u32 = 64;

#[derive(Resource)]
pub struct Material {
    texture: Handle<Image>,
    layout: Handle<TextureAtlasLayout>,
}

impl FromWorld for Material {
    fn from_world(world: &mut World) -> Self {
        let texture: Handle<Image> = world
            .get_resource::<AssetServer>()
            .unwrap()
            .load("asteroid/sprite.png");

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
pub struct Asteroid {
    sprite_sheet: SpriteSheetBundle,
    position: Position,
    fuel: Fuel,
}

impl Asteroid {
    pub fn new(position: Position, fuel: Fuel, material: &Material) -> Self {
        Self {
            sprite_sheet: SpriteSheetBundle {
                atlas: TextureAtlas {
                    layout: material.layout.clone(),
                    index: 0,
                },
                transform: Transform {
                    scale: Vec3::new(0.8, 0.8, 1.0),
                    ..Default::default()
                },
                texture: material.texture.clone(),
                ..Default::default()
            },
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

pub struct AsteroidPlugin;

impl Plugin for AsteroidPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<Material>().add_systems(Update, render);
    }
}
