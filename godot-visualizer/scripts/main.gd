extends Node

signal dataset_updated
signal current_position_selected(position: Vector2)
signal placeholder_ship_created(position: Vector2)
signal placeholder_ship_reset
signal follow_ship_selected(ship_id: String)
signal follow_ship_reset
signal next_position_selected(position: Vector2)
signal next_position_reset
signal init_joystick_mode

const radius = 1000
var loading = true

var mode = ""
var api_url = ""
var shipyard_policy_id = ""
var fuel_policy_id = ""
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
		fuelPolicyId: "%s",
		shipAddress: "%s",
		fuelAddress: "%s",
		asteriaAddress: "%s",
		tokens: [{
			name: "hosky",
			policyId: "%s",
			address: "%s"
		},{
			name: "stuff",
			policyId: "%s",
			address: "%s"
		},{
			name: "vyfi",
			policyId: "%s",
			address: "%s"
		}]
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
			},
			datum,
			assets {
				policyId,
				name,
				amount
			}
		},
		... on Fuel {
			id,
			fuel,
			datum,
			assets {
				policyId,
				name,
				amount
			}
		},
		... on Token {
			id,
			name,
			amount,
			datum,
			assets {
				policyId,
				name,
				amount
			}
		},
		... on Asteria {
			id,
			totalRewards,
			datum,
			assets {
				policyId,
				name,
				amount
			}
		}
	}
}
"""

var callback = JavaScriptBridge.create_callback(on_message)
var parent = JavaScriptBridge.get_interface("parent")

func fetch_data():
	$HTTPRequest.request(api_url, headers, HTTPClient.METHOD_POST, JSON.stringify({
		"query": query % [
			radius,
			shipyard_policy_id,
			fuel_policy_id,
			ship_address,
			fuel_address,
			asteria_address,
			
			fuel_policy_id,
			fuel_address,
			
			fuel_policy_id,
			fuel_address,
			
			fuel_policy_id,
			fuel_address
		]
	}))


func _process(delta: float) -> void:
	$GUICanvasLayer/HBoxContainerLoader/CenterContainer/Loader.rotation += delta * 10


func _ready():
	mode = JavaScriptBridge.eval("new URL(window.location.href).searchParams.get('mode')")
	api_url = JavaScriptBridge.eval("new URL(window.location.href).searchParams.get('apiUrl')")
	shipyard_policy_id = JavaScriptBridge.eval("new URL(window.location.href).searchParams.get('shipyardPolicyId')")
	fuel_policy_id = JavaScriptBridge.eval("new URL(window.location.href).searchParams.get('fuelPolicyId')")
	ship_address = JavaScriptBridge.eval("new URL(window.location.href).searchParams.get('shipAddress')")
	fuel_address = JavaScriptBridge.eval("new URL(window.location.href).searchParams.get('fuelAddress')")
	asteria_address = JavaScriptBridge.eval("new URL(window.location.href).searchParams.get('asteriaAddress')")
	
	#mode = "joystick"
	#api_url = "http://localhost:8000/graphql"
	#shipyard_policy_id = "f9497fc64e87c4da4ec6d2bd1a839b6af10a77c10817db7143ac3d20"
	#fuel_policy_id = "fc8ad4f84181b85dc04f7b8c2984b129284c4e272ef45cd6440575fd4655454c"
	#ship_address = "addr_test1wru5jl7xf6rufkjwcmft6x5rnd40zznhcyyp0km3gwkr6gq6sxzm6"
	#fuel_address = "addr_test1wr7g448cgxqmshwqfaacc2vyky5jsnzwyuh0ghxkgszhtlgzrxj63"
	#asteria_address = "addr_test1wqdsuy97njefz53rkhd4v6a2kuqk0md5mrn996ygwekrdyq369wjg"
	
	Global.set_mode(mode)
	
	if Global.get_mode() == "joystick":
		$GUICanvasLayer/HBoxContainer/VBoxContainerEnd/MarginContainerBottom.visible = false
		$GUICanvasLayer/HBoxContainerLoader/BoxContainer.visible = true
		init_joystick_mode.emit()
	
	$HTTPRequest.request_completed.connect(_on_request_completed)
	fetch_data()
	
	var request_timer = Timer.new()
	request_timer.wait_time = 10
	request_timer.autostart = true
	request_timer.one_shot = false
	request_timer.connect("timeout", _on_request_timer_timeout)
	add_child(request_timer)
	
	if parent != null:
		JavaScriptBridge.eval("""
			parent.window.GODOT_BRIDGE = {
				callback: null,
				setCallback: (callback) => parent.window.GODOT_BRIDGE.callback = callback,
				send: (data) => parent.window.GODOT_BRIDGE.callback(JSON.stringify(data)),
			};
		""", true)
		parent.window.GODOT_BRIDGE.setCallback(callback)
	
	JavaScriptBridge.eval("parent.window.postMessage({ action: 'map_init' })")


func on_message(args):
	if Global.get_mode() == "joystick":
		var data = JSON.parse_string(args[0])
		
		if data["action"] == "move_map":
			current_position_selected.emit(Vector2(data["x"], data["y"]))
		
		if data["action"] == "create_placeholder":
			placeholder_ship_created.emit(Vector2(data["x"], data["y"]))
		
		if data["action"] == "clear_placeholder":
			placeholder_ship_reset.emit()
		
		if data["action"] == "select_ship":
			follow_ship_selected.emit(data["shipNumber"])
		
		if data["action"] == "clear_ship":
			follow_ship_reset.emit()
		
		if data["action"] == "move_ship":
			next_position_selected.emit(Vector2(data["x"], data["y"]))
		
		if data["action"] == "clear_move_ship":
			next_position_reset.emit()
		
		if data["action"] == "refresh_data":
			if !loading:
				loading = true
				$GUICanvasLayer/HBoxContainerLoader/CenterContainer/Loader.visible = true
				fetch_data()


func _on_request_completed(result, response_code, headers, body):
	var json = JSON.parse_string(body.get_string_from_utf8())
	Global.init_data(json)
	dataset_updated.emit()
	loading = false
	$GUICanvasLayer/HBoxContainerLoader/CenterContainer/Loader.visible = false


func _on_request_timer_timeout():
	fetch_data()


func update_tooltip_position(position: Vector2) -> void:	
	var viewport = $MapCanvasLayer/Map.get_viewport_rect()
	if Global.get_mode() == "joystick":
		viewport = Rect2(
			Vector2($MapCanvasLayer/Map.get_viewport_rect().size.x/2, 0),
			Vector2($MapCanvasLayer/Map.get_viewport_rect().size.x/2, $MapCanvasLayer/Map.get_viewport_rect().size.y)
		)
	
	var cell_size = Vector2(Global.get_cell_size(), Global.get_cell_size()) * $MapCanvasLayer/Map/Camera.zoom
	var camera_position = $MapCanvasLayer/Map/Camera.position * $MapCanvasLayer/Map/Camera.zoom
	var tooltip_offset = Vector2($GUICanvasLayer/Tooltip.size.x / 2, $GUICanvasLayer/Tooltip.size.y + cell_size.y)
	var viewport_size = Vector2($MapCanvasLayer/Map.get_viewport_rect().size) / 2
	var tooltip_position = position * cell_size - camera_position - tooltip_offset + viewport_size
	
	if tooltip_position.x < viewport.position.x + 10:
		tooltip_offset.x = -cell_size.x
		tooltip_offset.y = $GUICanvasLayer/Tooltip.size.y / 2
	elif tooltip_position.x > viewport.size.x + viewport.position.x - $GUICanvasLayer/Tooltip.size.x - 10:
		tooltip_offset.x = $GUICanvasLayer/Tooltip.size.x + cell_size.x
		tooltip_offset.y = $GUICanvasLayer/Tooltip.size.y / 2
	elif tooltip_position.y < viewport.position.y + 10:
		tooltip_offset.y = -cell_size.y
	
	tooltip_position = position * cell_size - camera_position - tooltip_offset + viewport_size
	if tooltip_position.y < viewport.position.y + 10:
		tooltip_position.y = 10
	
	$GUICanvasLayer/Tooltip.position = tooltip_position
	$GUICanvasLayer/Tooltip.visible = true


func _on_map_hide_tooltip() -> void:
	Input.set_default_cursor_shape(Input.CURSOR_ARROW)
	$GUICanvasLayer/Tooltip.visible = false


func _on_map_show_ship_tooltip(ship: Global.ShipData) -> void:
	Input.set_default_cursor_shape(Input.CURSOR_POINTING_HAND)
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Title.text = "SHIP"
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.text = "Position | %d, %d" % [ship.position.x, ship.position.y]
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.text = "Ship Token | %s" % ship.shipTokenName.hex_decode().get_string_from_utf8()
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label3.text = "Pilot Token | %s" % ship.pilotTokenName.hex_decode().get_string_from_utf8()
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label4.text = "Fuel | %s" % ship.fuel
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label3.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label4.visible = true
	update_tooltip_position(ship.position)


func _on_map_show_fuel_tooltip(fuel: Global.FuelData) -> void:
	Input.set_default_cursor_shape(Input.CURSOR_POINTING_HAND)
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Title.text = "FUEL PELLET"
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.text = "Position | %d, %d" % [fuel.position.x, fuel.position.y]
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.text = "Fuel | %s" % fuel.fuel
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label3.visible = false
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label4.visible = false
	update_tooltip_position(fuel.position)


func _on_map_show_asteria_tooltip(asteria: Global.AsteriaData) -> void:
	Input.set_default_cursor_shape(Input.CURSOR_POINTING_HAND)
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Title.text = "ASTERIA"
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.text = "Position | %d, %d" % [asteria.position.x, asteria.position.y]
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.text = "Total rewards | %s" % asteria.totalRewards
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label3.visible = false
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label4.visible = false
	update_tooltip_position(asteria.position)


func _on_map_show_token_tooltip(token: Global.TokenData) -> void:
	Input.set_default_cursor_shape(Input.CURSOR_POINTING_HAND)
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Title.text = "Token"
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.text = "Position | %d, %d" % [token.position.x, token.position.y]
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.text = "Name | %s" % token.name
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label3.text = "Amount | %s" % token.amount
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label1.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label2.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label3.visible = true
	$GUICanvasLayer/Tooltip/MarginContainer/VBoxContainer/Label4.visible = false
	update_tooltip_position(token.position)
