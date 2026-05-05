# Neo Wiring Tool - Agent Reference

## Project Overview

A React-based PWA (Progressive Web App) for visualizing and designing wiring configurations and network topologies for Aquamonix Neo IoT devices. The app provides three primary workflows:

1. **Landing Page** (`/`) — Entry point with navigation cards to all tools.
2. **Wiring Lookup** (`/wiring`) — Quick reference tool for pin configurations based on plug type and device selection. Shows interactive pin tables, color legends, and ReactFlow wiring diagrams for a single device.
3. **System Wiring** (`/system`) — Interactive diagram designer for complete system layouts. Users can add multiple devices, configure channels/outputs, and export BOMs, wiring schedules, and PDF reports.
4. **Network Designer** (`/network`) — Topology designer for multi-NEO CoreLink networks. Users can place NEO devices and base stations, connect them with distance/LOS links, configure WiFi/LTE RSSI values, and receive signal-quality recommendations.

The visual design follows an **AutoCAD Electrical** aesthetic: dark theme by default (black backgrounds, cyan accents), monospace fonts (`Consolas`, `Monaco`), IEC-style schematic symbols, and wire number labels.

The current application version is **1.3.0** (declared in `index.html` meta tag).

A hardware reference manual (`NEO_Hardware_Manual.md`) is also present in the repository with full connector pinouts and installation instructions.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | ^19.2.0 | UI framework |
| React DOM | ^19.2.0 | DOM renderer |
| Vite | ^7.2.4 | Build tool & dev server |
| @vitejs/plugin-react-swc | ^4.2.2 | Fast JSX transform (SWC) |
| ReactFlow | ^11.11.4 | Interactive node-based diagrams |
| react-router-dom | ^7.13.0 | Client-side routing (`/`, `/wiring`, `/system`, `/network`) |
| html-to-image | ^1.11.13 | PNG/SVG export of diagrams |
| jspdf | ^4.1.0 | PDF report generation |
| jspdf-autotable | ^5.0.7 | PDF table rendering |
| vite-plugin-pwa | ^1.2.0 | PWA manifest & service worker |

**Unused dependencies:**
- `html2canvas` (^1.4.1) is listed in `package.json` but is **not imported anywhere** in the source code; all image exports use `html-to-image`.
- `elkjs` (^0.11.1) is listed in `package.json` but is **not imported anywhere** in the source code. The system diagram uses a deterministic manual layout instead of ELK.js.

## Build Commands

Defined in `package.json`:

```bash
npm run dev        # Start Vite dev server (host: true, accessible on network)
npm run build      # Production build -> outputs to `dist/`
npm run preview    # Preview the production build locally
npm run lint       # Run ESLint across the project
npm run deploy     # Deploy `dist/` to GitHub Pages via gh-pages
```

## Project Structure

