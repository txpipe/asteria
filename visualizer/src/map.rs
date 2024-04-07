use bevy::prelude::*;
use rand::Rng;

pub trait FromRandom<R>
where
    R: rand::Rng,
{
    fn random(rng: &mut R) -> Self;
}

#[derive(Component)]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

impl<R> FromRandom<R> for Position
where
    R: Rng,
{
    fn random(rng: &mut R) -> Self {
        Self {
            x: rng.gen_range(-20..20),
            y: rng.gen_range(-20..20),
        }
    }
}

#[derive(Component)]
pub struct Fuel {
    pub available: u32,
}

impl<R> FromRandom<R> for Fuel
where
    R: Rng,
{
    fn random(rng: &mut R) -> Self {
        Self {
            available: rng.gen_range(0..500),
        }
    }
}

#[derive(Component)]
pub struct Identity {
    pub name: String,
}

impl<R> FromRandom<R> for Identity
where
    R: Rng,
{
    fn random(rng: &mut R) -> Self {
        Self {
            name: format!("XXX{}", rng.gen_range(0..2000)),
        }
    }
}
#[derive(Bundle)]
pub struct Asteroid {
    pub identity: Identity,
    pub position: Position,
    pub fuel: Fuel,
}

impl<R> FromRandom<R> for Asteroid
where
    R: Rng,
{
    fn random(rng: &mut R) -> Self {
        Self {
            identity: FromRandom::<R>::random(rng),
            position: FromRandom::<R>::random(rng),
            fuel: FromRandom::<R>::random(rng),
        }
    }
}

const RANDOM_SHIP_COUNT: usize = 150;
const RANDOM_ASTEROID_COUNT: usize = 200;

pub fn spawn_random_map(
    mut commands: Commands,
    ship_material: Res<crate::ships::ShipMaterial>,
    asteroid_material: Res<crate::asteroid::Material>,
) {
    let mut rng = rand::thread_rng();

    for _ in 0..RANDOM_SHIP_COUNT {
        commands.spawn(crate::ships::Ship::new(
            FromRandom::random(&mut rng),
            FromRandom::random(&mut rng),
            FromRandom::random(&mut rng),
            &ship_material,
        ));
    }

    for _ in 0..RANDOM_ASTEROID_COUNT {
        commands.spawn(crate::asteroid::Asteroid::new(
            FromRandom::random(&mut rng),
            FromRandom::random(&mut rng),
            FromRandom::random(&mut rng),
            &asteroid_material,
        ));
    }
}

pub struct MapPlugin;

impl Plugin for MapPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, spawn_random_map);
        //app.add_systems(Update, update_map.run_if(on_timer(Duration::from_secs(4))));
    }
}
