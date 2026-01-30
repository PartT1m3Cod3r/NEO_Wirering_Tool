# Neo Wiring Tool - Agent Reference

## Project Overview
A React-based PWA (Progressive Web App) for visualizing and designing wiring configurations for Neo devices. The app has two main sections:
1. **Wiring Lookup** (`/`) - Quick reference for pin configurations based on plug type and device
2. **System Wiring** (`/system`) - Interactive diagram designer for complete system layouts

## Tech Stack
- React 19 + Vite 7
- ReactFlow 11 (for interactive diagrams)
- react-router-dom (client-side routing)
- html-to-image (for PNG export)
- PWA support via vite-plugin-pwa

## Recent Features Implemented

### 1. Light/Dark Theme Support
- CSS variables for theming (`--bg-primary`, `--text-primary`, etc.)
- Theme toggle in navigation (☀️/🌙)
- Persisted in localStorage
- Files: `ThemeContext.jsx`, `index.css`

### 2. 2-Wire / 3-Wire Configuration (Input Sensors)
- **2-wire**: Signal + Power only (no GND/Pin 4)
- **3-wire**: Signal + Power + GND (standard)
- Dropdown in Device Config Panel
- Wiring diagram updates dynamically
- GND edge/terminal hidden in 2-wire mode
- Applies to: Wiring Lookup, System Wiring, Device Config Panel

### 3. Image Export (System Wiring)
- PNG export of the diagram
- Hides UI overlays (buttons, controls, minimap)
- Uses html-to-image library
- White background for light mode, dark for dark mode
- Known issue: Cables behind nodes may not capture perfectly

### 4. Auto-Assign Next Available Channel/Output
- When adding devices, automatically finds next available channel/output
- Warns about pin conflicts

### 5. Device Name Editing
- All node types show custom labels
- Config panel has name input field

### 6. Latching Relay Support
- Separate node type with SET/RESET coils
- Outputs labeled as "Out 1/2/3/4"

### 7. Power Input (Battery) Nodes
- Special node type for power supply
- Cables labeled at battery side
- Shifted 15px left to avoid overlap

## File Structure

```
src/
├── components/
│   ├── edges/
│   │   └── ColoredWireEdge.jsx    # Custom edge with labels
│   ├── nodes/
│   │   ├── BatteryNode.jsx        # Power input nodes
│   │   ├── LatchingRelayNode.jsx  # Latching relay nodes
│   │   ├── NeoDeviceNode.jsx      # Neo M12 connector
│   │   ├── RelayNode.jsx          # Standard relay
│   │   └── SensorNode.jsx         # Sensors (0-10V, 4-20mA, etc.)
│   ├── system/
│   │   ├── DeviceConfigPanel.jsx  # Right sidebar config
│   │   ├── DevicePalette.jsx      # Left sidebar device list
│   │   └── PinUsageSummary.jsx    # Pin conflict display
│   ├── Navigation.jsx             # (if exists)
│   ├── PlugDisplay.jsx            # Wiring Lookup pin table
│   ├── ReactFlowDiagram.jsx       # Wiring Lookup diagram
│   └── WiringDiagram.jsx          # (legacy?)
├── context/
│   └── ThemeContext.jsx           # Dark/light theme state
├── data/
│   └── plugData.js               # Pin configurations, colors
├── pages/
│   ├── SystemWiring.jsx          # Main system designer page
│   ├── SystemWiring.css          # Styles for system page
│   └── App.jsx                   # Wiring Lookup page
├── App.css                       # Global styles
├── index.css                     # CSS variables, theme styles
└── main.jsx                      # App entry, router setup
```

## Key Data Structures

### Device Object (System Wiring)
```javascript
{
  id: 'device-1234567890',
  type: '0-10v',           // or '4-20ma', 'relay', 'latching', etc.
  plugType: 'inputs',      // 'inputs', 'outputs', 'communications'
  label: 'My Sensor',
  channel: 1,              // for inputs
  output: 2,               // for outputs
  input: 1,                // for pulse counter
  wireMode: '3-wire',      // '2-wire' or '3-wire' (inputs only)
  powerSource: 'Solar'     // or 'PSU'
}
```