```
src/
├── components/
│   ├── edges/
│   │   └── ColoredWireEdge.jsx     # Custom ReactFlow edge with orthogonal routing, wire labels, wire numbers
│   ├── nodes/
│   │   ├── BatteryNode.jsx         # Power supply node (DC symbol, source handles)
│   │   ├── LatchingRelayNode.jsx   # Latching relay with SET/RESET coils
│   │   ├── NeoDeviceNode.jsx       # Neo M12 connector (terminal block table, 8 pins, dynamic handles)
│   │   ├── RelayNode.jsx           # Standard relay (IEC coil symbol)
│   │   └── SensorNode.jsx          # Generic sensor/comm device (IEC symbol per type)
│   ├── network/
│   │   └── RssiRecommendations.jsx # Network Designer: RSSI-based recommendation panel
│   ├── nodes/
│   │   ├── BaseStationNode.jsx     # Base station node (antenna symbol, RSSI display)
│   │   ├── BatteryNode.jsx         # Power supply node (DC symbol, source handles)
│   │   ├── LatchingRelayNode.jsx   # Latching relay with SET/RESET coils
│   │   ├── NeoDeviceNode.jsx       # Neo M12 connector (terminal block table, 8 pins, dynamic handles)
│   │   ├── NeoNetworkNode.jsx      # NEO device node for Network Designer (CoreLink symbol)
│   │   ├── RelayNode.jsx           # Standard relay (IEC coil symbol)
│   │   └── SensorNode.jsx          # Generic sensor/comm device (IEC symbol per type)
│   ├── system/
│   │   ├── DeviceConfigPanel.jsx   # Right sidebar: edit name, channel, output, wire mode, wire numbers
│   │   ├── DevicePalette.jsx       # Left sidebar: click-to-add device categories
│   │   └── PinUsageSummary.jsx     # Right sidebar: pin conflict display, per-plug usage
│   ├── PlugDisplay.jsx             # Wiring Lookup pin table (color-coded rows, pulse counter dual-plug)
│   ├── ReactFlowDiagram.jsx        # Wiring Lookup interactive diagram (single-device view)
│   └── WiringDiagram.jsx           # Legacy static wiring diagram (HTML/CSS based)
├── context/
│   └── ThemeContext.jsx            # Dark/light theme state, persisted to localStorage (`neo-wiring-theme`)
├── data/
│   └── plugData.js                 # Pin configurations, colors, device info for all plug types
├── pages/
│   ├── LandingPage.jsx             # Landing page with tool cards
│   ├── LandingPage.css             # Landing page styles
│   ├── NetworkDesigner.jsx         # Network topology designer (CoreLink, RSSI, LOS)
│   ├── NetworkDesigner.css         # AutoCAD styles for network designer
│   ├── SystemWiring.jsx            # Main system designer page (ReactFlow canvas, export logic)
│   └── SystemWiring.css            # AutoCAD-style styles for system page
├── utils/
│   └── rssiLogic.js                # Pure helpers: WiFi/LTE RSSI thresholds & recommendations
├── App.jsx                         # Wiring Lookup page
├── App.css                         # Wiring Lookup styles + ReactFlow overrides
├── index.css                       # CSS variables for theming, global AutoCAD styles
└── main.jsx                        # Entry point: StrictMode, ThemeProvider, BrowserRouter, Navigation
```

## Routing

Configured in `main.jsx` via `react-router-dom`:

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Layout><LandingPage /></Layout>} />
    <Route path="/wiring" element={<Layout><App /></Layout>} />
    <Route path="/system" element={<Layout><SystemWiring /></Layout>} />
    <Route path="/network" element={<Layout><NetworkDesigner /></Layout>} />
  </Routes>
</BrowserRouter>
```

All routes share a common `Layout` with the `Navigation` component (brand, route links, theme toggle ☀️/🌙).

## Data Architecture

### Wiring Lookup (`App.jsx`)
- Local `useState` manages dropdown selections (`selectedPlug`, `selectedType`, `selectedOutput`, `selectedChannel`, `wireMode`).
- `plugData.js` provides static configuration for all plug types, pins, and connection instructions.
- `getUsedPins()` filters which pins are active for the current selection.

### System Wiring (`SystemWiring.jsx`)
- **`connectedDevices`** is the **single source of truth** (array of device objects).
- **Nodes and edges** are derived from `connectedDevices` via `useEffect`. This allows save/load as simple JSON.
- Pure helper functions (`getUsedPins`, `getDeviceTerminals`, `createEdgesForDevice`, `findNextAvailable`, `generateDefaultWireNumber`) are defined **outside the component** to avoid React hook ordering issues (TDZ errors in production builds).

### Network Designer (`NetworkDesigner.jsx`)
- **`networkDevices`** and **`networkLinks`** are the **dual source of truth**.
- **Nodes** are derived from `networkDevices` + `nodePositionsRef` (preserves dragged positions).
- **Edges** are derived from `networkLinks` and rendered as `coloredWire` type edges (reusing `ColoredWireEdge` from System Wiring).
- Users draw connections via React Flow's built-in `onConnect` handler; new links default to `distance: 100` and `los: true`.
- Pure helper functions (`getDistanceColor`, `getDefaultPosition`) are defined **outside the component**.

#### Network Device Object Schema
```javascript
{
  id: 'network-node-1234567890',
  type: 'neo',              // 'neo' or 'baseStation'
  label: 'NEO-01',
  neoId: '',                // physical device ID (neo only)
  wifiRssi: -50,            // dBm (baseStation only)
  lteRssi: -90,             // dBm (baseStation only)
}
```

#### Network Link Object Schema
```javascript
{
  id: 'network-link-1234567890',
  source: 'network-node-xxx',
  target: 'network-node-yyy',
  distance: 100,            // meters
  los: true,                // line of sight
}
```

#### RSSI Thresholds
| WiFi RSSI | Level | Color |
|---|---|---|
| ≥ -50 dBm | Excellent | `#00ff00` |
| -50 to -60 | Good | `#ccff00` |
| -60 to -70 | Fair | `#ffff00` |
| -70 to -80 | Poor | `#ff8800` |
| < -80 | Very Poor | `#ff4444` |

