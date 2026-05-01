import { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NeoDeviceNode } from '../components/nodes/NeoDeviceNode';
import { SensorNode } from '../components/nodes/SensorNode';
import { RelayNode } from '../components/nodes/RelayNode';
import { LatchingRelayNode } from '../components/nodes/LatchingRelayNode';
import { BatteryNode } from '../components/nodes/BatteryNode';
import { ColoredWireEdge } from '../components/edges/ColoredWireEdge';
import { DevicePalette } from '../components/system/DevicePalette';
import { DeviceConfigPanel } from '../components/system/DeviceConfigPanel';
import { PinUsageSummary } from '../components/system/PinUsageSummary';
import { colorMap } from '../data/plugData';
import './SystemWiring.css';

// Child component to fit view once on mount (must be inside <ReactFlow>)
const FitViewOnMount = () => {
  const { fitView } = useReactFlow();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    // Small delay ensures nodes have rendered before fitting
    const timer = setTimeout(() => {
      fitView({ padding: 0.15 });
    }, 100);
    return () => clearTimeout(timer);
  }, [fitView]);

  return null;
};

const nodeTypes = {
  neoDevice: NeoDeviceNode,
  sensor: SensorNode,
  relay: RelayNode,
  latchingRelay: LatchingRelayNode,
  battery: BatteryNode,
};

const edgeTypes = {
  coloredWire: ColoredWireEdge,
};

// Available device types that can be added
const availableDevices = [
  // Inputs
  {
    category: 'Inputs', items: [
      { type: '0-10v', label: '0-10V Sensor', plugType: 'inputs', channels: [1, 2, 3, 4] },
      { type: '4-20ma', label: '4-20mA Sensor', plugType: 'inputs', channels: [1, 2, 3, 4] },
      { type: 'voltage-sensing', label: 'Input Voltage Sensing', plugType: 'inputs', channels: [1, 2, 3, 4] },
      { type: 'power-input', label: 'Power Input', plugType: 'inputs', channels: [1] },
    ]
  },
  // Communications
  {
    category: 'Communications', items: [
      { type: 'rs485', label: 'RS485 Device', plugType: 'communications' },
      { type: 'wiegand', label: 'Wiegand Reader', plugType: 'communications' },
      { type: 'sdi12', label: 'SDI-12 Sensor', plugType: 'communications' },
      { type: 'pulse', label: 'Pulse Counter', plugType: 'communications', inputs: [1, 2] },
      { type: 'power-input', label: 'Power Input', plugType: 'communications', channels: [1] },
    ]
  },
  // Outputs
  {
    category: 'Outputs', items: [
      { type: 'relay', label: 'Relay', plugType: 'outputs', outputs: [1, 2, 3, 4] },
      { type: 'latching', label: 'Latching Relay', plugType: 'outputs', outputs: [1, 3] },
      { type: 'transistor', label: 'Transistor Output', plugType: 'outputs', outputs: [1, 2, 3, 4] },
      { type: 'power-input', label: 'Power Input', plugType: 'outputs', channels: [1] },
    ]
  },
];

// Find next available channel/output/input for a device type
const findNextAvailable = (deviceTemplate, connectedDevices) => {
  const usedChannels = connectedDevices
    .filter(d => d.plugType === deviceTemplate.plugType && d.type === deviceTemplate.type)
    .map(d => d.channel || d.output || d.input);

  const availableList =
    deviceTemplate.channels ||
    deviceTemplate.outputs ||
    deviceTemplate.inputs ||
    [];

  // Find first available option
  for (const option of availableList) {
    if (!usedChannels.includes(option)) {
      return option;
    }
  }

  // If all taken, return the first one (will cause conflict warning)
  return availableList[0] || null;
};

// Get used pins for a device configuration
// Returns object with plugType and pins array
const getUsedPins = (device) => {
  const pins = {
    plugType: device.plugType,
    signalPins: [], // Pins that are unique per plug (data/signal)
    powerPins: [],  // Pins 3, 4 - shared sensor/actuator power bus
    solarPins: [1, 2], // Pins 1, 2 - Solar/Power supply (always used)
    all: [1, 2]     // Always include solar pins 1 (white) and 2 (brown)
  };

  if (device.plugType === 'inputs') {
    if (device.type === 'power-input') {
      // Power input only uses pins 1 and 2
      // Solar pins 1,2 already in all
    } else {
      // Map channel to pins (1=Red/Pin8, 2=Blue/Pin7, 3=Pink/Pin6, 4=Grey/Pin5)
      // Wire mode: '2-wire' (no GND), '3-wire' (with GND - default)
      const is2Wire = device.wireMode === '2-wire';
      const channelPins = {
        1: { signal: [8], power: is2Wire ? [3] : [3, 4] }, // Signal (Red/Pin8), Power (Green/Pin3), optional GND
        2: { signal: [7], power: is2Wire ? [3] : [3, 4] },
        3: { signal: [6], power: is2Wire ? [3] : [3, 4] },
        4: { signal: [5], power: is2Wire ? [3] : [3, 4] },
      };
      const channel = channelPins[device.channel];
      if (channel) {
        pins.signalPins.push(...channel.signal);
        pins.powerPins.push(...channel.power);
        pins.all.push(...channel.signal, ...channel.power); // Solar pins 1,2 already in all
      }
    }
  } else if (device.plugType === 'outputs') {
    if (device.type === 'power-input') {
      // Power input only uses pins 1 and 2
      // Solar pins 1,2 already in all
    } else if (device.type === 'latching') {
      // Latching uses 2 outputs
      if (device.output === 1) {
        pins.signalPins.push(5, 6); // Grey (A1), Pink (A2)
        pins.powerPins.push(4);     // GND (Yellow)
        pins.all.push(5, 6, 4);     // Solar pins 1,2 already in all
      } else if (device.output === 3) {
        pins.signalPins.push(7, 8); // Blue (A3), Red (A4)
        pins.powerPins.push(4);     // GND (Yellow)
        pins.all.push(7, 8, 4);     // Solar pins 1,2 already in all
      }
    } else {
      // Standard relay uses 1 output + GND
      const outputPins = {
        1: { signal: [5], power: [4] }, // Grey (A1), GND
        2: { signal: [6], power: [4] }, // Pink (A2), GND
        3: { signal: [7], power: [4] }, // Blue (A3), GND
        4: { signal: [8], power: [4] }, // Red (A4), GND
      };
      const output = outputPins[device.output];
      if (output) {
        pins.signalPins.push(...output.signal);
        pins.powerPins.push(...output.power);
        pins.all.push(...output.signal, ...output.power); // Solar pins 1,2 already in all
      }
    }
  } else if (device.plugType === 'communications') {
    if (device.type === 'power-input') {
      // Power input only uses pins 1 and 2
      // Solar pins 1,2 already in all
    } else if (device.type === 'rs485') {
      pins.signalPins.push(3, 4); // Green (B), Yellow (A) - these are signal, not power
      pins.all.push(3, 4);        // Solar pins 1,2 already in all
    } else if (device.type === 'wiegand') {
      pins.signalPins.push(6, 5); // Pink (D0), Grey (D1)
      pins.all.push(6, 5);        // Solar pins 1,2 already in all
    } else if (device.type === 'sdi12') {
      pins.signalPins.push(7, 8); // Blue (Data), Red (GND for SDI-12)
      pins.all.push(7, 8);        // Solar pins 1,2 already in all
    } else if (device.type === 'pulse') {
      // Pulse counter uses Digital Input 1 (Pin 6) or Digital Input 2 (Pin 5) for signal
      // Power from Pin 3, GND from Pin 4 (shared with Inputs power bus)
      const inputNum = device.input || 1;
      pins.signalPins.push(inputNum === 1 ? 6 : 5);  // DI1 = Pin 6 (Pink), DI2 = Pin 5 (Grey)
      pins.powerPins.push(3, 4); // Power (Green), GND (Yellow) - shared
      pins.all.push(3, 4, inputNum === 1 ? 6 : 5); // Solar pins 1,2 already in all
    }
  }

  return pins;
};

