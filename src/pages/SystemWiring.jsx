import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  addEdge,
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
import { colorMap, plugOptions } from '../data/plugData';
import './SystemWiring.css';

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

// Get pin configuration for a device
const getDevicePins = (deviceType, plugType, channelOrOutput) => {
  const plugData = plugOptions.find(p => p.value === plugType);
  if (!plugData) return [];

  const typeData = plugData.types.find(t => t.value === deviceType);
  if (!typeData) return [];

  return typeData.pins || [];
};

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
      terminals.push(
        { id: 'signal', name: 'Signal', color: colorMap[channelColors[device.channel]] },
        { id: 'power+', name: 'Power+', color: colorMap.green }
      );
      // Only add GND terminal for 3-wire mode
      if (!is2Wire) {
        terminals.push({ id: 'gnd', name: 'GND', color: colorMap.yellow });
      }
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
      terminals.push(
        { id: 'd0', name: 'D0', color: colorMap.pink },
        { id: 'd1', name: 'D1', color: colorMap.grey }
      );
    } else if (device.type === 'sdi12') {
      terminals.push(
        { id: 'data', name: 'Data', color: colorMap.blue },
        { id: 'gnd', name: 'GND', color: colorMap.red }
      );
    } else if (device.type === 'pulse') {
      terminals.push(
        { id: 'signal', name: 'Signal', color: colorMap.pink },
        { id: 'power', name: 'Power+', color: colorMap.green },
        { id: 'gnd', name: 'GND', color: colorMap.yellow }
      );
    }
  }

  return terminals;
};

// Create edges for a device (pure function - moved outside component)
// Generate default wire number based on edge type and device
const generateDefaultWireNumber = (edgeType, device) => {
  // Use device channel/output to generate consistent wire numbers
  const baseNum = device.channel || device.output || device.input || 1;
  
  const wireNumberMap = {
    'vcc': '101',
    'gnd': '102', 
    'power': '103',
    'signal': `${200 + baseNum}`,
    'a1': `${300 + (device.output || 1)}`,
    'a2': `${400 + (device.output || 1)}`,
    'a': '501',
    'b': '502',
    'd0': '601',
    'd1': '602',
    'data': '701',
  };
  
  return wireNumberMap[edgeType] || '100';
};

