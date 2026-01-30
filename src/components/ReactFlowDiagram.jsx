import { useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap, MarkerType, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { NeoDeviceNode } from './nodes/NeoDeviceNode';
import { SensorNode } from './nodes/SensorNode';
import { RelayNode } from './nodes/RelayNode';
import { ColoredWireEdge } from './edges/ColoredWireEdge';
import { colorMap } from '../data/plugData';

const nodeTypes = {
  neoDevice: NeoDeviceNode,
  sensor: SensorNode,
  relay: RelayNode,
};

const edgeTypes = {
  coloredWire: ColoredWireEdge,
};

export const ReactFlowDiagram = ({ plugType, typeData, outputNumber, channelNumber, wireMode }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!typeData || !plugType) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const generateNodesAndEdges = () => {
      const newNodes = [];
      const newEdges = [];
      let nodeId = 1;
      let edgeId = 1;

      // Add Neo device node(s)
      let neoNode = {
        id: 'neo',
        type: 'neoDevice',
        position: { x: 100, y: 100 },
        data: {
          label: 'Neo Device',
          outputs: []
        },
      };

      // Second neo node for pulse counter (communications plug)
      let neoCommsNode = null;

      // Add external device node
      let deviceNode = null;

      if (typeData.value === 'power-input') {
        // Power input - simple two-wire connection (arrows point INTO neo)
        neoNode.data.outputs = []; // Neo is the target, so no outputs needed

        deviceNode = {
          id: 'device',
          type: 'sensor',
          position: { x: 700, y: 100 },
          data: {
            label: 'Power Supply',
            sensorType: 'power-input',
            terminals: [
              { id: 'vcc+', name: 'VCC+', color: colorMap.white },
              { id: 'gnd', name: 'GND', color: colorMap.brown }
            ]
          },
        };

        // Add power input edges (arrows point INTO neo device)
        newEdges.push({
          id: `e-${edgeId++}`,
          source: 'device',
          target: 'neo',
          sourceHandle: 'vcc+',
          targetHandle: 'vcc',
          type: 'coloredWire',
          data: { label: 'VCC+ (Pin 1)', color: colorMap.white },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: colorMap.white,
          },
        });

        newEdges.push({
          id: `e-${edgeId++}`,
          source: 'device',
          target: 'neo',
          sourceHandle: 'gnd',
          targetHandle: 'gnd',
          type: 'coloredWire',
          data: { label: 'GND (Pin 2)', color: colorMap.brown },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: colorMap.brown,
          },
        });
      } else if (plugType === 'outputs') {
        // For outputs, create relay node with A1 and A2 terminals
        const outputNum = parseInt(outputNumber) || 1;

        // Map output numbers to colors (Output 1=Grey/Pin5, 2=Pink/Pin6, 3=Blue/Pin7, 4=Red/Pin8)
        const outputMap = {
          '1': { color: 'grey', pin: 5, terminal: 'A1' },
          '2': { color: 'pink', pin: 6, terminal: 'A2' },
          '3': { color: 'blue', pin: 7, terminal: 'A3' },
          '4': { color: 'red', pin: 8, terminal: 'A4' }
        };

        // Check if this is a latching relay (needs 2 outputs)
        const isLatching = typeData.value === 'latching';

        // For latching relays, Output 1 uses outputs 1+2, Output 3 uses outputs 3+4
        const latchingOutputs = isLatching && (outputNum === 1 || outputNum === 3);
        const output1 = outputMap[outputNum];
        const output2 = isLatching && outputNum === 1 ? outputMap['2'] : isLatching && outputNum === 3 ? outputMap['4'] : null;

        // Update Neo node with ground and selected output(s)
        neoNode.data.outputs = [
          { id: 'gnd', color: colorMap.yellow }  // Yellow - Pin 4 - Ground to relay
        ];

        // Add single output or latching outputs
        if (latchingOutputs) {
          neoNode.data.outputs.push(
            { id: 'output1', color: colorMap[output1.color] },
            { id: 'output2', color: colorMap[output2.color] }
          );
        } else {
          neoNode.data.outputs.push(
            { id: 'output', color: colorMap[output1.color] }
          );
        }

        // Create relay node with A1 and A2 terminals
        const terminals = [];

        if (latchingOutputs) {
          // Latching relay: two outputs to A1 and A2 (swap positions for latching)
          terminals.push(
            { id: 'a2', name: 'A2', color: colorMap[output2.color] },   // Output 2/4 to top (A2)
            { id: 'a1', name: 'A1', color: colorMap[output1.color] }  // Output 1/3 to bottom (A1)
          );
        } else {
          // Standard relay: one output and ground
          terminals.push(
            { id: 'a2', name: 'A2', color: colorMap.yellow },         // Ground to top (A2)
            { id: 'a1', name: 'A1', color: colorMap[output1.color] }  // Selected output to bottom (A1)
          );
        }

        deviceNode = {
          id: 'device',
          type: 'relay',
          position: { x: 700, y: 100 }, // Increased spacing
          data: {
            label: typeData.value === 'transistor' ? 'Device' : 'Relay',
            relayType: typeData.value,
            outputNumber: outputNum,
            terminals: terminals
          },
        };

        if (latchingOutputs) {
          // Latching relay: show both output wires (swapped for latching)
          // A2 is at top, A1 is at bottom for latching
          newEdges.push({
            id: `e-${edgeId++}`,
            source: 'neo',
            target: 'device',
            sourceHandle: 'output2',
            targetHandle: 'a2',
            type: 'coloredWire',
            data: { label: `${output2.terminal} (Out ${outputNum === 1 ? '2' : '4'})`, color: colorMap[output2.color] },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colorMap[output2.color],
            },
          });

          newEdges.push({
            id: `e-${edgeId++}`,
            source: 'neo',
            target: 'device',
            sourceHandle: 'output1',
            targetHandle: 'a1',
            type: 'coloredWire',
            data: { label: `${output1.terminal} (Out ${outputNum})`, color: colorMap[output1.color] },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colorMap[output1.color],
            },
          });

          // No ground wire for latching
        } else {
          // Standard relay: show ground and single output wire
          newEdges.push({
            id: `e-${edgeId++}`,
            source: 'neo',
            target: 'device',
            sourceHandle: 'gnd',
            targetHandle: 'a2',
            type: 'coloredWire',
            data: { label: 'GND (Pin 4)', color: colorMap.yellow },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colorMap.yellow,
            },
          });

          newEdges.push({
            id: `e-${edgeId++}`,
            source: 'neo',
            target: 'device',
            sourceHandle: 'output',
            targetHandle: 'a1',
            type: 'coloredWire',
            data: { label: `A${outputNum} (Out ${outputNum})`, color: colorMap[output1.color] },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colorMap[output1.color],
            },
          });
        }

      } else if (typeData.value === 'power-input') {
        // Power input - simple two-wire connection (arrows point INTO neo)
        neoNode.data.outputs = []; // Neo is the target

        deviceNode = {
          id: 'device',
          type: 'sensor',
          position: { x: 700, y: 100 },
          data: {
            label: 'Power Supply',
            sensorType: 'power-input',
            terminals: [
              { id: 'vcc+', name: 'VCC+', color: colorMap.white },
              { id: 'gnd', name: 'GND', color: colorMap.brown }
            ]
          },
        };

        // Add power input edges (arrows point INTO neo device)
        newEdges.push({
          id: `e-${edgeId++}`,
          source: 'device',
          target: 'neo',
          sourceHandle: 'vcc+',
          targetHandle: 'vcc',
          type: 'coloredWire',
          data: { label: 'VCC+ (Pin 1)', color: colorMap.white },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: colorMap.white,
          },
        });

        newEdges.push({
          id: `e-${edgeId++}`,
          source: 'device',
          target: 'neo',
          sourceHandle: 'gnd',
          targetHandle: 'gnd',
          type: 'coloredWire',
          data: { label: 'GND (Pin 2)', color: colorMap.brown },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: colorMap.brown,
          },
        });
      } else if (plugType === 'inputs') {
        // For inputs, create sensor node with selected channel
        const channelNum = parseInt(channelNumber) || 1;

        // Map channel numbers to pins (opposite order: 1=Red, 2=Blue, 3=Pink, 4=Grey)
        const channelMap = {
          '1': { pin: 8, color: colorMap.red, name: 'Analog Input 1' },
          '2': { pin: 7, color: colorMap.blue, name: 'Analog Input 2' },
          '3': { pin: 6, color: colorMap.pink, name: 'Analog Input 3' },
          '4': { pin: 5, color: colorMap.grey, name: 'Analog Input 4' }
        };

        const channel = channelMap[channelNum];

        if (!channel) return { nodes: [], edges: [] };

        // Only include the selected channel
        const is3Wire = wireMode === '3-wire';
        neoNode.data.outputs = [
          { id: 'signal', color: channel.color },
          { id: 'power', color: colorMap.green },
          ...(is3Wire ? [{ id: 'gnd', color: colorMap.yellow }] : [])
        ];

        // Create sensor node with selected channel
        const terminals = [
          { id: 'signal', name: 'Signal', color: channel.color },
          { id: 'power+', name: 'Power+', color: colorMap.green }
        ];
        if (is3Wire) {
          terminals.push({ id: 'gnd', name: 'GND', color: colorMap.yellow });
        }

        deviceNode = {
          id: 'device',
          type: 'sensor',
          position: { x: 700, y: 100 }, // Increased spacing
          data: {
            label: `${typeData.label} Sensor`,
            sensorType: typeData.value,
            terminals: terminals,
            channel: channelNum
          },
        };

        // Add edges (wires) - only for the selected channel
        newEdges.push({
          id: `e-${edgeId++}`,
          source: 'neo',
          target: 'device',
          sourceHandle: 'signal',
          targetHandle: 'signal',
          type: 'coloredWire',
          data: { label: `Signal`, color: channel.color }, // Simplified label
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: channel.color,
          },
        });

        newEdges.push({
          id: `e-${edgeId++}`,
          source: 'neo',
          target: 'device',
          sourceHandle: 'power',
          targetHandle: 'power+',
          type: 'coloredWire',
          data: { label: 'Power', color: colorMap.green }, // Simplified label
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: colorMap.green,
          },
        });

        // Only add GND edge for 3-wire mode
        if (is3Wire) {
          newEdges.push({
            id: `e-${edgeId++}`,
            source: 'neo',
            target: 'device',
            sourceHandle: 'gnd',
            targetHandle: 'gnd',
            type: 'coloredWire',
            data: { label: 'GND', color: colorMap.yellow }, // Simplified label
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colorMap.yellow,
            },
          });
        }

      } else if (plugType === 'communications') {
        // For communications, create simplified device node
        
        if (typeData.value === 'power-input') {
          // Power input - simple two-wire connection (arrows point INTO neo)
          neoNode.data.outputs = []; // Neo is the target

          deviceNode = {
            id: 'device',
            type: 'sensor',
            position: { x: 700, y: 100 },
            data: {
              label: 'Power Supply',
              sensorType: 'power-input',
              terminals: [
                { id: 'vcc+', name: 'VCC+', color: colorMap.white },
                { id: 'gnd', name: 'GND', color: colorMap.brown }
              ]
            },
          };

          // Add power input edges (arrows point INTO neo device)
          newEdges.push({
            id: `e-${edgeId++}`,
            source: 'device',
            target: 'neo',
            sourceHandle: 'vcc+',
            targetHandle: 'vcc',
            type: 'coloredWire',
            data: { label: 'VCC+ (Pin 1)', color: colorMap.white },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colorMap.white,
            },
          });

          newEdges.push({
            id: `e-${edgeId++}`,
            source: 'device',
            target: 'neo',
            sourceHandle: 'gnd',
            targetHandle: 'gnd',
            type: 'coloredWire',
            data: { label: 'GND (Pin 2)', color: colorMap.brown },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colorMap.brown,
            },
          });
        } else {
          // Other communication types
          neoNode.data.outputs = [];
          let deviceTerminals = [];

          if (typeData.value === 'rs485') {
          neoNode.data.outputs = [
            { id: 'b', color: colorMap.green },
            { id: 'a', color: colorMap.yellow }
          ];
          deviceTerminals = [
            { id: 'b', name: 'B', color: colorMap.green },
            { id: 'a', name: 'A', color: colorMap.yellow }
          ];
        } else if (typeData.value === 'wiegand') {
          // Wiegand uses Digital Inputs: Pin 6 (Pink) = D0, Pin 5 (Grey) = D1
          neoNode.data.outputs = [
            { id: 'd0', color: colorMap.pink },
            { id: 'd1', color: colorMap.grey }
          ];
          deviceTerminals = [
            { id: 'd0', name: 'D0', color: colorMap.pink },
            { id: 'd1', name: 'D1', color: colorMap.grey }
          ];
        } else if (typeData.value === 'sdi12') {
          neoNode.data.outputs = [
            { id: 'data', color: colorMap.blue },
            { id: 'gnd', color: colorMap.red }
          ];
          deviceTerminals = [
            { id: 'data', name: 'Data', color: colorMap.blue },
            { id: 'gnd', name: 'GND', color: colorMap.red }
          ];
        } else if (typeData.value === 'pulse') {
          // Pulse Counter uses Digital Input 1 (Pin 6 - Pink) for signal from Communications plug
          // Powered by Pin 3 (Green) and Pin 4 (Yellow) from Inputs plug

          // Communications plug node (Middle Top) - for signal
          neoNode.data.label = 'Neo Device (Communications)';
          neoNode.position = { x: 350, y: 50 };
          neoNode.data.outputs = [
            { id: 'signal', color: colorMap.pink }
          ];

          // Inputs plug node (Left Bottom) - for power and ground
          neoCommsNode = {
            id: 'neo-inputs',
            type: 'neoDevice',
            position: { x: 0, y: 250 },
            data: {
              label: 'Neo Device (Inputs)',
              outputs: [
                { id: 'power', color: colorMap.green },
                { id: 'gnd', color: colorMap.yellow }
              ]
            },
          };

          deviceTerminals = [
            { id: 'signal', name: 'Signal', color: colorMap.pink },
            { id: 'power', name: 'Power+', color: colorMap.green },
            { id: 'gnd', name: 'GND', color: colorMap.yellow }
          ];
        }

        // Create communication device node (generic)
        deviceNode = {
          id: 'device',
          type: 'sensor', // Reusing sensor node for simplicity
          position: { x: 800, y: typeData.value === 'pulse' ? 200 : 100 }, // Adjusted for Pulse alignment
          data: {
            label: `${typeData.label} Device`,
            sensorType: typeData.value,
            terminals: deviceTerminals
          },
        };

        // Add edges based on type
        if (typeData.value === 'rs485' || typeData.value === 'wiegand') {
          newEdges.push({
            id: `e-${edgeId++}`,
            source: 'neo',
            target: 'device',
            sourceHandle: neoNode.data.outputs[0].id,
            targetHandle: deviceTerminals[0].id,
            type: 'coloredWire',
            data: { label: deviceTerminals[0].name, color: deviceTerminals[0].color },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: deviceTerminals[0].color,
            },
          });

          if (deviceTerminals[1]) {
            newEdges.push({
              id: `e-${edgeId++}`,
              source: 'neo',
              target: 'device',
              sourceHandle: neoNode.data.outputs[1].id,
              targetHandle: deviceTerminals[1].id,
              type: 'coloredWire',
              data: { label: deviceTerminals[1].name, color: deviceTerminals[1].color },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: deviceTerminals[1].color,
              },
            });
          }
        } else if (typeData.value === 'sdi12') {
          newEdges.push({
            id: `e-${edgeId++}`,
            source: 'neo',
            target: 'device',
            sourceHandle: 'data',
            targetHandle: 'data',
            type: 'coloredWire',
            data: { label: 'Data', color: colorMap.blue },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colorMap.blue,
            },
          });

          newEdges.push({
            id: `e-${edgeId++}`,
            source: 'neo',
            target: 'device',
            sourceHandle: 'gnd',
            targetHandle: 'gnd',
            type: 'coloredWire',
            data: { label: 'GND', color: colorMap.red },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colorMap.red,
            },
          });
        } else if (typeData.value === 'pulse') {
          // Pulse counter: Signal from Communications plug (neo), Power/GND from Inputs plug (neo-inputs)
          newEdges.push({
            id: `e-${edgeId++}`,
            source: 'neo',
            target: 'device',
            sourceHandle: 'signal',
            targetHandle: 'signal',
            type: 'coloredWire',
            data: { label: 'Signal (DI1)', color: colorMap.pink },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colorMap.pink,
            },
          });

          newEdges.push({
            id: `e-${edgeId++}`,
            source: 'neo-inputs',
            target: 'device',
            sourceHandle: 'power',
            targetHandle: 'power',
            type: 'coloredWire',
            data: { label: 'Power', color: colorMap.green },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colorMap.green,
            },
          });

          newEdges.push({
            id: `e-${edgeId++}`,
            source: 'neo-inputs',
            target: 'device',
            sourceHandle: 'gnd',
            targetHandle: 'gnd',
            type: 'coloredWire',
            data: { label: 'GND', color: colorMap.yellow },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: colorMap.yellow,
            },
          });
        }
        }
      }

      newNodes.push(neoNode);
      if (neoCommsNode) {
        newNodes.push(neoCommsNode);
      }
      if (deviceNode) {
        newNodes.push(deviceNode);
      }

      return { newNodes, newEdges };
    };

    const { newNodes, newEdges } = generateNodesAndEdges();
    setNodes(newNodes);
    setEdges(newEdges);

  }, [plugType, typeData, outputNumber, channelNumber, wireMode, setNodes, setEdges]); // Rerun when configuration changes

  if (!typeData || !plugType) {
    return (
      <div className="reactflow-placeholder">
        <p>Select a plug type and configuration to view interactive wiring diagram</p>
      </div>
    );
  }

  return (
    <div className="reactflow-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#2a2a3a" gap={16} />
        <Controls
          style={{
            backgroundColor: 'rgba(10, 10, 10, 0.8)',
            borderColor: '#00a896',
            color: '#e0e0e0'
          }}
        />
        <MiniMap
          nodeColor={() => '#1a1a2e'}
          nodeStrokeColor={() => '#00a896'}
          style={{
            backgroundColor: 'rgba(10, 10, 10, 0.8)',
            borderColor: '#00a896',
            width: 120,
            height: 90
          }}
        />
      </ReactFlow>
    </div>
  );
};