// Get device terminals for node display (pure function - moved outside component)
const getDeviceTerminals = (device) => {
  const terminals = [];

  if (device.plugType === 'inputs') {
    if (device.type === 'power-input') {
      terminals.push(
        { id: 'vcc+', name: 'VCC+', color: colorMap.white },
        { id: 'gnd', name: 'GND', color: colorMap.brown }
      );
    } else {
      const channelColors = { 1: 'red', 2: 'blue', 3: 'pink', 4: 'grey' };
      const is2Wire = device.wireMode === '2-wire';
      // Order: Power+ (top), GND (middle), Signal (bottom)
      // This matches pin order 3, 4, 5-8 so wires run straight with minimal crossing
      terminals.push(
        { id: 'power+', name: 'Power+', color: colorMap.green }
      );
      if (!is2Wire) {
        terminals.push({ id: 'gnd', name: 'GND', color: colorMap.yellow });
      }
      terminals.push(
        { id: 'signal', name: 'Signal', color: colorMap[channelColors[device.channel]] }
      );
    }
  } else if (device.plugType === 'outputs') {
    if (device.type === 'power-input') {
      terminals.push(
        { id: 'vcc+', name: 'VCC+', color: colorMap.white },
        { id: 'gnd', name: 'GND', color: colorMap.brown }
      );
    } else if (device.type === 'latching') {
      const outputColors = device.output === 1 ? ['grey', 'pink'] : ['blue', 'red'];
      // A2 on top, A1 on bottom (or A4 on top, A3 on bottom for output 3)
      terminals.push(
        { id: 'a2', name: 'A2', color: colorMap[outputColors[1]] },
        { id: 'a1', name: 'A1', color: colorMap[outputColors[0]] }
      );
    } else {
      const outputColors = { 1: 'grey', 2: 'pink', 3: 'blue', 4: 'red' };
      // A2 (GND) on top, A1 (output) on bottom
      terminals.push(
        { id: 'a2', name: 'A2', color: colorMap.yellow },
        { id: 'a1', name: 'A1', color: colorMap[outputColors[device.output]] }
      );
    }
  } else if (device.plugType === 'communications') {
    if (device.type === 'power-input') {
      terminals.push(
        { id: 'vcc+', name: 'VCC+', color: colorMap.white },
        { id: 'gnd', name: 'GND', color: colorMap.brown }
      );
    } else if (device.type === 'rs485') {
      terminals.push(
        { id: 'b', name: 'B', color: colorMap.green },
        { id: 'a', name: 'A', color: colorMap.yellow }
      );
    } else if (device.type === 'wiegand') {
      // Order: D1 (top), D0 (bottom) to match pin order 5, 6
      terminals.push(
        { id: 'd1', name: 'D1', color: colorMap.grey },
        { id: 'd0', name: 'D0', color: colorMap.pink }
      );
    } else if (device.type === 'sdi12') {
      terminals.push(
        { id: 'data', name: 'Data', color: colorMap.blue },
        { id: 'gnd', name: 'GND', color: colorMap.red }
      );
    } else if (device.type === 'pulse') {
      // Order: Power+ (top), GND (middle), Signal (bottom) to match pin order 3, 4, 6
      terminals.push(
        { id: 'power', name: 'Power+', color: colorMap.green },
        { id: 'gnd', name: 'GND', color: colorMap.yellow },
        { id: 'signal', name: 'Signal', color: colorMap.pink }
      );
    }
  }

  return terminals;
};

/* ==================================================================== */
/*  Edge creation helpers                                               */
/* ==================================================================== */

const generateDefaultWireNumber = (edgeType, device) => {
  const baseNum = device.channel || device.output || device.input || 1;
  const wireNumberMap = {
    vcc: '101',
    gnd: '102',
    power: '103',
    signal: `${200 + baseNum}`,
    a1: `${300 + (device.output || 1)}`,
    a2: `${400 + (device.output || 1)}`,
    a: '501',
    b: '502',
    d0: '601',
    d1: '602',
    data: '701',
  };
  return wireNumberMap[edgeType] || '100';
};

