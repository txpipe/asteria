use bevy::prelude::*;
use bevy_pancam::{PanCam, PanCamPlugin};

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

fn main() {
    App::new()
        .add_plugins(DefaultPlugins.set(ImagePlugin::default_nearest()))
        .add_plugins(PanCamPlugin::default())
        .add_systems(Startup, setup_camera)
        .add_systems(Startup, setup_ui)
        .add_plugins((map::MapPlugin, ships::ShipsPlugin, asteroid::AsteroidPlugin))
        .run();
}
