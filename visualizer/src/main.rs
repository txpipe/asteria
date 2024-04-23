use bevy::prelude::*;
use bevy_mod_picking::prelude::*;
use bevy_pancam::{PanCam, PanCamPlugin};
use bevy_rand::{plugin::EntropyPlugin, prelude::WyRand};

mod asteroid;
mod map;
mod ships;

#[derive(Component)]
struct MyCameraMarker;

fn setup_camera(mut commands: Commands) {
    commands
        .spawn(Camera2dBundle::default())
        .insert(PanCam::default());
}

fn setup_ui(mut commands: Commands) {
    commands.spawn(NodeBundle {
        background_color: Color::RED.into(),
        ..Default::default()
    });
}

// fn setup_environment(mut commands: Commands, asset_server: Res<AssetServer>) {
//     commands.spawn(SpriteBundle {
//         texture: asset_server.load("background.gif"),
//         ..default()
//     });
// }

fn main() {
    App::new()
        .add_plugins(DefaultPlugins.set(ImagePlugin::default_nearest()))
        .add_plugins(PanCamPlugin)
        .add_plugins(EntropyPlugin::<WyRand>::default())
        .add_plugins(DefaultPickingPlugins)
        .add_systems(Startup, setup_camera)
        .add_systems(Startup, setup_ui)
        // .add_systems(Startup, setup_environment)
        .add_plugins((map::MapPlugin, ships::ShipsPlugin, asteroid::AsteroidPlugin))
        .run();
}