### Pin Map (Inputs)
- Channel 1 → Pin 8 (Red)
- Channel 2 → Pin 7 (Blue)
- Channel 3 → Pin 6 (Pink)
- Channel 4 → Pin 5 (Grey)

### Pin Map (Outputs)
- Output 1 → Pin 5 (Grey) / A1
- Output 2 → Pin 6 (Pink) / A2
- Output 3 → Pin 7 (Blue) / A3
- Output 4 → Pin 8 (Red) / A4

### Color Map
```javascript
const colorMap = {
  white: '#FFFFFF',
  brown: '#8B4513',
  green: '#00FF00',
  yellow: '#FFFF00',
  grey: '#808080',
  pink: '#FFC0CB',
  blue: '#0000FF',
  red: '#FF0000'
};
```

## Known Issues / TODOs

### High Priority
1. **Image Export Missing Cables**
   - Cables behind nodes don't always render in PNG export
   - Tried: toSvg instead of toPng, foreignObjectRendering, various delays
   - May need to try: dom-to-image-more, or manual canvas drawing

2. **Pin Conflict Detection**
   - Currently recalculates on every connectedDevices change
   - May have edge cases with latching relays

### Medium Priority
3. **Wire Mode UI Consistency**
   - Wiring Lookup: Shows wire mode dropdown only for inputs
   - System Wiring: Shows in Device Config Panel
   - Should verify both work correctly

4. **Node Positioning**
   - Power input nodes shifted 15px left (x=385 vs x=400)
   - May need adjustment for different screen sizes

### Low Priority / Nice to Have
5. **Export Improvements**
   - Add PDF export option
   - Add wiring schedule/report generation

6. **Undo/Redo**
   - No undo support for device additions/removals

7. **Drag and Drop**
   - Currently palette is click-to-add
   - Could support drag from palette to diagram

## Architecture Decisions

### 1. Pure Functions Outside Component
Helper functions like `getDeviceTerminals()` and `createEdgesForDevice()` are defined outside the SystemWiring component to avoid React hook ordering issues (TDZ errors in production builds).

### 2. connectedDevices as Source of Truth
The `connectedDevices` array is the primary state. Nodes and edges are derived from it via useEffect. This allows:
- Easy save/load of designs (just JSON)
- Consistent state across diagram and sidebar

### 3. Node IDs
- Neo device nodes: `neo-inputs`, `neo-outputs`, `neo-comms`
- Device nodes: `device-${timestamp}`

### 4. Edge Type
All edges use `type: 'coloredWire'` which is a custom edge component that:
- Routes around nodes (not through them)
- Shows labels at appropriate positions
- Uses cable colors for stroke

## Deployment

### GitHub Pages (Recommended)
```bash
# Uncomment base in vite.config.js
base: '/NEO_Wirering_Tool/',

npm run build
npm run deploy
```

### Local Testing
```bash
npm run dev
# or
npm run build
npx serve -s dist
```

## Common Tasks

### Adding a New Device Type
1. Add to `availableDevices` array in `SystemWiring.jsx`
2. Add pin mapping in `getUsedPins()`
3. Add terminal config in `getDeviceTerminals()`
4. Add edge creation in `createEdgesForDevice()`
5. Add node type if needed (in `nodeTypes` object)

### Changing Cable Label Position
Edit `ColoredWireEdge.jsx`:
- `shiftedX` calculation controls label position
- Currently offset by -55 or +35 pixels

### Adding New Theme Colors
1. Add CSS variable in `index.css` (both :root and [data-theme="light"])
2. Use `var(--variable-name)` in component styles

## Testing Checklist

Before releasing:
- [ ] Test light mode export (white background)
- [ ] Test dark mode export (dark background)
- [ ] Test 2-wire mode (GND hidden)
- [ ] Test 3-wire mode (GND shown)
- [ ] Test pin conflict detection
- [ ] Test save/load design
- [ ] Test CSV export
- [ ] Test all device types: 0-10V, 4-20mA, relay, latching, RS485, etc.
- [ ] Test on mobile (PWA)

## Contact / Context

This is a tool for Aquamonix Neo device wiring configuration.
- GitHub: https://github.com/PartT1m3Cod3r/NEO_Wirering_Tool
- Built by: Robert Steere
- Last updated: 2026-01-28