const createEdgesForDevice = (device) => {
  const edges = [];
  const edgeId = `e-${device.id}`; // Use stable ID prefix based on device ID
  const wireNumbers = device.wireNumbers || {};

  if (device.plugType === 'inputs') {
    if (device.type === 'power-input') {
      // Power input - arrows point INTO neo (battery is source, neo is target)
      edges.push({
        id: `${edgeId}-vcc`,
        source: device.id,
        target: 'neo-inputs',
        sourceHandle: 'vcc+',
        targetHandle: 'vcc',
        type: 'coloredWire',
        data: { 
          label: 'VCC+ (Pin 1)', 
          color: colorMap.white,
          wireNumber: wireNumbers['vcc'] || generateDefaultWireNumber('vcc', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.white },
      });
      edges.push({
        id: `${edgeId}-gnd`,
        source: device.id,
        target: 'neo-inputs',
        sourceHandle: 'gnd',
        targetHandle: 'gnd',
        type: 'coloredWire',
        data: { 
          label: 'GND (Pin 2)', 
          color: colorMap.brown,
          wireNumber: wireNumbers['gnd'] || generateDefaultWireNumber('gnd', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.brown },
      });
    } else {
      const channelColors = { 1: 'red', 2: 'blue', 3: 'pink', 4: 'grey' };
      const pinMap = { 1: 'pin-8', 2: 'pin-7', 3: 'pin-6', 4: 'pin-5' };

      const channel = device.channel;
      const color = channelColors[channel] ? colorMap[channelColors[channel]] : '#999';
      const sourceHandle = pinMap[channel];

      if (sourceHandle) {
        edges.push({
          id: `${edgeId}-signal`,
          source: 'neo-inputs',
          target: device.id,
          sourceHandle: sourceHandle,
          targetHandle: 'signal',
          type: 'coloredWire',
          data: { 
            label: 'Signal', 
            color: color,
            wireNumber: wireNumbers['signal'] || generateDefaultWireNumber('signal', device)
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: color },
        });
      }

      edges.push({
        id: `${edgeId}-power`,
        source: 'neo-inputs',
        target: device.id,
        sourceHandle: 'power',
        targetHandle: 'power+',
        type: 'coloredWire',
        data: { 
          label: 'Power', 
          color: colorMap.green,
          wireNumber: wireNumbers['power'] || generateDefaultWireNumber('power', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.green },
      });
      // Only add GND edge for 3-wire mode
      if (device.wireMode !== '2-wire') {
        edges.push({
          id: `${edgeId}-gnd`,
          source: 'neo-inputs',
          target: device.id,
          sourceHandle: 'gnd',
          targetHandle: 'gnd',
          type: 'coloredWire',
          data: { 
            label: 'GND', 
            color: colorMap.yellow,
            wireNumber: wireNumbers['gnd'] || generateDefaultWireNumber('gnd', device)
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.yellow },
        });
      }
    }
  } else if (device.plugType === 'outputs') {
    if (device.type === 'power-input') {
      // Power input - arrows point INTO neo (battery is source, neo is target)
      edges.push({
        id: `${edgeId}-vcc`,
        source: device.id,
        target: 'neo-outputs',
        sourceHandle: 'vcc+',
        targetHandle: 'vcc',
        type: 'coloredWire',
        data: { 
          label: 'VCC+ (Pin 1)', 
          color: colorMap.white,
          wireNumber: wireNumbers['vcc'] || generateDefaultWireNumber('vcc', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.white },
      });
      edges.push({
        id: `${edgeId}-gnd`,
        source: device.id,
        target: 'neo-outputs',
        sourceHandle: 'gnd',
        targetHandle: 'gnd',
        type: 'coloredWire',
        data: { 
          label: 'GND (Pin 2)', 
          color: colorMap.brown,
          wireNumber: wireNumbers['gnd'] || generateDefaultWireNumber('gnd', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.brown },
      });
    } else if (device.type === 'latching') {
      const outputColors = device.output === 1 ? ['grey', 'pink'] : ['blue', 'red'];
      const pinMap = device.output === 1 ? ['pin-5', 'pin-6'] : ['pin-7', 'pin-8'];
      const outputLabels = device.output === 1 ? ['Out 1', 'Out 2'] : ['Out 3', 'Out 4'];

      edges.push({
        id: `${edgeId}-a1`,
        source: 'neo-outputs',
        target: device.id,
        sourceHandle: pinMap[0],
        targetHandle: 'a1',
        type: 'coloredWire',
        data: { 
          label: outputLabels[0], 
          color: colorMap[outputColors[0]],
          wireNumber: wireNumbers['a1'] || generateDefaultWireNumber('a1', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap[outputColors[0]] },
      });
      edges.push({
        id: `${edgeId}-a2`,
        source: 'neo-outputs',
        target: device.id,
        sourceHandle: pinMap[1],
        targetHandle: 'a2',
        type: 'coloredWire',
        data: { 
          label: outputLabels[1], 
          color: colorMap[outputColors[1]],
          wireNumber: wireNumbers['a2'] || generateDefaultWireNumber('a2', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap[outputColors[1]] },
      });
    } else {
      const outputColors = { 1: 'grey', 2: 'pink', 3: 'blue', 4: 'red' };
      const pinMap = { 1: 'pin-5', 2: 'pin-6', 3: 'pin-7', 4: 'pin-8' };
      const output = device.output;

      const sourceHandle = pinMap[output];
      const color = outputColors[output] ? colorMap[outputColors[output]] : '#999';

      if (sourceHandle) {
        edges.push({
          id: `${edgeId}-a1`,
          source: 'neo-outputs',
          target: device.id,
          sourceHandle: sourceHandle,
          targetHandle: 'a1',
          type: 'coloredWire',
          data: { 
            label: `Out ${output}`, 
            color: color,
            wireNumber: wireNumbers['a1'] || generateDefaultWireNumber('a1', device)
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: color },
        });
      }

      edges.push({
        id: `${edgeId}-a2`,
        source: 'neo-outputs',
        target: device.id,
        sourceHandle: 'gnd',
        targetHandle: 'a2',
        type: 'coloredWire',
        data: { 
          label: 'GND', 
          color: colorMap.yellow,
          wireNumber: wireNumbers['a2'] || generateDefaultWireNumber('a2', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.yellow },
      });
    }
  } else if (device.plugType === 'communications') {
    if (device.type === 'power-input') {
      // Power input - arrows point INTO neo (battery is source, neo is target)
      edges.push({
        id: `${edgeId}-vcc`,
        source: device.id,
        target: 'neo-comms',
        sourceHandle: 'vcc+',
        targetHandle: 'vcc',
        type: 'coloredWire',
        data: { 
          label: 'VCC+ (Pin 1)', 
          color: colorMap.white,
          wireNumber: wireNumbers['vcc'] || generateDefaultWireNumber('vcc', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.white },
      });
      edges.push({
        id: `${edgeId}-gnd`,
        source: device.id,
        target: 'neo-comms',
        sourceHandle: 'gnd',
        targetHandle: 'gnd',
        type: 'coloredWire',
        data: { 
          label: 'GND (Pin 2)', 
          color: colorMap.brown,
          wireNumber: wireNumbers['gnd'] || generateDefaultWireNumber('gnd', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.brown },
      });
    } else if (device.type === 'rs485') {
      edges.push({
        id: `${edgeId}-b`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: 'b',
        targetHandle: 'b',
        type: 'coloredWire',
        data: { 
          label: 'B', 
          color: colorMap.green,
          wireNumber: wireNumbers['b'] || generateDefaultWireNumber('b', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.green },
      });
      edges.push({
        id: `${edgeId}-a`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: 'a',
        targetHandle: 'a',
        type: 'coloredWire',
        data: { 
          label: 'A', 
          color: colorMap.yellow,
          wireNumber: wireNumbers['a'] || generateDefaultWireNumber('a', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.yellow },
      });
    } else if (device.type === 'wiegand') {
      edges.push({
        id: `${edgeId}-d0`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: 'd0',
        targetHandle: 'd0',
        type: 'coloredWire',
        data: { 
          label: 'D0', 
          color: colorMap.pink,
          wireNumber: wireNumbers['d0'] || generateDefaultWireNumber('d0', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.pink },
      });
      edges.push({
        id: `${edgeId}-d1`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: 'd1',
        targetHandle: 'd1',
        type: 'coloredWire',
        data: { 
          label: 'D1', 
          color: colorMap.grey,
          wireNumber: wireNumbers['d1'] || generateDefaultWireNumber('d1', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.grey },
      });
    } else if (device.type === 'sdi12') {
      edges.push({
        id: `${edgeId}-data`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: 'data',
        targetHandle: 'data',
        type: 'coloredWire',
        data: { 
          label: 'Data', 
          color: colorMap.blue,
          wireNumber: wireNumbers['data'] || generateDefaultWireNumber('data', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.blue },
      });
      edges.push({
        id: `${edgeId}-gnd`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: 'gnd',
        targetHandle: 'gnd',
        type: 'coloredWire',
        data: { 
          label: 'GND', 
          color: colorMap.red,
          wireNumber: wireNumbers['gnd'] || generateDefaultWireNumber('gnd', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.red },
      });
    } else if (device.type === 'pulse') {
      // Pulse gets Power/GND from Inputs (cross-wiring) or locally if configured. 
      // Standard spec says Pulse Adapter uses inputs.
      // Signal comes from Comms.

      edges.push({
        id: `${edgeId}-signal`,
        source: 'neo-comms',
        target: device.id,
        sourceHandle: device.input === 2 ? 'pin-5' : 'pin-6',
        targetHandle: 'signal',
        type: 'coloredWire',
        data: { 
          label: 'Signal', 
          color: device.input === 2 ? colorMap.grey : colorMap.pink,
          wireNumber: wireNumbers['signal'] || generateDefaultWireNumber('signal', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: device.input === 2 ? colorMap.grey : colorMap.pink },
      });
      // Power from Inputs plug (Neo Inputs node)
      edges.push({
        id: `${edgeId}-power`,
        source: 'neo-inputs',
        target: device.id,
        sourceHandle: 'power',
        targetHandle: 'power',
        type: 'coloredWire',
        data: { 
          label: 'Power', 
          color: colorMap.green,
          wireNumber: wireNumbers['power'] || generateDefaultWireNumber('power', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.green },
      });
      edges.push({
        id: `${edgeId}-gnd`,
        source: 'neo-inputs',
        target: device.id,
        sourceHandle: 'gnd',
        targetHandle: 'gnd',
        type: 'coloredWire',
        data: { 
          label: 'GND', 
          color: colorMap.yellow,
          wireNumber: wireNumbers['gnd'] || generateDefaultWireNumber('gnd', device)
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.yellow },
      });
    }
  }

  return edges;
};

export const SystemWiring = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [pinConflicts, setPinConflicts] = useState([]);
  const reactFlowWrapper = useRef(null);

  // Update Neo Device nodes based on connected devices
  useEffect(() => {
    const inputs = connectedDevices.filter(d => d.plugType === 'inputs');
    const outputs = connectedDevices.filter(d => d.plugType === 'outputs');
    const comms = connectedDevices.filter(d => d.plugType === 'communications');

    // Neo Inputs Node
    const inputNodeOutputs = [
      { id: 'power', color: colorMap.green },
      { id: 'gnd', color: colorMap.yellow },
    ];

    // Add handles for used input channels or power-input
    inputs.forEach(d => {
      if (d.type === 'power-input') {
        if (!inputNodeOutputs.find(o => o.id === 'pin-1')) inputNodeOutputs.push({ id: 'pin-1', color: colorMap.white });
        if (!inputNodeOutputs.find(o => o.id === 'pin-2')) inputNodeOutputs.push({ id: 'pin-2', color: colorMap.brown });
      } else {
        if (d.channel === 1) inputNodeOutputs.push({ id: 'pin-8', color: colorMap.red });
        if (d.channel === 2) inputNodeOutputs.push({ id: 'pin-7', color: colorMap.blue });
        if (d.channel === 3) inputNodeOutputs.push({ id: 'pin-6', color: colorMap.pink });
        if (d.channel === 4) inputNodeOutputs.push({ id: 'pin-5', color: colorMap.grey });
      }
    });

    // Neo Comms Node
    const commsNodeOutputs = [];
    comms.forEach(d => {
      if (d.type === 'power-input') {
        if (!commsNodeOutputs.find(o => o.id === 'pin-1')) commsNodeOutputs.push({ id: 'pin-1', color: colorMap.white });
        if (!commsNodeOutputs.find(o => o.id === 'pin-2')) commsNodeOutputs.push({ id: 'pin-2', color: colorMap.brown });
      } else if (d.type === 'rs485') {
        if (!commsNodeOutputs.find(o => o.id === 'b')) commsNodeOutputs.push({ id: 'b', color: colorMap.green });
        if (!commsNodeOutputs.find(o => o.id === 'a')) commsNodeOutputs.push({ id: 'a', color: colorMap.yellow });
      } else if (d.type === 'wiegand') {
        if (!commsNodeOutputs.find(o => o.id === 'd0')) commsNodeOutputs.push({ id: 'd0', color: colorMap.pink });
        if (!commsNodeOutputs.find(o => o.id === 'd1')) commsNodeOutputs.push({ id: 'd1', color: colorMap.grey });
      } else if (d.type === 'sdi12') {
        if (!commsNodeOutputs.find(o => o.id === 'data')) commsNodeOutputs.push({ id: 'data', color: colorMap.blue });
        if (!commsNodeOutputs.find(o => o.id === 'gnd')) commsNodeOutputs.push({ id: 'gnd', color: colorMap.red });
      } else if (d.type === 'pulse') {
        const pin = d.input === 2 ? 'pin-5' : 'pin-6'; // Default to Pin 6 (Pink)
        const color = d.input === 2 ? colorMap.grey : colorMap.pink;
        if (!commsNodeOutputs.find(o => o.id === pin)) commsNodeOutputs.push({ id: pin, color: color });
      }
    });

    // Neo Outputs Node
    const outputNodeOutputs = [
      { id: 'gnd', color: colorMap.yellow },
    ];
    outputs.forEach(d => {
      if (d.type === 'power-input') {
        if (!outputNodeOutputs.find(o => o.id === 'pin-1')) outputNodeOutputs.push({ id: 'pin-1', color: colorMap.white });
        if (!outputNodeOutputs.find(o => o.id === 'pin-2')) outputNodeOutputs.push({ id: 'pin-2', color: colorMap.brown });
      } else if (d.type === 'latching') {
        if (d.output === 1) {
          if (!outputNodeOutputs.find(o => o.id === 'pin-5')) outputNodeOutputs.push({ id: 'pin-5', color: colorMap.grey }); // A1
          if (!outputNodeOutputs.find(o => o.id === 'pin-6')) outputNodeOutputs.push({ id: 'pin-6', color: colorMap.pink }); // A2
        } else if (d.output === 3) {
          if (!outputNodeOutputs.find(o => o.id === 'pin-7')) outputNodeOutputs.push({ id: 'pin-7', color: colorMap.blue }); // A3
          if (!outputNodeOutputs.find(o => o.id === 'pin-8')) outputNodeOutputs.push({ id: 'pin-8', color: colorMap.red });  // A4
        }
      } else {
        if (d.output === 1) outputNodeOutputs.push({ id: 'pin-5', color: colorMap.grey });
        if (d.output === 2) outputNodeOutputs.push({ id: 'pin-6', color: colorMap.pink });
        if (d.output === 3) outputNodeOutputs.push({ id: 'pin-7', color: colorMap.blue });
        if (d.output === 4) outputNodeOutputs.push({ id: 'pin-8', color: colorMap.red });
      }
    });

    setNodes(prev => {
      // Keep existing user devices, just update the 3 system nodes
      const userNodes = prev.filter(n => !['neo-inputs', 'neo-comms', 'neo-outputs'].includes(n.id));

      const systemNodes = [
        {
          id: 'neo-inputs',
          type: 'neoDevice',
          position: { x: 50, y: 50 },
          data: { label: 'Neo Device (Inputs)', outputs: inputNodeOutputs },
        },
        {
          id: 'neo-comms',
          type: 'neoDevice',
          position: { x: 50, y: 450 },
          data: { label: 'Neo Device (Coms)', outputs: commsNodeOutputs },
        },
        {
          id: 'neo-outputs',
          type: 'neoDevice',
          position: { x: 50, y: 850 },
          data: { label: 'Neo Device (Outputs)', outputs: outputNodeOutputs },
        },
      ];

      return [...systemNodes, ...userNodes];
    });
  }, [connectedDevices, setNodes]);

  // Check for pin conflicts
  // Pins are tracked per plug type, except power pins (3, 4) which are shared
  // Communication buses (RS485, SDI-12, Wiegand) allow multiple devices on same pins
  const checkConflicts = useCallback((devices) => {
    const signalPinUsage = {}; // Track by plugType -> pin -> device
    const powerPinUsage = {};  // Track power pins globally (shared bus)
    const conflicts = [];

    // Device types that support multi-drop (bus) configurations
    const busTypes = ['rs485', 'sdi12', 'wiegand'];

    devices.forEach(device => {
      const usedPins = getUsedPins(device);
      const isBusType = busTypes.includes(device.type);

      // Check signal pins - these are per plug type
      usedPins.signalPins.forEach(pin => {
        const key = `${device.plugType}-${pin}`;
        
        if (isBusType) {
          // For bus types (RS485, SDI-12, Wiegand), allow multiple devices
          // Just track them but don't flag as conflict
          if (!signalPinUsage[key]) {
            signalPinUsage[key] = [];
          }
          signalPinUsage[key].push(device);
          // No conflict for bus types - they share the same pins by design
        } else {
          // For non-bus types, check for actual conflicts
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

      // Check power pins - these are shared across all plugs (common power bus)
      // Only warn if multiple devices try to use the same power pin on the SAME plug
      usedPins.powerPins.forEach(pin => {
        // For power pins, conflicts only matter within the same physical plug
        const key = `${device.plugType}-${pin}`;
        if (powerPinUsage[key]) {
          // This is more of a warning - power can be shared but might overload
          console.warn(`Power pin ${pin} used by multiple devices on ${device.plugType}`);
        } else {
          powerPinUsage[key] = device;
        }
      });
    });

    setPinConflicts(conflicts);
    return conflicts;
  }, []);

  // Recalculate pin conflicts whenever connectedDevices changes
  useEffect(() => {
    checkConflicts(connectedDevices);
  }, [connectedDevices, checkConflicts]);

  // Add a new device
  const addDevice = useCallback((deviceTemplate) => {
    // Bus types can share pins (multi-drop communication)
    const busTypes = ['rs485', 'sdi12', 'wiegand'];
    const isBusType = busTypes.includes(deviceTemplate.type);

    // Get all available options
    const availableOptions = deviceTemplate.channels || deviceTemplate.outputs || deviceTemplate.inputs || [];

    // Try each option until we find one without conflicts
    let selectedOption = null;
    let newDevice = null;
    let conflicts = [];

    // For bus types, skip conflict checking - they share pins by design
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
      };
    } else {
      // Non-bus types need conflict checking
      for (const option of availableOptions) {
        // Create a test device with this option
        const testDevice = {
          id: `device-${Date.now()}`,
          ...deviceTemplate,
          channel: deviceTemplate.channels ? option : null,
          output: deviceTemplate.outputs ? option : null,
          input: deviceTemplate.inputs ? option : null,
          powerSource: deviceTemplate.powerSource ? deviceTemplate.powerSource[0] : null,
          label: deviceTemplate.label,
          wireMode: deviceTemplate.channels ? '3-wire' : undefined,
        };

        // Check for conflicts with this configuration
        const tempDevices = [...connectedDevices, testDevice];
        conflicts = checkConflicts(tempDevices);

        if (conflicts.length === 0) {
          // No conflict - use this option
          selectedOption = option;
          newDevice = testDevice;
          break;
        }
      }

      // If all options have conflicts, use the first available and warn
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

    // Create node for the device
    const deviceCount = connectedDevices.filter(d => d.plugType === deviceTemplate.plugType).length;
    const yOffset = deviceTemplate.plugType === 'inputs' ? 50 :
      deviceTemplate.plugType === 'communications' ? 350 : 650;

    // Determine node type: battery for power-input, latchingRelay for latching, relay for other outputs, sensor for others
    const isPowerInput = deviceTemplate.type === 'power-input';
    const getNodeType = () => {
      if (isPowerInput) return 'battery';
      if (deviceTemplate.type === 'latching') return 'latchingRelay';
      if (deviceTemplate.plugType === 'outputs') return 'relay';
      return 'sensor';
    };

    // Power input nodes shifted 15px left
    const xOffset = isPowerInput ? 385 : 400;

    const newNode = {
      id: newDevice.id,
      type: getNodeType(),
      position: { x: xOffset + (deviceCount * 50), y: yOffset + (deviceCount * 30) },
      data: {
        label: newDevice.label,
        sensorType: newDevice.type,
        terminals: getDeviceTerminals(newDevice),
      },
    };

    setNodes((prev) => [...prev, newNode]);

    // Create edges
    const newEdges = createEdgesForDevice(newDevice);
    setEdges((prev) => [...prev, ...newEdges]);
  }, [connectedDevices, checkConflicts, setNodes, setEdges]);

  // Remove a device
  const removeDevice = useCallback((deviceId) => {
    setConnectedDevices((prev) => {
      const updated = prev.filter(d => d.id !== deviceId);
      // Recheck conflicts after removal
      checkConflicts(updated);
      return updated;
    });
    setNodes((prev) => prev.filter(n => n.id !== deviceId));
    setEdges((prev) => prev.filter(e => e.target !== deviceId && e.source !== deviceId));
    if (selectedDevice?.id === deviceId) {
      setSelectedDevice(null);
    }
  }, [selectedDevice, setNodes, setEdges, checkConflicts]);

  // Update device configuration
  const updateDevice = useCallback((deviceId, updates) => {
    setConnectedDevices((prev) => {
      const updated = prev.map(d => d.id === deviceId ? { ...d, ...updates } : d);
      checkConflicts(updated);
      return updated;
    });

    // Update node and edges
    const device = connectedDevices.find(d => d.id === deviceId);
    if (device) {
      const updatedDevice = { ...device, ...updates };

      // Update selected device if it's the one being modified
      if (selectedDevice && selectedDevice.id === deviceId) {
        setSelectedDevice(updatedDevice);
      }

      setNodes((prev) => prev.map(n =>
        n.id === deviceId
          ? {
            ...n,
            data: {
              ...n.data,
              label: updatedDevice.label, // Update label on node
              terminals: getDeviceTerminals(updatedDevice)
            }
          }
          : n
      ));

      // Recreate edges
      setEdges((prev) => {
        // Remove edges where device is source OR target (handles power input which is source)
        const withoutDeviceEdges = prev.filter(e => e.target !== deviceId && e.source !== deviceId);
        const newEdges = createEdgesForDevice(updatedDevice);
        return [...withoutDeviceEdges, ...newEdges];
      });
    }
  }, [connectedDevices, checkConflicts, setNodes, setEdges, selectedDevice]);

  // NO_OP: Initialization is handled by the useEffect above
  // useState(() => {
  //   initializeNeoDevices();
  // });

  const onNodeClick = useCallback((event, node) => {
    if (node.id.startsWith('device-')) {
      const device = connectedDevices.find(d => d.id === node.id);
      setSelectedDevice(device);
    }
  }, [connectedDevices]);

  // Custom handler for node changes that also syncs connectedDevices when nodes are deleted
  const handleNodesChange = useCallback((changes) => {
    // First, apply the standard node changes
    onNodesChange(changes);

    // Check for removed nodes (when user deletes a device)
    const removedNodeIds = changes
      .filter(change => change.type === 'remove')
      .map(change => change.id);

    if (removedNodeIds.length > 0) {
      // Filter out system nodes (neo-*) - those shouldn't affect connectedDevices
      const removedDeviceIds = removedNodeIds.filter(id => id.startsWith('device-'));

      if (removedDeviceIds.length > 0) {
        // Remove the deleted devices from connectedDevices
        setConnectedDevices(prev => {
          const updated = prev.filter(d => !removedDeviceIds.includes(d.id));
          return updated;
        });

        // Clear selected device if it was deleted
        if (selectedDevice && removedDeviceIds.includes(selectedDevice.id)) {
          setSelectedDevice(null);
        }

        // Also remove edges connected to deleted nodes
        setEdges(prev => prev.filter(e =>
          !removedDeviceIds.includes(e.source) && !removedDeviceIds.includes(e.target)
        ));
      }
    }
  }, [onNodesChange, setEdges, selectedDevice]);

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
          // Clear existing nodes and edges first
          setNodes([]);
          setEdges([]);

          // Set the loaded devices (add default wireMode for legacy devices)
          const devicesWithWireMode = json.map(d => ({
            ...d,
            wireMode: d.wireMode || (d.channels && d.type !== 'power-input' ? '3-wire' : undefined)
          }));
          setConnectedDevices(devicesWithWireMode);

          // Create nodes and edges for each loaded device
          setTimeout(() => {
            const newNodes = [];
            const newEdges = [];

            devicesWithWireMode.forEach((device, index) => {
              const deviceCount = index;
              const yOffset = device.plugType === 'inputs' ? 50 :
                device.plugType === 'communications' ? 350 : 650;

              // Determine node type
              const isPowerInput = device.type === 'power-input';
              const getNodeType = () => {
                if (isPowerInput) return 'battery';
                if (device.type === 'latching') return 'latchingRelay';
                if (device.plugType === 'outputs') return 'relay';
                return 'sensor';
              };

              // Power input nodes shifted 15px left
              const xOffset = isPowerInput ? 385 : 400;

              const newNode = {
                id: device.id,
                type: getNodeType(),
                position: { x: xOffset + (deviceCount * 50), y: yOffset + (deviceCount * 30) },
                data: {
                  label: device.label,
                  sensorType: device.type,
                  terminals: getDeviceTerminals(device),
                },
              };
              newNodes.push(newNode);

              // Create edges for this device
              const deviceEdges = createEdgesForDevice(device);
              newEdges.push(...deviceEdges);
            });

            setNodes(prev => [...prev, ...newNodes]);
            setEdges(prev => [...prev, ...newEdges]);
          }, 0);
        } else {
          alert("Invalid file format: Expected an array of devices.");
        }
      } catch (err) {
        alert("Error parsing JSON file");
      }
    };
    reader.readAsText(file);
    // Reset input value to allow re-uploading same file
    event.target.value = '';
  };

  // Export Wiring Schedule as CSV
  const handleExportCSV = () => {
    // Context-aware pin label generator
    const getPinLabel = (pin, device) => {
      const colorNames = { 1: 'White', 2: 'Brown', 3: 'Green', 4: 'Yellow', 5: 'Grey', 6: 'Pink', 7: 'Blue', 8: 'Red' };
      const color = colorNames[pin] || 'Unknown';

      // Power pins (3, 4) - same for all
      if (pin === 3) return `Pin ${pin} ${color} - Sensor Power Out (Vout+)`;
      if (pin === 4) return `Pin ${pin} ${color} - Sensor GND`;

      // Solar pins (1, 2) - only for power-input
      if (pin === 1) return `Pin ${pin} ${color} - VCC+ (Solar/Supply)`;
      if (pin === 2) return `Pin ${pin} ${color} - GND`;

      // Signal pins (5-8) - context dependent
      if (device.plugType === 'inputs') {
        // Inputs plug: Analog inputs
        const inputMap = { 5: 'Input 4', 6: 'Input 3', 7: 'Input 2', 8: 'Input 1' };
        return `Pin ${pin} ${color} - ${inputMap[pin] || 'Signal'}`;
      } else if (device.plugType === 'outputs') {
        // Outputs plug: Relay outputs
        const outputMap = { 5: 'Output 1 (A1)', 6: 'Output 2 (A2)', 7: 'Output 3 (A3)', 8: 'Output 4 (A4)' };
        return `Pin ${pin} ${color} - ${outputMap[pin] || 'Output'}`;
      } else if (device.plugType === 'communications') {
        // Communications plug: Digital I/O
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

    // Header
    let csvContent = "Device Name,Type,Plug,Connections\n";

    // Rows
    connectedDevices.forEach(device => {
      const pins = getUsedPins(device);
      const connectionStrings = [];

      // For sensors (non-power-input), exclude pins 1 & 2 (solar supply)
      // For power-input, show only pins 1 & 2
      let pinsToShow;
      if (device.type === 'power-input') {
        // Power input: show only pins 1 & 2
        pinsToShow = [1, 2];
      } else {
        // Sensors: show signal pins and power pins (3-8), exclude solar pins 1-2
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

  const getColorName = (pin) => {
    const names = { 1: 'White', 2: 'Brown', 3: 'Green', 4: 'Yellow', 5: 'Grey', 6: 'Pink', 7: 'Blue', 8: 'Red' };
    return names[pin] || 'Unknown';
  };

  // Export diagram as PNG image
  const handleExportImage = useCallback(async () => {
    if (!reactFlowWrapper.current) {
      console.warn('Export: ReactFlow wrapper not found');
      return;
    }

    // Store elements that need to be hidden/restored
    const elementsToRestore = [];

    try {
      const { toSvg } = await import('html-to-image');
      const container = reactFlowWrapper.current;

      // Elements to hide during capture
      const selectorsToHide = [
        '.diagram-actions',
        '.conflict-warning',
        '.react-flow__controls',
        '.react-flow__minimap',
        '.react-flow__attribution',
      ];

      // Hide elements and store original display values
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

      // Get current theme background color
      const isDarkTheme = document.body.getAttribute('data-theme') !== 'light';
      const bgColor = isDarkTheme ? '#0a0a0f' : '#f5f5f7';

      // Get the viewport element that contains the actual diagram content
      const reactFlowEl = container.querySelector('.react-flow');
      const viewportEl = container.querySelector('.react-flow__viewport');

      if (!reactFlowEl || !viewportEl) {
        throw new Error('ReactFlow elements not found');
      }

      // Calculate the bounds of all visible content
      // Get all node elements and find their bounding box
      const nodeElements = container.querySelectorAll('.react-flow__node');
      const edgeElements = container.querySelectorAll('.react-flow__edge');

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      // Get transform info from viewport
      const transform = viewportEl.style.transform;
      let offsetX = 0, offsetY = 0, scale = 1;
      const transformMatch = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([\d.]+)\)/);
      if (transformMatch) {
        offsetX = parseFloat(transformMatch[1]);
        offsetY = parseFloat(transformMatch[2]);
        scale = parseFloat(transformMatch[3]);
      }

      // Calculate bounds from nodes
      nodeElements.forEach(node => {
        const rect = node.getBoundingClientRect();
        const containerRect = reactFlowEl.getBoundingClientRect();

        // Get position relative to the container
        const x = (rect.left - containerRect.left);
        const y = (rect.top - containerRect.top);
        const width = rect.width;
        const height = rect.height;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      });

      // Add padding
      const padding = 50;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = maxX + padding;
      maxY = maxY + padding;

      // Use the full container dimensions to capture everything
      const captureWidth = reactFlowEl.offsetWidth;
      const captureHeight = reactFlowEl.offsetHeight;

      // Wait for UI to update
      await new Promise(resolve => setTimeout(resolve, 300));

      // Capture the SVG - edges naturally render under nodes in React Flow
      // The stacking order is preserved in the export
      const svgDataUrl = await toSvg(reactFlowEl, {
        backgroundColor: bgColor,
        width: captureWidth,
        height: captureHeight,
        pixelRatio: 2,
        style: {
          overflow: 'visible',
        },
        filter: (node) => {
          // Exclude controls and hidden elements
          if (node.classList) {
            if (node.classList.contains('react-flow__controls')) return false;
            if (node.classList.contains('react-flow__minimap')) return false;
            if (node.classList.contains('react-flow__attribution')) return false;
          }
          return true;
        }
      });

      // Convert SVG to PNG
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = svgDataUrl;
      });

      // Create canvas
      const canvas = document.createElement('canvas');
      const outputScale = 2;
      canvas.width = captureWidth * outputScale;
      canvas.height = captureHeight * outputScale;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Download as PNG
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
      // Always restore hidden elements
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

      // Hide UI elements and grid during capture
      const selectorsToHide = ['.diagram-actions', '.conflict-warning', '.react-flow__controls', '.react-flow__minimap', '.react-flow__attribution'];
      const elementsToRestore = [];
      
      selectorsToHide.forEach(selector => {
        const el = container.querySelector(selector);
        if (el) {
          elementsToRestore.push({ element: el, originalDisplay: el.style.display });
          el.style.display = 'none';
        }
      });

      // Hide the grid/background dots
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

      // Find bounds of all nodes using React Flow's internal positioning
      const nodes = reactFlowWrapper.current.querySelectorAll('.react-flow__node');
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      nodes.forEach(node => {
        // Parse the style attribute for transform
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
      
      // Default to container size if no nodes found
      if (minX === Infinity) {
        minX = 0;
        minY = 0;
        maxX = reactFlowEl.offsetWidth;
        maxY = reactFlowEl.offsetHeight;
      }
      
      // Add padding
      const padding = 80;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = maxX + padding;
      maxY = maxY + padding;
      
      // Capture dimensions
      const captureWidth = maxX;
      const captureHeight = maxY;

      // Capture the full diagram
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

      // Restore hidden elements
      elementsToRestore.forEach(({ element, originalDisplay }) => {
        element.style.display = originalDisplay || '';
      });

      // Create PDF in LANDSCAPE orientation
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth(); // 297mm in landscape
      const pageHeight = doc.internal.pageSize.getHeight(); // 210mm in landscape
      const margin = 15;
      const timestamp = new Date().toISOString().slice(0, 10);

      // Header
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setTextColor(0, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('NEO WIRING SYSTEM REPORT', margin, 10);
      doc.setFontSize(10);
      doc.text(`Generated: ${timestamp}`, margin, 16);

      let yPos = 28;

      // Bill of Materials Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('1. BILL OF MATERIALS', margin, yPos);
      yPos += 6;

      // BOM Table
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

      // Connections Section - add new page if needed
      if (yPos > 140) {
        doc.addPage('a4', 'landscape');
        yPos = 15;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2. CONNECTION SCHEDULE', margin, yPos);
      yPos += 6;

      // Connection data
      const connectionData = [];
      connectedDevices.forEach(device => {
        const pins = getUsedPins(device);
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

      // Convert SVG to PNG for PDF with 2x larger canvas
      const svgToPng = async (svgUrl) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            // Make canvas 2x larger to ensure full coverage
            canvas.width = img.width * 2;
            canvas.height = img.height * 2;
            const ctx = canvas.getContext('2d');
            // Fill with white/black background
            ctx.fillStyle = isDarkTheme ? '#000000' : '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Draw image scaled to fit the larger canvas
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = reject;
          img.src = svgUrl;
        });
      };

      const pngDataUrl = await svgToPng(svgDataUrl);

      // Add diagram on a LANDSCAPE page - MAXIMIZE diagram size
      doc.addPage('a4', 'landscape');
      const landscapeWidth = doc.internal.pageSize.getWidth(); // 297mm
      const landscapeHeight = doc.internal.pageSize.getHeight(); // 210mm
      
      // Minimal header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('3. WIRING DIAGRAM', margin, 10);

      // Calculate image dimensions to MAXIMIZE on page
      const headerSpace = 12; // Space for header
      const footerSpace = 8;  // Space for footer
      const availableWidth = landscapeWidth - (margin * 2);
      const availableHeight = landscapeHeight - headerSpace - footerSpace;
      
      const imgAspectRatio = captureWidth / captureHeight;
      const pageAspectRatio = availableWidth / availableHeight;
      
      let finalWidth, finalHeight;
      
      // Maximize the image to fill the page
      if (imgAspectRatio > pageAspectRatio) {
        // Image is wider than page - fit to width
        finalWidth = availableWidth;
        finalHeight = finalWidth / imgAspectRatio;
      } else {
        // Image is taller than page - fit to height
        finalHeight = availableHeight;
        finalWidth = finalHeight * imgAspectRatio;
      }
      
      // Scale to 110% as requested
      finalWidth = finalWidth * 1.1;
      finalHeight = finalHeight * 1.1;
      
      // If scaled image is too big, fit to page
      if (finalWidth > availableWidth) {
        finalWidth = availableWidth;
        finalHeight = finalWidth / imgAspectRatio;
      }
      if (finalHeight > availableHeight) {
        finalHeight = availableHeight;
        finalWidth = finalHeight * imgAspectRatio;
      }
      
      // Center the image on the page
      const xOffset = margin + (availableWidth - finalWidth) / 2;
      const yOffset = headerSpace + (availableHeight - finalHeight) / 2;

      doc.addImage(pngDataUrl, 'PNG', xOffset, yOffset, finalWidth, finalHeight);

      // Footer on all pages
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

      // Save PDF
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
            fitView
            attributionPosition="bottom-left"
          >
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