const createEdgesForDevice = (device) => {
  const edges = [];
  const edgeId = `e-${device.id}`;
  const wireNumbers = device.wireNumbers || {};

  if (device.plugType === 'inputs') {
    if (device.type === 'power-input') {
      edges.push({
        id: `${edgeId}-vcc-vcc+`,
        source: device.id,
        target: 'neo-inputs',
        sourceHandle: 'vcc+',
        targetHandle: 'vcc',
        type: 'coloredWire',
        data: {
          label: 'VCC+ (Pin 1)',
          color: colorMap.white,
          wireNumber: wireNumbers['vcc'] || generateDefaultWireNumber('vcc', device),
        },
      });
      edges.push({
        id: `${edgeId}-gnd-gnd`,
        source: device.id,
        target: 'neo-inputs',
        sourceHandle: 'gnd',
        targetHandle: 'gnd',
        type: 'coloredWire',
        data: {
          label: 'GND (Pin 2)',
          color: colorMap.brown,
          wireNumber: wireNumbers['gnd'] || generateDefaultWireNumber('gnd', device),
        },
      });
    } else {
      const channelColors = { 1: 'red', 2: 'blue', 3: 'pink', 4: 'grey' };
      const pinMap = { 1: 'pin-8', 2: 'pin-7', 3: 'pin-6', 4: 'pin-5' };
      const channel = device.channel;
      const color = channelColors[channel] ? colorMap[channelColors[channel]] : '#999';
      const sourceHandle = pinMap[channel];

      if (sourceHandle) {
        edges.push({
          id: `${edgeId}-signal-${sourceHandle}`,
          source: 'neo-inputs',
          target: device.id,
          sourceHandle,
          targetHandle: 'signal',
          type: 'coloredWire',
          data: {
            label: 'Signal',
            color,
            wireNumber: wireNumbers['signal'] || generateDefaultWireNumber('signal', device),
          },
        });
      }

      edges.push({
        id: `${edgeId}-power-power`,
        source: 'neo-inputs',
        target: device.id,
        sourceHandle: 'power',
        targetHandle: 'power+',
        type: 'coloredWire',
        data: {
          label: 'Power',
          color: colorMap.green,
          wireNumber: wireNumbers['power'] || generateDefaultWireNumber('power', device),
        },
      });

      if (device.wireMode !== '2-wire') {
        edges.push({
          id: `${edgeId}-gnd-gnd`,
          source: 'neo-inputs',
          target: device.id,
          sourceHandle: 'gnd',
          targetHandle: 'gnd',
          type: 'coloredWire',
          data: {
            label: 'GND',
            color: colorMap.yellow,
            wireNumber: wireNumbers['gnd'] || generateDefaultWireNumber('gnd', device),
          },
        });
      }
    }
  } else if (device.plugType === 'outputs') {
    if (device.type === 'power-input') {
      edges.push({
        id: `${edgeId}-vcc-vcc+`,
        source: device.id,
        target: 'neo-outputs',
        sourceHandle: 'vcc+',
        targetHandle: 'vcc',
        type: 'coloredWire',
        data: {
          label: 'VCC+ (Pin 1)',
          color: colorMap.white,
          wireNumber: wireNumbers['vcc'] || generateDefaultWireNumber('vcc', device),
        },
      });
      edges.push({
        id: `${edgeId}-gnd-gnd`,
        source: device.id,
        target: 'neo-outputs',
        sourceHandle: 'gnd',
        targetHandle: 'gnd',
        type: 'coloredWire',
        data: {
          label: 'GND (Pin 2)',
          color: colorMap.brown,
          wireNumber: wireNumbers['gnd'] || generateDefaultWireNumber('gnd', device),
        },
      });
    } else if (device.type === 'latching') {
      const outputColors = device.output === 1 ? ['grey', 'pink'] : ['blue', 'red'];
      const pinMap = device.output === 1 ? ['pin-5', 'pin-6'] : ['pin-7', 'pin-8'];
      const outputLabels = device.output === 1 ? ['Out 1', 'Out 2'] : ['Out 3', 'Out 4'];

      edges.push({
        id: `${edgeId}-a1-${pinMap[0]}`,
        source: 'neo-outputs',
        target: device.id,
        sourceHandle: pinMap[0],
        targetHandle: 'a1',
        type: 'coloredWire',
        data: {
          label: outputLabels[0],
          color: colorMap[outputColors[0]],
          wireNumber: wireNumbers['a1'] || generateDefaultWireNumber('a1', device),
        },
      });
      edges.push({
        id: `${edgeId}-a2-${pinMap[1]}`,
        source: 'neo-outputs',
        target: device.id,
        sourceHandle: pinMap[1],
        targetHandle: 'a2',
        type: 'coloredWire',
        data: {
          label: outputLabels[1],
          color: colorMap[outputColors[1]],
          wireNumber: wireNumbers['a2'] || generateDefaultWireNumber('a2', device),
        },
      });
    } else {
      const outputColors = { 1: 'grey', 2: 'pink', 3: 'blue', 4: 'red' };
      const pinMap = { 1: 'pin-5', 2: 'pin-6', 3: 'pin-7', 4: 'pin-8' };
      const output = device.output;
      const sourceHandle = pinMap[output];
      const color = outputColors[output] ? colorMap[outputColors[output]] : '#999';

      if (sourceHandle) {
        edges.push({
          id: `${edgeId}-a1-${sourceHandle}`,
          source: 'neo-outputs',
          target: device.id,
          sourceHandle,
          targetHandle: 'a1',
          type: 'coloredWire',
          data: {
            label: `Out ${output}`,
            color,
            wireNumber: wireNumbers['a1'] || generateDefaultWireNumber('a1', device),
          },
        });
      }

      edges.push({
        id: `${edgeId}-a2-gnd`,
        source: 'neo-outputs',
        target: device.id,
        sourceHandle: 'gnd',
        targetHandle: 'a2',
        type: 'coloredWire',
        data: {
          label: 'GND',
          color: colorMap.yellow,
          wireNumber: wireNumbers['a2'] || generateDefaultWireNumber('a2', device),
        },
      });
    }
  } else if (device.plugType === 'communications') {
    if (device.type === 'power-input') {
      edges.push({
        id: `${edgeId}-vcc-vcc+`,
        source: device.id,
        target: 'neo-comms',
        sourceHandle: 'vcc+',
        targetHandle: 'vcc',
        type: 'coloredWire',
        data: {
          label: 'VCC+ (Pin 1)',
          color: colorMap.white,
          wireNumber: wireNumbers['vcc'] || generateDefaultWireNumber('vcc', device),
        },
      });
      edges.push({
        id: `${edgeId}-gnd-gnd`,
        source: device.id,
        target: 'neo-comms',
        sourceHandle: 'gnd',
        targetHandle: 'gnd',
        type: 'coloredWire',
        data: {
          label: 'GND (Pin 2)',
          color: colorMap.brown,
          wireNumber: wireNumbers['gnd'] || generateDefaultWireNumber('gnd', device),
        },
      });
    } else if (device.type === 'rs485') {
      edges.push({
        id: `${edgeId}-b-b`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: 'b',
        targetHandle: 'b',
        type: 'coloredWire',
        data: {
          label: 'B',
          color: colorMap.green,
          wireNumber: wireNumbers['b'] || generateDefaultWireNumber('b', device),
        },
      });
      edges.push({
        id: `${edgeId}-a-a`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: 'a',
        targetHandle: 'a',
        type: 'coloredWire',
        data: {
          label: 'A',
          color: colorMap.yellow,
          wireNumber: wireNumbers['a'] || generateDefaultWireNumber('a', device),
        },
      });
    } else if (device.type === 'wiegand') {
      edges.push({
        id: `${edgeId}-d0-d0`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: 'd0',
        targetHandle: 'd0',
        type: 'coloredWire',
        data: {
          label: 'D0',
          color: colorMap.pink,
          wireNumber: wireNumbers['d0'] || generateDefaultWireNumber('d0', device),
        },
      });
      edges.push({
        id: `${edgeId}-d1-d1`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: 'd1',
        targetHandle: 'd1',
        type: 'coloredWire',
        data: {
          label: 'D1',
          color: colorMap.grey,
          wireNumber: wireNumbers['d1'] || generateDefaultWireNumber('d1', device),
        },
      });
    } else if (device.type === 'sdi12') {
      edges.push({
        id: `${edgeId}-data-data`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: 'data',
        targetHandle: 'data',
        type: 'coloredWire',
        data: {
          label: 'Data',
          color: colorMap.blue,
          wireNumber: wireNumbers['data'] || generateDefaultWireNumber('data', device),
        },
      });
      edges.push({
        id: `${edgeId}-gnd-gnd`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: 'gnd',
        targetHandle: 'gnd',
        type: 'coloredWire',
        data: {
          label: 'GND',
          color: colorMap.red,
          wireNumber: wireNumbers['gnd'] || generateDefaultWireNumber('gnd', device),
        },
      });
    } else if (device.type === 'pulse') {
      edges.push({
        id: `${edgeId}-signal-${device.input === 2 ? 'pin-5' : 'pin-6'}`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: device.input === 2 ? 'pin-5' : 'pin-6',
        targetHandle: 'signal',
        type: 'coloredWire',
        data: {
          label: 'Signal',
          color: device.input === 2 ? colorMap.grey : colorMap.pink,
          wireNumber: wireNumbers['signal'] || generateDefaultWireNumber('signal', device),
        },
      });
      edges.push({
        id: `${edgeId}-power-power`,
        source: 'neo-inputs',
        target: device.id,
        sourceHandle: 'power',
        targetHandle: 'power',
        type: 'coloredWire',
        data: {
          label: 'Power',
          color: colorMap.green,
          wireNumber: wireNumbers['power'] || generateDefaultWireNumber('power', device),
        },
      });
      edges.push({
        id: `${edgeId}-gnd-gnd`,
        source: 'neo-inputs',
        target: device.id,
        sourceHandle: 'gnd',
        targetHandle: 'gnd',
        type: 'coloredWire',
        data: {
          label: 'GND',
          color: colorMap.yellow,
          wireNumber: wireNumbers['gnd'] || generateDefaultWireNumber('gnd', device),
        },
      });
    }
  }

  return edges;
};

