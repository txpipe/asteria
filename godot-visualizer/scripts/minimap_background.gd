extends Panel

const orbits_count = 10

func _draw():
	for i in range(orbits_count):
		draw_circle(Vector2(size.x/2, size.y/2), size.y / orbits_count * (i + 1), Color("#FFF75D", .1), false, 1, true)
