import { useState, useCallback, useMemo, useEffect } from 'react';
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
import { NeoDeviceNode } from '../components/nodes/NeoDeviceNode';
import { SensorNode } from '../components/nodes/SensorNode';
import { RelayNode } from '../components/nodes/RelayNode';
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
      const channelPins = {
        1: { signal: [8], power: [3, 4] }, // Signal (Red/Pin8), Power (Green/Pin3), GND (Yellow/Pin4)
        2: { signal: [7], power: [3, 4] }, // Signal (Blue/Pin7), Power, GND
        3: { signal: [6], power: [3, 4] }, // Signal (Pink/Pin6), Power, GND
        4: { signal: [5], power: [3, 4] }, // Signal (Grey/Pin5), Power, GND
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

export const SystemWiring = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [pinConflicts, setPinConflicts] = useState([]);

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
  const checkConflicts = useCallback((devices) => {
    const signalPinUsage = {}; // Track by plugType -> pin -> device
    const powerPinUsage = {};  // Track power pins globally (shared bus)
    const conflicts = [];

    devices.forEach(device => {
      const usedPins = getUsedPins(device);

      // Check signal pins - these are per plug type
      usedPins.signalPins.forEach(pin => {
        const key = `${device.plugType}-${pin}`;
        if (signalPinUsage[key]) {
          conflicts.push({
            pin,
            plugType: device.plugType,
            type: 'signal',
            devices: [signalPinUsage[key].id, device.id],
          });
        } else {
          signalPinUsage[key] = device;
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

  // Add a new device
  const addDevice = useCallback((deviceTemplate) => {
    // Find next available channel/output/input
    const nextAvailable = findNextAvailable(deviceTemplate, connectedDevices);

    const newDevice = {
      id: `device-${Date.now()}`,
      ...deviceTemplate,
      channel: deviceTemplate.channels ? nextAvailable : null,
      output: deviceTemplate.outputs ? nextAvailable : null,
      input: deviceTemplate.inputs ? nextAvailable : null,
      powerSource: deviceTemplate.powerSource ? deviceTemplate.powerSource[0] : null,
      label: deviceTemplate.label,
    };

    // Check for conflicts before adding
    const tempDevices = [...connectedDevices, newDevice];
    const conflicts = checkConflicts(tempDevices);

    if (conflicts.length > 0) {
      const conflictPins = conflicts.map(c => `${c.plugType} Pin ${c.pin}`).join(', ');
      alert(`Warning: Pin conflict detected on: ${conflictPins}`);
    }

    setConnectedDevices(tempDevices);

    // Create node for the device
    const deviceCount = connectedDevices.filter(d => d.plugType === deviceTemplate.plugType).length;
    const yOffset = deviceTemplate.plugType === 'inputs' ? 50 :
      deviceTemplate.plugType === 'communications' ? 350 : 650;

    // Determine node type: battery for power-input, relay for outputs, sensor for others
    const getNodeType = () => {
      if (deviceTemplate.type === 'power-input') return 'battery';
      if (deviceTemplate.plugType === 'outputs') return 'relay';
      return 'sensor';
    };

    const newNode = {
      id: newDevice.id,
      type: getNodeType(),
      position: { x: 400 + (deviceCount * 50), y: yOffset + (deviceCount * 30) },
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

  // Get device terminals for node display
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
        terminals.push(
          { id: 'signal', name: 'Signal', color: colorMap[channelColors[device.channel]] },
          { id: 'power+', name: 'Power+', color: colorMap.green },
          { id: 'gnd', name: 'GND', color: colorMap.yellow }
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
        terminals.push(
          { id: 'a1', name: 'A1', color: colorMap[outputColors[0]] },
          { id: 'a2', name: 'A2', color: colorMap[outputColors[1]] }
        );
      } else {
        const outputColors = { 1: 'grey', 2: 'pink', 3: 'blue', 4: 'red' };
        terminals.push(
          { id: 'a1', name: 'A1', color: colorMap[outputColors[device.output]] },
          { id: 'a2', name: 'A2', color: colorMap.yellow }
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

  // Create edges for a device
  const createEdgesForDevice = (device) => {
    const edges = [];
    const edgeId = `e-${device.id}`; // Use stable ID prefix based on device ID

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
          data: { label: 'VCC+ (Pin 1)', color: colorMap.white },
          markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.white },
        });
        edges.push({
          id: `${edgeId}-gnd`,
          source: device.id,
          target: 'neo-inputs',
          sourceHandle: 'gnd',
          targetHandle: 'gnd',
          type: 'coloredWire',
          data: { label: 'GND (Pin 2)', color: colorMap.brown },
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
            data: { label: 'Signal', color: color },
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
          data: { label: 'Power', color: colorMap.green },
          markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.green },
        });
        edges.push({
          id: `${edgeId}-gnd`,
          source: 'neo-inputs',
          target: device.id,
          sourceHandle: 'gnd',
          targetHandle: 'gnd',
          type: 'coloredWire',
          data: { label: 'GND', color: colorMap.yellow },
          markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.yellow },
        });
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
          data: { label: 'VCC+ (Pin 1)', color: colorMap.white },
          markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.white },
        });
        edges.push({
          id: `${edgeId}-gnd`,
          source: device.id,
          target: 'neo-outputs',
          sourceHandle: 'gnd',
          targetHandle: 'gnd',
          type: 'coloredWire',
          data: { label: 'GND (Pin 2)', color: colorMap.brown },
          markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.brown },
        });
      } else if (device.type === 'latching') {
        const outputColors = device.output === 1 ? ['grey', 'pink'] : ['blue', 'red'];
        const pinMap = device.output === 1 ? ['pin-5', 'pin-6'] : ['pin-7', 'pin-8'];

        edges.push({
          id: `${edgeId}-a1`,
          source: 'neo-outputs',
          target: device.id,
          sourceHandle: pinMap[0],
          targetHandle: 'a1',
          type: 'coloredWire',
          data: { label: 'A1', color: colorMap[outputColors[0]] },
          markerEnd: { type: MarkerType.ArrowClosed, color: colorMap[outputColors[0]] },
        });
        edges.push({
          id: `${edgeId}-a2`,
          source: 'neo-outputs',
          target: device.id,
          sourceHandle: pinMap[1],
          targetHandle: 'a2',
          type: 'coloredWire',
          data: { label: 'A2', color: colorMap[outputColors[1]] },
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
            data: { label: `Out ${output}`, color: color },
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
          data: { label: 'GND', color: colorMap.yellow },
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
          data: { label: 'VCC+ (Pin 1)', color: colorMap.white },
          markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.white },
        });
        edges.push({
          id: `${edgeId}-gnd`,
          source: device.id,
          target: 'neo-comms',
          sourceHandle: 'gnd',
          targetHandle: 'gnd',
          type: 'coloredWire',
          data: { label: 'GND (Pin 2)', color: colorMap.brown },
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
          data: { label: 'B', color: colorMap.green },
          markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.green },
        });
        edges.push({
          id: `${edgeId}-a`,
          source: 'neo-comms',
          target: device.id,
          sourceHandle: 'a',
          targetHandle: 'a',
          type: 'coloredWire',
          data: { label: 'A', color: colorMap.yellow },
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
          data: { label: 'D0', color: colorMap.pink },
          markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.pink },
        });
        edges.push({
          id: `${edgeId}-d1`,
          source: 'neo-comms',
          target: device.id,
          sourceHandle: 'd1',
          targetHandle: 'd1',
          type: 'coloredWire',
          data: { label: 'D1', color: colorMap.grey },
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
          data: { label: 'Data', color: colorMap.blue },
          markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.blue },
        });
        edges.push({
          id: `${edgeId}-gnd`,
          source: 'neo-comms',
          target: device.id,
          sourceHandle: 'gnd',
          targetHandle: 'gnd',
          type: 'coloredWire',
          data: { label: 'GND', color: colorMap.red },
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
          data: { label: 'Signal', color: device.input === 2 ? colorMap.grey : colorMap.pink },
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
          data: { label: 'Power', color: colorMap.green },
          markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.green },
        });
        edges.push({
          id: `${edgeId}-gnd`,
          source: 'neo-inputs',
          target: device.id,
          sourceHandle: 'gnd',
          targetHandle: 'gnd',
          type: 'coloredWire',
          data: { label: 'GND', color: colorMap.yellow },
          markerEnd: { type: MarkerType.ArrowClosed, color: colorMap.yellow },
        });
      }
    }

    return edges;
  };

  // Remove a device
  const removeDevice = useCallback((deviceId) => {
    setConnectedDevices((prev) => prev.filter(d => d.id !== deviceId));
    setNodes((prev) => prev.filter(n => n.id !== deviceId));
    setEdges((prev) => prev.filter(e => e.target !== deviceId));
    if (selectedDevice?.id === deviceId) {
      setSelectedDevice(null);
    }
  }, [selectedDevice, setNodes, setEdges]);

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
          
          // Set the loaded devices
          setConnectedDevices(json);
          
          // Create nodes and edges for each loaded device
          setTimeout(() => {
            const newNodes = [];
            const newEdges = [];
            
            json.forEach((device, index) => {
              const deviceCount = index;
              const yOffset = device.plugType === 'inputs' ? 50 :
                device.plugType === 'communications' ? 350 : 650;
              
              // Determine node type
              const getNodeType = () => {
                if (device.type === 'power-input') return 'battery';
                if (device.plugType === 'outputs') return 'relay';
                return 'sensor';
              };
              
              const newNode = {
                id: device.id,
                type: getNodeType(),
                position: { x: 400 + (deviceCount * 50), y: yOffset + (deviceCount * 30) },
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
    // Header
    let csvContent = "Device Name,Type,Plug,Connections\n";

    // Rows
    connectedDevices.forEach(device => {
      const pins = getUsedPins(device);
      const connectionStrings = [];

      // Add signal pins
      pins.signalPins.forEach(pin => {
        const colorName = getColorName(pin); // Need helper or inline map
        connectionStrings.push(`Pin ${pin} (${colorName})`);
      });
      // Add power pins
      pins.powerPins.forEach(pin => {
        const colorName = getColorName(pin);
        connectionStrings.push(`Pin ${pin} (${colorName})`);
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

  return (
    <div className="system-wiring-page">
      <div className="system-layout">
        {/* Left Sidebar - Device Palette */}
        <DevicePalette
          availableDevices={availableDevices}
          onAddDevice={addDevice}
        />

        {/* Center - React Flow Diagram */}
        <div className="diagram-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#2a2a3a" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={() => '#1a1a2e'}
              nodeStrokeColor={() => '#00a896'}
              style={{
                backgroundColor: 'rgba(10, 10, 10, 0.8)',
                borderColor: '#00a896',
              }}
            />

            <div className="diagram-actions" style={{ position: 'absolute', top: 10, right: 10, zIndex: 5, display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSaveDesign}
                className="action-btn"
                title="Save Design (JSON)"
                style={{ padding: '8px 12px', background: '#00a896', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                💾 Save
              </button>
              <button
                onClick={() => document.getElementById('load-design-input').click()}
                className="action-btn"
                title="Load Design (JSON)"
                style={{ padding: '8px 12px', background: '#2a2a3a', color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer' }}
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
                style={{ padding: '8px 12px', background: '#4a4a5a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                📋 Export CSV
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