| LTE RSSI | Level | Color |
|---|---|---|
| ≥ -80 dBm | Excellent | `#00ff00` |
| -80 to -90 | Good | `#ccff00` |
| -90 to -100 | Fair | `#ffff00` |
| -100 to -110 | Poor | `#ff8800` |
| < -110 | Very Poor | `#ff4444` |

#### Device Object Schema
```javascript
{
  id: 'device-1234567890',
  type: '0-10v',           // '0-10v', '4-20ma', 'relay', 'latching', 'rs485', etc.
  plugType: 'inputs',      // 'inputs', 'outputs', 'communications'
  label: 'My Sensor',
  channel: 1,              // for inputs
  output: 2,               // for outputs
  input: 1,                // for pulse counter
  wireMode: '3-wire',      // '2-wire' or '3-wire' (inputs only)
  powerSource: 'Solar',    // or 'PSU'
  wireNumbers: { signal: '201', power: '103', gnd: '102' }  // optional custom wire numbers
  handleSide: 'bottom',     // 'top', 'bottom', 'left', 'right' — default side for all device handles
  terminalSides: {}         // per-terminal overrides, e.g. { 'a1': 'top', 'a2': 'bottom' }
}
```

#### Neo System Node IDs
- `neo-inputs` — Inputs plug (left side of canvas, y=50)
- `neo-comms` — Communications plug (y=450)
- `neo-outputs` — Outputs plug (y=850)

### Pin Maps

**Inputs (Analog Channels)**
| Channel | Pin | Color |
|---|---|---|
| 1 | 8 | Red |
| 2 | 7 | Blue |
| 3 | 6 | Pink |
| 4 | 5 | Grey |

**Outputs**
| Output | Pin | Color | Terminal |
|---|---|---|---|
| 1 | 5 | Grey | A1 |
| 2 | 6 | Pink | A2 |
| 3 | 7 | Blue | A3 |
| 4 | 8 | Red | A4 |

**Communications**
| Type | Pins | Colors |
|---|---|---|
| RS485 | 3, 4 | Green (B), Yellow (A) |
| Wiegand | 6, 5 | Pink (D0), Grey (D1) |
| SDI-12 | 7, 8 | Blue (Data), Red (GND) |
| Pulse | 6 (or 5), 3, 4 | Pink/Grey (Signal), Green (Power), Yellow (GND) |

**Color Map**
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

## Node Types

Registered in `SystemWiring.jsx`:

| Type | Component | Used For |
|---|---|---|
| `neoDevice` | `NeoDeviceNode` | Neo M12 connectors (system nodes) |
| `sensor` | `SensorNode` | Input sensors, comm devices, power input |
| `relay` | `RelayNode` | Standard relays, transistor outputs |
| `latchingRelay` | `LatchingRelayNode` | Latching relays |
| `battery` | `BatteryNode` | Power supply / battery nodes |

Registered in `NetworkDesigner.jsx`:

| Type | Component | Used For |
|---|---|---|
| `neoNetwork` | `NeoNetworkNode` | NEO devices in CoreLink topology |
| `baseStation` | `BaseStationNode` | Base stations / gateways with RSSI display |

## Edge Types

- **`coloredWire`** (`ColoredWireEdge.jsx`): Custom ReactFlow edge featuring:
  - Orthogonal path routing (left-to-right, right-to-left, same-side loops)
  - Cable-colored stroke with background-colored outline for visibility
  - AutoCAD-style labels with optional wire numbers (black background, yellow text)
  - ArrowClosed markers colored to match the cable
  - Theme-aware styling (white wires get black borders in light mode)
  - Small vertical offset per wire color so parallel cables do not perfectly overlap

