use bevy::{prelude::*, time::common_conditions::on_timer};
use bevy_mod_picking::prelude::*;
use bevy_rand::{prelude::WyRand, resource::GlobalEntropy};
use rand::Rng;
use std::time::Duration;

use crate::map::{Fuel, Position, ShipIdentity};

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
#[derive(States, Debug, Clone, Eq, PartialEq, Hash)]
struct HudState(Option<Entity>);

const PRIMARY_COLOR: Color = Color::rgb(255., 255., 0.);

fn render_hud(
    mut commands: Commands,
    query: Query<
        (Option<&PickingInteraction>, &ShipIdentity, &Position, &Fuel),
        With<ShipIdentity>,
    >,
    asset_server: Res<AssetServer>,
    mut state: ResMut<NextState<HudState>>,
) {
    let text_style = TextStyle {
        font: asset_server.load("fonts/pixel.otf"),
        font_size: 32.0,
        color: PRIMARY_COLOR,
    };

    for (i, s, p, f) in &query {
        if let Some(PickingInteraction::Pressed) = i {
            state.set(HudState(Some(
                commands
                    .spawn(NodeBundle {
                        style: Style {
                            width: Val::Percent(100.0),
                            height: Val::Percent(100.0),
                            align_items: AlignItems::Center,
                            justify_content: JustifyContent::Center,
                            ..default()
                        },
                        ..default()
                    })
                    .with_children(|parent| {
                        parent
                            .spawn(NodeBundle {
                                style: Style {
                                    width: Val::Percent(50.),
                                    height: Val::Percent(40.),
                                    border: UiRect::all(Val::Px(2.)),
                                    flex_wrap: FlexWrap::Wrap,
                                    padding: UiRect::all(Val::Px(12.)),
                                    ..default()
                                },
                                background_color: Color::rgba(0., 0., 0., 0.8).into(),
                                border_color: PRIMARY_COLOR.into(),
                                ..default()
                            })
                            .with_children(|parent| {
                                parent
                                    .spawn(NodeBundle {
                                        style: Style {
                                            width: Val::Percent(100.),
                                            height: Val::Px(60.),
                                            border: UiRect::bottom(Val::Px(2.)),
                                            align_items: AlignItems::Center,
                                            justify_content: JustifyContent::SpaceBetween,
                                            ..default()
                                        },
                                        border_color: PRIMARY_COLOR.into(),
                                        ..default()
                                    })
                                    .with_children(|parent| {
                                        parent.spawn(TextBundle::from_section(
                                            "Ship Detail",
                                            text_style.clone(),
                                        ));

                                        parent
                                            .spawn((
                                                ButtonBundle {
                                                    style: Style {
                                                        width: Val::Px(30.),
                                                        height: Val::Px(30.),
                                                        ..default()
                                                    },
                                                    background_color: Color::rgba(0., 0., 0., 1.)
                                                        .into(),
                                                    ..default()
                                                },
                                                On::<Pointer<Click>>::run(move |mut commands: Commands, state: Res<State<HudState>>,| {
                                                    commands.entity(state.get().0.unwrap()).despawn_recursive();
                                                }),
                                            ))
                                            .with_children(|parent| {
                                                parent.spawn(TextBundle::from_section(
                                                    "X",
                                                    text_style.clone(),
                                                ));
                                            });
                                    });

                                parent
                                    .spawn(NodeBundle {
                                        style: Style {
                                            width: Val::Percent(100.),
                                            height: Val::Px(60.),
                                            border: UiRect::bottom(Val::Px(1.)),
                                            align_items: AlignItems::Center,
                                            justify_content: JustifyContent::SpaceBetween,
                                            margin: UiRect::all(Val::Px(4.)),
                                            ..default()
                                        },
                                        ..default()
                                    })
                                    .with_children(|parent| {
                                        parent.spawn(TextBundle::from_section(
                                            "Name",
                                            text_style.clone(),
                                        ));
                                        parent.spawn(TextBundle::from_section(
                                            &s.name,
                                            text_style.clone(),
                                        ));
                                    });

                                parent
                                    .spawn(NodeBundle {
                                        style: Style {
                                            width: Val::Percent(100.),
                                            height: Val::Px(60.),
                                            border: UiRect::bottom(Val::Px(1.)),
                                            align_items: AlignItems::Center,
                                            justify_content: JustifyContent::SpaceBetween,
                                            margin: UiRect::all(Val::Px(4.)),
                                            ..default()
                                        },
                                        ..default()
                                    })
                                    .with_children(|parent| {
                                        parent.spawn(TextBundle::from_section(
                                            "Position",
                                            text_style.clone(),
                                        ));
                                        parent.spawn(TextBundle::from_section(
                                            format!("({},{})", p.x, p.y),
                                            text_style.clone(),
                                        ));
                                    });

                                parent
                                    .spawn(NodeBundle {
                                        style: Style {
                                            width: Val::Percent(100.),
                                            height: Val::Px(60.),
                                            border: UiRect::bottom(Val::Px(1.)),
                                            align_items: AlignItems::Center,
                                            justify_content: JustifyContent::SpaceBetween,
                                            margin: UiRect::all(Val::Px(4.)),
                                            ..default()
                                        },
                                        ..default()
                                    })
                                    .with_children(|parent| {
                                        parent.spawn(TextBundle::from_section(
                                            "Fuel Available",
                                            text_style.clone(),
                                        ));
                                        parent.spawn(TextBundle::from_section(
                                            f.available.to_string(),
                                            text_style.clone(),
                                        ));
                                    });
                            });
                    })
                    .id(),
            )));
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
