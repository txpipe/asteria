extends Node

signal dataset_updated

const radius = 1000

var api_url = ""
var shipyard_policy_id = ""
var ship_address = ""
var fuel_address = ""
var asteria_address = ""

const headers = ["Content-Type: application/json"]
const query = """
{
	objectsInRadius(
		center: { x: 0, y: 0 },
		radius: %s,
		shipyardPolicyId: "%s",
		shipAddress: "%s",
		fuelAddress: "%s",
		asteriaAddress: "%s"
	) {
		__typename,
		position {
			x,
			y
		},
		... on Ship {
			id,
			fuel,
			shipTokenName {
				name
			},
			pilotTokenName {
				name
			}
		},
		... on Fuel {
			fuel
		},
		... on Asteria {
			totalRewards
		}
	}
}
"""

func fetch_data():
	$HTTPRequest.request(api_url, headers, HTTPClient.METHOD_POST, JSON.stringify({
		"query": query % [
			radius,
			shipyard_policy_id,
			ship_address,
			fuel_address,
			asteria_address
		]
	}))


func _process(delta: float) -> void:
	$GUICanvasLayer/CenterContainer/Loader.rotation += delta * 10


func _ready():
	api_url = JavaScriptBridge.eval("new URL(window.location.href).searchParams.get('apiUrl')")
	shipyard_policy_id = JavaScriptBridge.eval("new URL(window.location.href).searchParams.get('shipyardPolicyId')")
	ship_address = JavaScriptBridge.eval("new URL(window.location.href).searchParams.get('shipAddress')")
	fuel_address = JavaScriptBridge.eval("new URL(window.location.href).searchParams.get('fuelAddress')")
	asteria_address = JavaScriptBridge.eval("new URL(window.location.href).searchParams.get('asteriaAddress')")
	
	$HTTPRequest.request_completed.connect(_on_request_completed)
	fetch_data()
	
	var request_timer = Timer.new()
	request_timer.wait_time = 20
	request_timer.autostart = true
	request_timer.one_shot = false
	request_timer.connect("timeout", _on_request_timer_timeout)
	add_child(request_timer)


func _on_request_completed(result, response_code, headers, body):
	var json = JSON.parse_string(body.get_string_from_utf8())
	Global.init_data(json)
	dataset_updated.emit()
	$GUICanvasLayer/CenterContainer/Loader.visible = false


func _on_request_timer_timeout():
	fetch_data()


func update_tooltip_position(position: Vector2) -> void:
	var cell_size = Vector2(Global.get_cell_size(), Global.get_cell_size()) * $MapCanvasLayer/Map/Camera.zoom
	var camera_position = $MapCanvasLayer/Map/Camera.position * $MapCanvasLayer/Map/Camera.zoom
	var tooltip_offset = Vector2($GUICanvasLayer/Tooltip.size.x / 2, $GUICanvasLayer/Tooltip.size.y + cell_size.y)
	var viewport_size = Vector2($MapCanvasLayer/Map.get_viewport_rect().size) / 2
	var tooltip_position = position * cell_size - camera_position - tooltip_offset + viewport_size
	
	if tooltip_position.x < 10:
		tooltip_offset.x = -cell_size.x
		tooltip_offset.y = $GUICanvasLayer/Tooltip.size.y / 2
	elif tooltip_position.x > $MapCanvasLayer/Map.get_viewport_rect().size.x - $GUICanvasLayer/Tooltip.size.x - 10:
		tooltip_offset.x = $GUICanvasLayer/Tooltip.size.x + cell_size.x
		tooltip_offset.y = $GUICanvasLayer/Tooltip.size.y / 2
	elif tooltip_position.y < 10:
		tooltip_offset.y = -cell_size.y
	
	tooltip_position = position * cell_size - camera_position - tooltip_offset + viewport_size
	if tooltip_position.y < 10:
		tooltip_position.y = 10
	
	$GUICanvasLayer/Tooltip.position = tooltip_position
	$GUICanvasLayer/Tooltip.visible = true


func _on_map_hide_tooltip() -> void:
	$GUICanvasLayer/Tooltip.visible = false


func _on_map_show_ship_tooltip(ship: Global.ShipData) -> void:
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Title.text = "SHIP"
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.text = "Position | %d, %d" % [ship.position.x, ship.position.y]
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.text = "Ship Token | %s" % ship.shipTokenName
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label3.text = "Pilot Token | %s" % ship.pilotTokenName
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label4.text = "Fuel | %s" % ship.fuel
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label3.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label4.visible = true
	update_tooltip_position(ship.position)


func _on_map_show_fuel_tooltip(fuel: Global.FuelData) -> void:
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Title.text = "FUEL PELLET"
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.text = "Position | %d, %d" % [fuel.position.x, fuel.position.y]
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.text = "Fuel | %s" % fuel.fuel
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label3.visible = false
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label4.visible = false
	update_tooltip_position(fuel.position)


func _on_map_show_asteria_tooltip(asteria: Global.AsteriaData) -> void:
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Title.text = "ASTERIA"
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.text = "Position | %d, %d" % [asteria.position.x, asteria.position.y]
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.text = "Total rewards | %s" % asteria.totalRewards
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label3.visible = false
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label4.visible = false
	update_tooltip_position(asteria.position)