- **`coloredWire`** (`ColoredWireEdge.jsx`): Reused in Network Designer for network topology links. Features:
  - Orthogonal path routing (same as System Wiring)
  - Distance-based stroke colors (green → yellow → orange → red)
  - Background-colored outline for visibility
  - AutoCAD-style labels with distance and optional "NO LOS" warning
  - ArrowClosed markers colored to match the link quality

## Features Implemented

### Theme Support
- CSS variables (`--bg-primary`, `--text-primary`, `--accent-color`, etc.) defined in `index.css`
- `data-theme="light"` attribute on `<body>` toggled via `ThemeContext`
- Persisted in `localStorage` key `neo-wiring-theme`
- Default: dark (AutoCAD black background)

### 2-Wire / 3-Wire Mode
- Applies to input sensors only.
- **2-wire**: Signal + Power only (no GND/Pin 4).
- **3-wire**: Signal + Power + GND (standard).
- In System Wiring, `wireMode` is stored on the device object and affects terminal generation, edge creation, and pin conflict calculation.

### Image Export (System Wiring)
- Uses `html-to-image` `toSvg()` to capture the ReactFlow canvas.
- Hides UI overlays (buttons, controls, minimap, attribution) during capture.
- Converts SVG to PNG via canvas at 2x scale.
- Background color adapts to current theme.

### PDF Export (System Wiring)
- Uses `jspdf` + `jspdf-autotable`.
- Landscape A4 orientation for BOM table and Connection Schedule.
- Portrait A4 orientation for the Wiring Diagram image.
- Multi-page report: BOM table → Connection Schedule → Wiring Diagram image.

### CSV Export (System Wiring)
- Generates `neo_wiring_schedule.csv` with device name, type, plug, and connection details.

### Save / Load Design
- JSON export/import of the `connectedDevices` array.
- Legacy devices without `wireMode` get a default assignment on load.

### Auto-Assign Next Available Channel/Output
- `findNextAvailable()` scans `connectedDevices` to suggest an unused channel/output.
- Bus types (`rs485`, `sdi12`, `wiegand`) skip conflict checking by design (multi-drop).

### Pin Conflict Detection
- Recalculates whenever `connectedDevices` changes.
- Signal pins are tracked per `plugType + pin`.
- Power pins (3, 4) are tracked per plug but treated as shared bus.
- Bus types allow multiple devices on the same signal pins without conflict.

### Device Name Editing
- All node types display custom labels.
- `DeviceConfigPanel` provides a name input field.

### Wire Number Editing
- Each connection edge has an editable wire number in the config panel.
- Defaults are generated per edge type via `generateDefaultWireNumber()`:
  - `vcc` → `101`, `gnd` → `102`, `power` → `103`, `signal` → `200 + channel`
  - `a1` → `300 + output`, `a2` → `400 + output`
  - `a` → `501`, `b` → `502`, `d0` → `601`, `d1` → `602`, `data` → `701`
- Stored in `device.wireNumbers` object.

### Network Designer
- Interactive ReactFlow canvas for designing CoreLink network topologies.
- **Node types**: `neoNetwork` (NEO device) and `baseStation` (gateway with RSSI inputs).
- **Edge type**: `coloredWire` (reusing `ColoredWireEdge`) with distance (meters) and LOS (line of sight) properties.
- Users draw connections between nodes; new links default to `distance: 100` and `los: true`.
- Config panel allows editing device labels, NEO IDs, WiFi/LTE RSSI values, link distance, and LOS toggle.
- **RSSI Recommendations**: `RssiRecommendations` panel evaluates all base station RSSI values and network links, generating color-coded success/warning/error recommendations.
- Pure helper `getNetworkRecommendations()` in `src/utils/rssiLogic.js` provides threshold-based analysis.

### Image Export (Network Designer)
- Uses `html-to-image` `toSvg()` to capture the ReactFlow canvas.
- Hides UI overlays during capture.
- Converts SVG to PNG via canvas at 2x scale.
- Download filename: `neo_network_design.png`.

### Save / Load Design (Network Designer)
- JSON export/import of `networkDevices` + `networkLinks` + `nodePositions`.
- File format: `{ devices: [], links: [], positions: {} }`.

