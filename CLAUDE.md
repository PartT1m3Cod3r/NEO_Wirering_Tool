# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> For full technical detail — pin tables, data models, device schemas, and component API — see AGENTS.md.

## Commands

```bash
npm run dev        # Start Vite dev server (http://localhost:5173, HMR enabled)
npm run build      # Production build → dist/
npm run lint       # ESLint across all JS/JSX files
npx eslint . --fix # Auto-fix lint issues
npm run preview    # Preview production build locally
npm run deploy     # Deploy dist/ to GitHub Pages
```

No automated test suite — testing is manual.

## Architecture

**React 19 + Vite PWA** for Aquamonix Neo IoT wiring and network design. Four routes, all wrapped by a `Layout` component that renders `Navigation`:

| Route | Page | Purpose |
|---|---|---|
| `/` | LandingPage | Tool selection cards |
| `/wiring` | App | Single-device pin reference |
| `/system` | SystemWiring | Multi-device wiring canvas |
| `/network` | NetworkDesigner | CoreLink network topology |

### State pattern

No Redux. Both canvas tools (`SystemWiring`, `NetworkDesigner`) keep a single source-of-truth array (`connectedDevices` / `networkDevices + networkLinks`). All ReactFlow nodes and edges are **derived via `useEffect`** from these arrays. Save/load is simply `JSON.stringify` / `JSON.parse` of the arrays.

### ReactFlow usage

Both canvas tools use ReactFlow 11.11.4. Key custom types:

- **System Wiring**: node types `neoDevice`, `sensor`, `relay`, `latchingRelay`, `battery`
- **Network Designer**: node types `neoNetwork`, `baseStation`
- **Shared**: `coloredWire` edge type (`ColoredWireEdge.jsx`) — orthogonal routing, color-coded strokes, wire number labels, theme-aware

### Helper functions (module-level, outside components)

All heavy logic lives as pure functions at module scope to avoid hook-ordering issues:

- `getUsedPins(device)` — maps device → used signal/power/solar pins
- `getDeviceTerminals(device)` → array of terminal objects for rendering
- `createEdgesForDevice(device, connectedDevices)` → edges for that device
- `findNextAvailable(template, connectedDevices)` → suggest next free channel/output
- `generateDefaultWireNumber(type)` → canonical wire number for a terminal type
- `getWifiStatus(rssi)` / `getLteStatus(rssi)` (in `src/utils/rssiLogic.js`) → signal quality objects
- `getNetworkRecommendations(nodes, edges)` → array of advisory strings

### Theme system

CSS variables in `index.css` (`--bg-primary`, `--accent-color`, `--wire-red`, etc.). `body[data-theme="light"]` selector overrides. `ThemeContext` (via `ThemeContextValue.jsx`) exposes `toggleTheme`. Persisted to `localStorage` key `neo-wiring-theme` (default: dark). Never hardcode colors in components — always use `var(--variable-name)`.

### Pin conflict detection

`SystemWiring.jsx` tracks signal pins per `plugType + pin` and power pins per plug. Bus types (RS485, SDI-12, Wiegand) are explicitly allowed to share signal pins; others flag a conflict.

### Exports

| Format | Library |
|---|---|
| PDF | jsPDF + jspdf-autotable (multi-page: BOM, Connection Schedule, Wiring Diagram) |
| CSV | Plain text wiring schedule |
| PNG | html-to-image `toSvg()` + canvas upscale 2× |

## Key design decisions

- **No TypeScript** — vanilla JS with JSDoc hints throughout.
- **Manual layout** — deterministic fixed-coordinate positioning, not ELK.js (which is listed in `package.json` but unused and can be removed along with `html2canvas`).
- **Wire colors follow IEC 60617** — `colorMap` in `src/data/plugData.js` is the single source of truth for all wire colors.
- **Deployment is Netlify** — `netlify.toml` handles build + SPA redirects. GitHub Pages alternative requires uncommenting `base` in `vite.config.js`.

## Adding a new System Wiring device type

1. Add template to `availableDevices` in `SystemWiring.jsx`
2. Add pin mapping in `getUsedPins()`
3. Add terminal config in `getDeviceTerminals()`
4. Add edge logic in `createEdgesForDevice()`
5. Register new node component in the `nodeTypes` object
6. Update `src/data/plugData.js` if it should appear in Wiring Lookup