/* ==================================================================== */
/*  Deterministic layout (replaces ELK)                                 */
/* ==================================================================== */

const SYSTEM_NODE_WIDTH = 380;
const DEVICE_X = 500;
const DEVICE_Y_SPACING = 180;

const getSystemNodePosition = (id) => {
  switch (id) {
    case 'neo-inputs': return { x: 50, y: 50 };
    case 'neo-comms': return { x: 50, y: 540 };
    case 'neo-outputs': return { x: 50, y: 1030 };
    default: return { x: 50, y: 50 };
  }
};

const getSystemNodeLabel = (id) => {
  switch (id) {
    case 'neo-inputs': return 'Neo Device (Inputs)';
    case 'neo-comms': return 'Neo Device (Coms)';
    case 'neo-outputs': return 'Neo Device (Outputs)';
    default: return 'Neo Device';
  }
};

const getSystemNodePlugType = (id) => {
  switch (id) {
    case 'neo-inputs': return 'inputs';
    case 'neo-comms': return 'communications';
    case 'neo-outputs': return 'outputs';
    default: return 'inputs';
  }
};

export const SystemWiring = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [pinConflicts, setPinConflicts] = useState([]);
  const reactFlowWrapper = useRef(null);
  const nodePositionsRef = useRef(new Map());

  // Build/update nodes and edges whenever connectedDevices changes
  // Merges with existing nodes to preserve dragged positions and avoid full reset
  useEffect(() => {
    // Build system nodes (always present)
    const systemNodeIds = ['neo-inputs', 'neo-comms', 'neo-outputs'];
    const systemNodes = systemNodeIds.map(id => ({
      id,
      type: 'neoDevice',
      position: getSystemNodePosition(id),
      data: {
        label: getSystemNodeLabel(id),
        plugType: getSystemNodePlugType(id),
      },
    }));

    // Group devices by plugType for vertical stacking
    const plugTypeBaseY = { inputs: 50, communications: 540, outputs: 1030 };
    const plugTypeCounters = { inputs: 0, communications: 0, outputs: 0 };

    const deviceNodes = connectedDevices.map((device) => {
      const plugType = device.plugType;
      const idx = plugTypeCounters[plugType]++;
      const isPowerInput = device.type === 'power-input';
      const nodeType = isPowerInput ? 'battery'
        : device.type === 'latching' ? 'latchingRelay'
        : device.plugType === 'outputs' ? 'relay' : 'sensor';

      // Use dragged position if available, otherwise default
      const preservedPos = nodePositionsRef.current.get(device.id);
      const defaultPos = { x: DEVICE_X, y: plugTypeBaseY[plugType] + (idx * DEVICE_Y_SPACING) };

      return {
        id: device.id,
        type: nodeType,
        position: preservedPos || defaultPos,
        data: {
          label: device.label,
          sensorType: device.type,
          terminals: getDeviceTerminals(device),
          handleSide: device.handleSide || 'bottom',
          terminalSides: device.terminalSides || {},
        },
      };
    });

    // Merge new nodes with previous ones to preserve positions & avoid full reset
    setNodes((prev) => {
      const prevMap = new Map(prev.map(n => [n.id, n]));
      const validDeviceIds = new Set(connectedDevices.map(d => d.id));

      for (const n of [...systemNodes, ...deviceNodes]) {
        const existing = prevMap.get(n.id);
        if (existing) {
          // Preserve existing position; update data
          prevMap.set(n.id, { ...n, position: existing.position });
        } else {
          prevMap.set(n.id, n);
        }
      }

      // Remove device nodes that no longer exist
      for (const [id, n] of prevMap) {
        if (n.id.startsWith('device-') && !validDeviceIds.has(n.id)) {
          prevMap.delete(id);
        }
      }

      return Array.from(prevMap.values());
    });

    // Build edges from all connected devices
    const newEdges = connectedDevices.flatMap(createEdgesForDevice);
    setEdges(newEdges);
  }, [connectedDevices, setNodes, setEdges]);

  // Check for pin conflicts
  const checkConflicts = useCallback((devices) => {
    const signalPinUsage = {};
    const powerPinUsage = {};
    const conflicts = [];

    const busTypes = ['rs485', 'sdi12', 'wiegand'];

    devices.forEach(device => {
      const usedPins = getUsedPins(device);
      const isBusType = busTypes.includes(device.type);

      usedPins.signalPins.forEach(pin => {
        const key = `${device.plugType}-${pin}`;
        
        if (isBusType) {
          if (!signalPinUsage[key]) {
            signalPinUsage[key] = [];
          }
          signalPinUsage[key].push(device);
        } else {
          if (signalPinUsage[key] && !Array.isArray(signalPinUsage[key])) {
            conflicts.push({
              pin,
              plugType: device.plugType,
              type: 'signal',
              devices: [signalPinUsage[key].id, device.id],
            });
          } else {
            signalPinUsage[key] = device;
          }
        }
      });

      usedPins.powerPins.forEach(pin => {
        const key = `${device.plugType}-${pin}`;
        if (powerPinUsage[key]) {
          console.warn(`Power pin ${pin} used by multiple devices on ${device.plugType}`);
        } else {
          powerPinUsage[key] = device;
        }
      });
    });

    setPinConflicts(conflicts);
    return conflicts;
  }, []);

  useEffect(() => {
    checkConflicts(connectedDevices);
  }, [connectedDevices, checkConflicts]);

  // Add a new device
  const addDevice = useCallback((deviceTemplate) => {
    const busTypes = ['rs485', 'sdi12', 'wiegand'];
    const isBusType = busTypes.includes(deviceTemplate.type);

    const availableOptions = deviceTemplate.channels || deviceTemplate.outputs || deviceTemplate.inputs || [];

    let newDevice = null;
    let conflicts = [];

    if (isBusType) {
      newDevice = {
        id: `device-${Date.now()}`,
        ...deviceTemplate,
        channel: deviceTemplate.channels ? (deviceTemplate.channels[0] || null) : null,
        output: deviceTemplate.outputs ? (deviceTemplate.outputs[0] || null) : null,
        input: deviceTemplate.inputs ? (deviceTemplate.inputs[0] || null) : null,
        powerSource: deviceTemplate.powerSource ? deviceTemplate.powerSource[0] : null,
        label: deviceTemplate.label,
        wireMode: deviceTemplate.channels ? '3-wire' : undefined,
        handleSide: 'bottom',
        terminalSides: {},
      };
    } else {
      for (const option of availableOptions) {
        const testDevice = {
          id: `device-${Date.now()}`,
          ...deviceTemplate,
          channel: deviceTemplate.channels ? option : null,
          output: deviceTemplate.outputs ? option : null,
          input: deviceTemplate.inputs ? option : null,
          powerSource: deviceTemplate.powerSource ? deviceTemplate.powerSource[0] : null,
          label: deviceTemplate.label,
          wireMode: deviceTemplate.channels ? '3-wire' : undefined,
          handleSide: 'bottom',
          terminalSides: {},
        };

        const tempDevices = [...connectedDevices, testDevice];
        conflicts = checkConflicts(tempDevices);

        if (conflicts.length === 0) {
          newDevice = testDevice;
          break;
        }
      }

      if (!newDevice) {
        const firstOption = findNextAvailable(deviceTemplate, connectedDevices);
        newDevice = {
          id: `device-${Date.now()}`,
          ...deviceTemplate,
          channel: deviceTemplate.channels ? firstOption : null,
          output: deviceTemplate.outputs ? firstOption : null,
          input: deviceTemplate.inputs ? firstOption : null,
          powerSource: deviceTemplate.powerSource ? deviceTemplate.powerSource[0] : null,
          label: deviceTemplate.label,
          wireMode: deviceTemplate.channels ? '3-wire' : undefined,
        };

        const tempDevices = [...connectedDevices, newDevice];
        conflicts = checkConflicts(tempDevices);

        if (conflicts.length > 0) {
          const conflictPins = conflicts.map(c => `${c.plugType} Pin ${c.pin}`).join(', ');
          alert(`Warning: All pins are in use! Conflict detected on: ${conflictPins}`);
        }
      }
    }

    setConnectedDevices(prev => [...prev, newDevice]);
    // Node and edges will be created by the layout effect above
  }, [connectedDevices, checkConflicts]);

  // Remove a device
  const removeDevice = useCallback((deviceId) => {
    nodePositionsRef.current.delete(deviceId);
    setConnectedDevices((prev) => prev.filter(d => d.id !== deviceId));
    setNodes((prev) => prev.filter(n => n.id !== deviceId));
    if (selectedDevice?.id === deviceId) {
      setSelectedDevice(null);
    }
  }, [selectedDevice, setNodes]);

  // Update device configuration
  const updateDevice = useCallback((deviceId, updates) => {
    setConnectedDevices((prev) =>
      prev.map(d => d.id === deviceId ? { ...d, ...updates } : d)
    );

    // Update node
    const device = connectedDevices.find(d => d.id === deviceId);
    if (device) {
      const updatedDevice = { ...device, ...updates };

      if (selectedDevice && selectedDevice.id === deviceId) {
        setSelectedDevice(updatedDevice);
      }

      setNodes((prev) => prev.map(n =>
        n.id === deviceId
          ? {
            ...n,
            data: {
              ...n.data,
              label: updatedDevice.label,
              terminals: getDeviceTerminals(updatedDevice)
            }
          }
          : n
      ));
    }
  }, [connectedDevices, setNodes, selectedDevice]);

  const onNodeClick = useCallback((event, node) => {
    if (node.id.startsWith('device-')) {
      const device = connectedDevices.find(d => d.id === node.id);
      setSelectedDevice(device);
    }
  }, [connectedDevices]);

  // Custom handler for node changes that also syncs connectedDevices when nodes are deleted
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);

    const removedNodeIds = changes
      .filter(change => change.type === 'remove')
      .map(change => change.id);

    if (removedNodeIds.length > 0) {
      const removedDeviceIds = removedNodeIds.filter(id => id.startsWith('device-'));

      if (removedDeviceIds.length > 0) {
        setConnectedDevices(prev => {
          const updated = prev.filter(d => !removedDeviceIds.includes(d.id));
          return updated;
        });

        if (selectedDevice && removedDeviceIds.includes(selectedDevice.id)) {
          setSelectedDevice(null);
        }
      }
    }
  }, [onNodesChange, selectedDevice]);

  // Export Design as JSON
  const handleSaveDesign = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(connectedDevices, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "neo_wiring_design.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Import Design (JSON)
  const handleLoadDesign = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (Array.isArray(json)) {
          setNodes([]);
          setEdges([]);

          const devicesWithWireMode = json.map(d => ({
            ...d,
            wireMode: d.wireMode || (d.channels && d.type !== 'power-input' ? '3-wire' : undefined)
          }));
          setConnectedDevices(devicesWithWireMode);
        } else {
          alert("Invalid file format: Expected an array of devices.");
        }
      } catch {
        alert("Error parsing JSON file");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Export Wiring Schedule as CSV
  const handleExportCSV = () => {
    const getPinLabel = (pin, device) => {
      const colorNames = { 1: 'White', 2: 'Brown', 3: 'Green', 4: 'Yellow', 5: 'Grey', 6: 'Pink', 7: 'Blue', 8: 'Red' };
      const color = colorNames[pin] || 'Unknown';

      if (pin === 3) return `Pin ${pin} ${color} - Sensor Power Out (Vout+)`;
      if (pin === 4) return `Pin ${pin} ${color} - Sensor GND`;
      if (pin === 1) return `Pin ${pin} ${color} - VCC+ (Solar/Supply)`;
      if (pin === 2) return `Pin ${pin} ${color} - GND`;

      if (device.plugType === 'inputs') {
        const inputMap = { 5: 'Input 4', 6: 'Input 3', 7: 'Input 2', 8: 'Input 1' };
        return `Pin ${pin} ${color} - ${inputMap[pin] || 'Signal'}`;
      } else if (device.plugType === 'outputs') {
        const outputMap = { 5: 'Output 1 (A1)', 6: 'Output 2 (A2)', 7: 'Output 3 (A3)', 8: 'Output 4 (A4)' };
        return `Pin ${pin} ${color} - ${outputMap[pin] || 'Output'}`;
      } else if (device.plugType === 'communications') {
        if (device.type === 'rs485') {
          if (pin === 3) return `Pin ${pin} ${color} - RS485 B`;
          if (pin === 4) return `Pin ${pin} ${color} - RS485 A`;
        } else if (device.type === 'wiegand') {
          if (pin === 5) return `Pin ${pin} ${color} - Wiegand D1`;
          if (pin === 6) return `Pin ${pin} ${color} - Wiegand D0`;
        } else if (device.type === 'sdi12') {
          if (pin === 7) return `Pin ${pin} ${color} - SDI-12 Data`;
          if (pin === 8) return `Pin ${pin} ${color} - GND`;
        } else if (device.type === 'pulse') {
          if (pin === 5) return `Pin ${pin} ${color} - Digital Input 2`;
          if (pin === 6) return `Pin ${pin} ${color} - Digital Input 1`;
        }
        return `Pin ${pin} ${color} - Signal`;
      }

      return `Pin ${pin} ${color}`;
    };

    let csvContent = "Device Name,Type,Plug,Connections\n";

    connectedDevices.forEach(device => {
      const pins = getUsedPins(device);
      const connectionStrings = [];

      let pinsToShow;
      if (device.type === 'power-input') {
        pinsToShow = [1, 2];
      } else {
        pinsToShow = [...new Set([...pins.signalPins, ...pins.powerPins])].sort((a, b) => a - b);
      }

      pinsToShow.forEach(pin => {
        connectionStrings.push(getPinLabel(pin, device));
      });

      const connections = connectionStrings.join("; ");
      csvContent += `"${device.label}","${device.type}","${device.plugType}","${connections}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "neo_wiring_schedule.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export diagram as PNG image
  const handleExportImage = useCallback(async () => {
    if (!reactFlowWrapper.current) {
      console.warn('Export: ReactFlow wrapper not found');
      return;
    }

    const elementsToRestore = [];

    try {
      const { toSvg } = await import('html-to-image');
      const container = reactFlowWrapper.current;

      const selectorsToHide = [
        '.diagram-actions',
        '.conflict-warning',
        '.react-flow__controls',
        '.react-flow__minimap',
        '.react-flow__attribution',
      ];

      selectorsToHide.forEach(selector => {
        const el = container.querySelector(selector);
        if (el) {
          elementsToRestore.push({
            element: el,
            originalDisplay: el.style.display,
            originalVisibility: el.style.visibility
          });
          el.style.display = 'none';
        }
      });

      const isDarkTheme = document.body.getAttribute('data-theme') !== 'light';
      const bgColor = isDarkTheme ? '#0a0a0f' : '#f5f5f7';

      const reactFlowEl = container.querySelector('.react-flow');
      const viewportEl = container.querySelector('.react-flow__viewport');

      if (!reactFlowEl || !viewportEl) {
        throw new Error('ReactFlow elements not found');
      }

      const nodeElements = container.querySelectorAll('.react-flow__node');

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      nodeElements.forEach(node => {
        const rect = node.getBoundingClientRect();
        const containerRect = reactFlowEl.getBoundingClientRect();

        const x = (rect.left - containerRect.left);
        const y = (rect.top - containerRect.top);
        const width = rect.width;
        const height = rect.height;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      });

      const padding = 50;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = maxX + padding;
      maxY = maxY + padding;

      const captureWidth = reactFlowEl.offsetWidth;
      const captureHeight = reactFlowEl.offsetHeight;

      await new Promise(resolve => setTimeout(resolve, 300));

      const svgDataUrl = await toSvg(reactFlowEl, {
        backgroundColor: bgColor,
        width: captureWidth,
        height: captureHeight,
        pixelRatio: 2,
        style: {
          overflow: 'visible',
        },
        filter: (node) => {
          if (node.classList) {
            if (node.classList.contains('react-flow__controls')) return false;
            if (node.classList.contains('react-flow__minimap')) return false;
            if (node.classList.contains('react-flow__attribution')) return false;
          }
          return true;
        }
      });

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = svgDataUrl;
      });

      const canvas = document.createElement('canvas');
      const outputScale = 2;
      canvas.width = captureWidth * outputScale;
      canvas.height = captureHeight * outputScale;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      link.href = dataUrl;
      link.download = `neo_wiring_diagram_${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Error exporting image:', err);
      alert('Failed to export image. Please try again.');
    } finally {
      elementsToRestore.forEach(({ element, originalDisplay, originalVisibility }) => {
        element.style.display = originalDisplay || '';
        element.style.visibility = originalVisibility || '';
      });
    }
  }, []);

  // Export PDF Report with BOM, Connections, and Diagram
  const handleExportPDF = useCallback(async () => {
    if (!reactFlowWrapper.current) {
      console.warn('Export: ReactFlow wrapper not found');
      return;
    }

    try {
      const { toSvg } = await import('html-to-image');
      const container = reactFlowWrapper.current;

      const selectorsToHide = ['.diagram-actions', '.conflict-warning', '.react-flow__controls', '.react-flow__minimap', '.react-flow__attribution'];
      const elementsToRestore = [];
      
      selectorsToHide.forEach(selector => {
        const el = container.querySelector(selector);
        if (el) {
          elementsToRestore.push({ element: el, originalDisplay: el.style.display });
          el.style.display = 'none';
        }
      });

      const bgElement = container.querySelector('.react-flow__background');
      if (bgElement) {
        elementsToRestore.push({ element: bgElement, originalDisplay: bgElement.style.display });
        bgElement.style.display = 'none';
      }

      const isDarkTheme = document.body.getAttribute('data-theme') !== 'light';
      const bgColor = isDarkTheme ? '#000000' : '#ffffff';
      
      const reactFlowEl = container.querySelector('.react-flow');
      if (!reactFlowEl) throw new Error('ReactFlow element not found');

      await new Promise(resolve => setTimeout(resolve, 500));

      const nodes = reactFlowWrapper.current.querySelectorAll('.react-flow__node');
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      nodes.forEach(node => {
        const style = node.getAttribute('style') || '';
        const translateMatch = style.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        
        if (translateMatch) {
          const x = parseFloat(translateMatch[1]);
          const y = parseFloat(translateMatch[2]);
          const width = node.offsetWidth || 160;
          const height = node.offsetHeight || 140;
          
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + width);
          maxY = Math.max(maxY, y + height);
        }
      });
      
      if (minX === Infinity) {
        minX = 0;
        minY = 0;
        maxX = reactFlowEl.offsetWidth;
        maxY = reactFlowEl.offsetHeight;
      }
      
      const padding = 80;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = maxX + padding;
      maxY = maxY + padding;
      
      const captureWidth = maxX;
      const captureHeight = maxY;
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;

      const svgDataUrl = await toSvg(reactFlowEl, {
        backgroundColor: bgColor,
        width: captureWidth,
        height: captureHeight,
        pixelRatio: 2,
        style: { overflow: 'visible' },
        filter: (node) => {
          if (node.classList) {
            if (node.classList.contains('react-flow__controls')) return false;
            if (node.classList.contains('react-flow__minimap')) return false;
            if (node.classList.contains('react-flow__attribution')) return false;
            if (node.classList.contains('react-flow__background')) return false;
          }
          return true;
        }
      });

      elementsToRestore.forEach(({ element, originalDisplay }) => {
        element.style.display = originalDisplay || '';
      });

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      const margin = 15;
      const timestamp = new Date().toISOString().slice(0, 10);

      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setTextColor(0, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('NEO WIRING SYSTEM REPORT', margin, 10);
      doc.setFontSize(10);
      doc.text(`Generated: ${timestamp}`, margin, 16);

      let yPos = 28;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('1. BILL OF MATERIALS', margin, yPos);
      yPos += 6;

      const bomData = connectedDevices.map((device, idx) => [
        idx + 1,
        device.label,
        device.type.toUpperCase(),
        device.plugType.toUpperCase(),
        device.channel || device.output || device.input || '-',
        device.wireMode || '-'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'Device Name', 'Type', 'Plug', 'Channel/Output', 'Wire Mode']],
        body: bomData,
        theme: 'grid',
        headStyles: { fillColor: [0, 168, 150], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 60 },
          2: { cellWidth: 45 },
          3: { cellWidth: 40 },
          4: { cellWidth: 35 },
          5: { cellWidth: 35 }
        }
      });

      yPos = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : yPos + 30;

      if (yPos > 140) {
        doc.addPage('a4', 'landscape');
        yPos = 15;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2. CONNECTION SCHEDULE', margin, yPos);
      yPos += 6;

      const connectionData = [];
      connectedDevices.forEach(device => {
        const wireNumbers = device.wireNumbers || {};
        
        if (device.plugType === 'inputs') {
          if (device.type === 'power-input') {
            connectionData.push([
              device.label,
              'VCC+',
              '1',
              'White',
              wireNumbers['vcc'] || '101'
            ]);
            connectionData.push([
              device.label,
              'GND',
              '2',
              'Brown',
              wireNumbers['gnd'] || '102'
            ]);
          } else {
            const pinMap = { 1: 8, 2: 7, 3: 6, 4: 5 };
            const signalPin = pinMap[device.channel];
            const colorMap = { 8: 'Red', 7: 'Blue', 6: 'Pink', 5: 'Grey' };
            
            connectionData.push([
              device.label,
              'Signal',
              signalPin.toString(),
              colorMap[signalPin],
              wireNumbers['signal'] || `${200 + device.channel}`
            ]);
            connectionData.push([
              device.label,
              'Power',
              '3',
              'Green',
              wireNumbers['power'] || '103'
            ]);
            if (device.wireMode !== '2-wire') {
              connectionData.push([
                device.label,
                'GND',
                '4',
                'Yellow',
                wireNumbers['gnd'] || '104'
              ]);
            }
          }
        } else if (device.plugType === 'outputs') {
          if (device.type === 'power-input') {
            connectionData.push([device.label, 'VCC+', '1', 'White', wireNumbers['vcc'] || '101']);
            connectionData.push([device.label, 'GND', '2', 'Brown', wireNumbers['gnd'] || '102']);
          } else if (device.type === 'latching') {
            const pins = device.output === 1 ? ['5', '6'] : ['7', '8'];
            const colors = device.output === 1 ? ['Grey', 'Pink'] : ['Blue', 'Red'];
            connectionData.push([device.label, 'A1', pins[0], colors[0], wireNumbers['a1'] || `${300 + device.output}`]);
            connectionData.push([device.label, 'A2', pins[1], colors[1], wireNumbers['a2'] || `${400 + device.output}`]);
          } else {
            const pinMap = { 1: '5', 2: '6', 3: '7', 4: '8' };
            const colorMap = { 1: 'Grey', 2: 'Pink', 3: 'Blue', 4: 'Red' };
            connectionData.push([device.label, `Out ${device.output}`, pinMap[device.output], colorMap[device.output], wireNumbers['a1'] || `${300 + device.output}`]);
            connectionData.push([device.label, 'GND', '4', 'Yellow', wireNumbers['a2'] || '104']);
          }
        } else if (device.plugType === 'communications') {
          if (device.type === 'power-input') {
            connectionData.push([device.label, 'VCC+', '1', 'White', wireNumbers['vcc'] || '101']);
            connectionData.push([device.label, 'GND', '2', 'Brown', wireNumbers['gnd'] || '102']);
          } else if (device.type === 'rs485') {
            connectionData.push([device.label, 'B', '3', 'Green', wireNumbers['b'] || '501']);
            connectionData.push([device.label, 'A', '4', 'Yellow', wireNumbers['a'] || '502']);
          } else if (device.type === 'wiegand') {
            connectionData.push([device.label, 'D0', '6', 'Pink', wireNumbers['d0'] || '601']);
            connectionData.push([device.label, 'D1', '5', 'Grey', wireNumbers['d1'] || '602']);
          } else if (device.type === 'sdi12') {
            connectionData.push([device.label, 'Data', '7', 'Blue', wireNumbers['data'] || '701']);
            connectionData.push([device.label, 'GND', '8', 'Red', wireNumbers['gnd'] || '102']);
          } else if (device.type === 'pulse') {
            const pin = device.input === 2 ? '5' : '6';
            const color = device.input === 2 ? 'Grey' : 'Pink';
            connectionData.push([device.label, 'Signal', pin, color, wireNumbers['signal'] || `${600 + (device.input || 1)}`]);
            connectionData.push([device.label, 'Power', '3', 'Green', wireNumbers['power'] || '103']);
            connectionData.push([device.label, 'GND', '4', 'Yellow', wireNumbers['gnd'] || '104']);
          }
        }
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Device', 'Function', 'Pin', 'Color', 'Wire #']],
        body: connectionData,
        theme: 'grid',
        headStyles: { fillColor: [0, 168, 150], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 35 },
          2: { cellWidth: 20 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 }
        }
      });

      const svgToPng = async (svgUrl) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            // Crop to content bounds, removing empty margins
            const scaleX = img.width / maxX;
            const scaleY = img.height / maxY;
            const scale = Math.min(scaleX, scaleY);

            const cropX = minX * scale;
            const cropY = minY * scale;
            const cropW = contentWidth * scale;
            const cropH = contentHeight * scale;

            const canvas = document.createElement('canvas');
            canvas.width = cropW * 2;
            canvas.height = cropH * 2;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = isDarkTheme ? '#000000' : '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = reject;
          img.src = svgUrl;
        });
      };

      const pngDataUrl = await svgToPng(svgDataUrl);

      doc.addPage('a4', 'landscape');
      const diagramPageWidth = doc.internal.pageSize.getWidth();
      const diagramPageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('3. WIRING DIAGRAM', margin, 10);

      const headerSpace = 12;
      const footerSpace = 8;
      const availableWidth = diagramPageWidth - (margin * 2);
      const availableHeight = diagramPageHeight - headerSpace - footerSpace;

      const imgAspectRatio = contentWidth / contentHeight;
      const pageAspectRatio = availableWidth / availableHeight;

      let finalWidth, finalHeight;

      if (imgAspectRatio > pageAspectRatio) {
        finalWidth = availableWidth;
        finalHeight = finalWidth / imgAspectRatio;
      } else {
        finalHeight = availableHeight;
        finalWidth = finalHeight * imgAspectRatio;
      }

      const xOffset = margin + (availableWidth - finalWidth) / 2;
      const yOffset = headerSpace + (availableHeight - finalHeight) / 2;

      doc.addImage(pngDataUrl, 'PNG', xOffset, yOffset, finalWidth, finalHeight);

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const currentWidth = doc.internal.pageSize.getWidth();
        const currentHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount} - NEO Wiring System Report`, margin, currentHeight - 5);
        doc.text('NEO Wiring Tool', currentWidth - margin - 35, currentHeight - 5);
      }

      doc.save(`neo_wiring_report_${timestamp}.pdf`);

    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF. Please try again.');
    }
  }, [connectedDevices]);

  return (
    <div className="system-wiring-page">
      <div className="system-layout">
        {/* Left Sidebar - Device Palette */}
        <DevicePalette
          availableDevices={availableDevices}
          onAddDevice={addDevice}
        />

        {/* Center - React Flow Diagram */}
        <div className="diagram-container" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            minZoom={0.2}
            maxZoom={2}
            attributionPosition="bottom-left"
          >
            <FitViewOnMount />
            {/* No background grid - clean AutoCAD style */}
            <Controls />
            <MiniMap
              nodeColor={() => 'var(--bg-secondary)'}
              nodeStrokeColor={() => 'var(--accent-color)'}
              maskColor="rgba(0, 0, 0, 0.7)"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-secondary)',
              }}
            />

            <div className="diagram-actions" style={{ position: 'absolute', top: 10, right: 10, zIndex: 5, display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSaveDesign}
                className="action-btn"
                title="Save Design (JSON)"
                style={{
                  padding: '8px 12px',
                  background: '#00a896',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                💾 Save
              </button>
              <button
                onClick={() => document.getElementById('load-design-input').click()}
                className="action-btn"
                title="Load Design (JSON)"
                style={{
                  padding: '8px 12px',
                  background: '#2a2a3a',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                📂 Load
              </button>
              <input
                type="file"
                id="load-design-input"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleLoadDesign}
              />
              <button
                onClick={handleExportCSV}
                className="action-btn"
                title="Export Wiring Schedule (CSV)"
                style={{
                  padding: '8px 12px',
                  background: '#4a4a5a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                📋 Export CSV
              </button>
              <button
                onClick={handleExportImage}
                className="action-btn export-image-btn"
                title="Export Diagram as Image (PNG)"
                style={{
                  padding: '8px 12px',
                  background: '#7c4dff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#9575cd'}
                onMouseLeave={(e) => e.target.style.background = '#7c4dff'}
              >
                🖼️ Export Image
              </button>
              <button
                onClick={handleExportPDF}
                className="action-btn export-pdf-btn"
                title="Export PDF Report (BOM + Connections + Diagram)"
                style={{
                  padding: '8px 12px',
                  background: '#ff5722',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#ff784e'}
                onMouseLeave={(e) => e.target.style.background = '#ff5722'}
              >
                📄 Export PDF
              </button>
            </div>
          </ReactFlow>

          {pinConflicts.length > 0 && (
            <div className="conflict-warning">
              <strong>Pin Conflicts Detected:</strong>
              {pinConflicts.map((conflict, idx) => (
                <span key={idx}> {conflict.plugType} Pin {conflict.pin}</span>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar - Configuration & Summary */}
        <div className="config-sidebar">
          <DeviceConfigPanel
            device={selectedDevice}
            onUpdate={updateDevice}
            onRemove={removeDevice}
            availableDevices={availableDevices}
          />

          <PinUsageSummary
            connectedDevices={connectedDevices}
            pinConflicts={pinConflicts}
          />
        </div>
      </div>
    </div>
  );
};