## Code Style Guidelines

- **ES Modules** throughout (`"type": "module"` in `package.json`).
- **JSX files** use `.jsx` extension.
- **Pure helper functions** that derive nodes/edges from device state are defined **outside React components** to avoid hook ordering issues (e.g. `getUsedPins`, `getDeviceTerminals`, `createEdgesForDevice`).
- **CSS variables** are used for all theme-dependent colors; never hardcode theme colors in components.
- **Monospace fonts** (`Consolas`, `Monaco`) for technical/AutoCAD-style text.
- **Uppercase text transforms** for headers, buttons, and panel titles to match AutoCAD UI conventions.
- **All comments and documentation are written in English.**

## ESLint Configuration

Flat config (`eslint.config.js`):
- `@eslint/js` recommended rules
- `eslint-plugin-react-hooks` recommended
- `eslint-plugin-react-refresh` Vite config
- Browser globals via `globals`
- Custom rule: `'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]` (allows PascalCase for type-like vars)
- `dist/` is ignored via `globalIgnores`.

## Testing

There is **no automated test suite** currently in the project. No Jest, Vitest, Cypress, or Playwright configurations are present. Testing is entirely manual.

### Manual Testing Checklist
- [ ] Test light mode export (white background)
- [ ] Test dark mode export (dark background)
- [ ] Test 2-wire mode (GND hidden)
- [ ] Test 3-wire mode (GND shown)
- [ ] Test pin conflict detection
- [ ] Test save/load design (JSON) - System Wiring
- [ ] Test CSV export - System Wiring
- [ ] Test PDF export - System Wiring
- [ ] Test all device types: 0-10V, 4-20mA, voltage-sensing, relay, latching, transistor, RS485, Wiegand, SDI-12, pulse counter, power-input
- [ ] Test landing page navigation cards
- [ ] Test Network Designer: add NEO devices and base stations
- [ ] Test Network Designer: draw connections between nodes
- [ ] Test Network Designer: edit distance and LOS on links
- [ ] Test Network Designer: edit WiFi/LTE RSSI and verify recommendations
- [ ] Test Network Designer: save/load JSON
- [ ] Test Network Designer: export PNG and CSV
- [ ] Test on mobile (PWA installability)

## Deployment

### Netlify (Configured)
- `netlify.toml` is present with SPA redirect rules (`/*` → `/index.html`).
- Build command: `npm run build`
- Publish directory: `dist`
- JavaScript/CSS content-type headers are explicitly set for `.js`, `.mjs`, and `.css` files.

### GitHub Pages
- Uncomment `base: '/NEO_Wirering_Tool/'` in `vite.config.js`.
- Run `npm run build` then `npm run deploy`.

### Local Testing
```bash
npm run dev        # Vite dev server with HMR
npm run build      # Build for production
npx serve -s dist  # Serve the static build
```

## Adding a New Device Type

### System Wiring
1. Add the device template to `availableDevices` in `SystemWiring.jsx`.
2. Add pin mapping in `getUsedPins()` in `SystemWiring.jsx`.
3. Add terminal config in `getDeviceTerminals()` in `SystemWiring.jsx`.
4. Add edge creation logic in `createEdgesForDevice()` in `SystemWiring.jsx`.
5. If needed, add a new node component and register it in the `nodeTypes` object.
6. Update `plugData.js` if the device should also appear in Wiring Lookup.

### Network Designer
1. Add the device template to the palette buttons in `NetworkDesigner.jsx`.
2. If a new visual node type is needed, create the component in `src/components/nodes/` and register it in the `nodeTypes` object.
3. Update `getDefaultPosition()` if the new type needs special initial positioning.
4. Update the config panel logic to handle any new data fields.

## Security Considerations

- This is a **pure client-side application** with no backend, authentication, or API keys.
- No sensitive files are exposed in the repository.
- PWA manifest and service worker are generated by `vite-plugin-pwa` at build time.

## Contact / Context

- **Purpose:** Tool for Aquamonix Neo device wiring configuration and CoreLink network design.
- **Built by:** Robert Steere
- **GitHub:** https://github.com/PartT1m3Cod3r/NEO_Wirering_Tool
