interface GodotBridge {
  send: (message: { action: string; [key: string]: unknown }) => void;
}

declare interface Window {
  GODOT_BRIDGE?: GodotBridge;
}
