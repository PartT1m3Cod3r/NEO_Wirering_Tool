import { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Background,
  ConnectionMode,
  useUpdateNodeInternals,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NeoNetworkNode } from '../components/nodes/NeoNetworkNode';
import { BaseStationNode } from '../components/nodes/BaseStationNode';
import { ColoredWireEdge } from '../components/edges/ColoredWireEdge';
import { RssiRecommendations } from '../components/network/RssiRecommendations';
import { toSvg } from 'html-to-image';
import './NetworkDesigner.css';

// Viewport stays at default position; fit view can be triggered via controls if needed

const nodeTypes = {
  neoNetwork: NeoNetworkNode,
  baseStation: BaseStationNode,
};

const edgeTypes = {
  coloredWire: ColoredWireEdge,
};

// Must live inside <ReactFlow> so it has access to the ReactFlow zustand context.
// Calls updateNodeInternals whenever a node's handle side configuration changes,
// ensuring edge routing updates to match the new handle position.
const NodeInternalsUpdater = ({ nodes }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const prevHandleDataRef = useRef({});

  useEffect(() => {
    nodes.forEach((node) => {
      const key = `${node.data?.handleSide}|${JSON.stringify(node.data?.terminalSides || {})}`;
      if (prevHandleDataRef.current[node.id] !== key) {
        prevHandleDataRef.current[node.id] = key;
        updateNodeInternals(node.id);
      }
    });
  }, [nodes, updateNodeInternals]);

  return null;
};

// Return a color based on link distance in meters
const getDistanceColor = (distance) => {
  if (distance < 100) return '#00FF00';
  if (distance < 300) return '#FFFF00';
  if (distance < 500) return '#FFA500';
  return '#FF0000';
};

// Calculate default position for a new device
const getDefaultPosition = (type, index) => {
  if (type === 'neo') {
    return { x: 100, y: 100 + index * 150 };
  }
  return { x: 400, y: 100 + index * 150 };
};

export const NetworkDesigner = () => {
  const [networkDevices, setNetworkDevices] = useState([]);
  const [networkLinks, setNetworkLinks] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const nodePositionsRef = useRef(new Map());
  const reactFlowWrapper = useRef(null);

  const normalizeHandleId = useCallback((id) => {
    if (!id) return undefined;
    if (id.includes('eth')) return 'eth';
    if (id.includes('wan')) return 'wan';
    return id;
  }, []);

  // Rebuild React Flow nodes and edges together whenever logical state changes
  // This mirrors SystemWiring.jsx's single-effect pattern
  useEffect(() => {
    const neoIndexMap = new Map();
    const baseIndexMap = new Map();

    const newNodes = networkDevices.map((device) => {
      let idx;
      if (device.type === 'neo') {
        idx = neoIndexMap.size;
        neoIndexMap.set(device.id, idx);
      } else {
        idx = baseIndexMap.size;
        baseIndexMap.set(device.id, idx);
      }

      const preservedPos = nodePositionsRef.current.get(device.id);
      const defaultPos = getDefaultPosition(device.type, idx);
      const isNeo = device.type === 'neo';

      return {
        id: device.id,
        type: isNeo ? 'neoNetwork' : 'baseStation',
        position: preservedPos || defaultPos,
        data: {
          label: device.label,
          neoId: device.neoId,
          passphrase: device.passphrase,
          mode: device.mode,
          handleSide: device.handleSide,
          terminalSides: device.terminalSides,
          wifiRssi: device.wifiRssi,
          lteRssi: device.lteRssi,
          type: device.type,
        },
      };
    });

    // Merge with existing nodes to preserve ReactFlow internal state (positions, selection, etc.)
    // This mirrors SystemWiring's approach so handle-side changes propagate to edges correctly
    setNodes((prev) => {
      const prevMap = new Map(prev.map((n) => [n.id, n]));
      return newNodes.map((n) => {
        const existing = prevMap.get(n.id);
        return existing ? { ...existing, data: n.data } : n;
      });
    });

    const newEdges = networkLinks.map((link) => {
      const color = getDistanceColor(link.distance);
      const losLabel = link.los !== false ? '' : ' (NO LOS)';
      return {
        id: link.id,
        source: link.source,
        target: link.target,
        sourceHandle: normalizeHandleId(link.sourceHandle),
        targetHandle: normalizeHandleId(link.targetHandle),
        type: 'coloredWire',
        data: {
          label: `${link.distance}m${losLabel}`,
          color,
          wireNumber: '',
          distance: link.distance,
          los: link.los,
        },
      };
    });

    setEdges(newEdges);
  }, [networkDevices, networkLinks, setNodes, setEdges, normalizeHandleId]);

  // Auto-join NEOs to base stations when passphrases match
  useEffect(() => {
    const neos = networkDevices.filter((d) => d.type === 'neo' && d.passphrase && d.passphrase.trim() !== '');
    const bases = networkDevices.filter((d) => d.type === 'baseStation' && d.passphrase && d.passphrase.trim() !== '');

    if (neos.length === 0 || bases.length === 0) return;

    setNetworkLinks((prev) => {
      const newLinks = [];
      neos.forEach((neo) => {
        bases.forEach((base) => {
          if (neo.passphrase === base.passphrase) {
            const alreadyLinked = prev.some(
              (l) =>
                (l.source === base.id && l.target === neo.id) ||
                (l.source === neo.id && l.target === base.id)
            );
            if (!alreadyLinked) {
              newLinks.push({
                id: `network-link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                source: base.id,
                target: neo.id,
                sourceHandle: 'wan',
                targetHandle: 'eth',
                distance: 100,
                los: true,
              });
            }
          }
        });
      });
      return newLinks.length > 0 ? [...prev, ...newLinks] : prev;
    });
  }, [networkDevices]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const onConnect = useCallback(
    (connection) => {
      const newLink = {
        id: `network-link-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: normalizeHandleId(connection.sourceHandle),
        targetHandle: normalizeHandleId(connection.targetHandle),
        distance: 100,
        los: true,
      };
      setNetworkLinks((prev) => [...prev, newLink]);
    },
    [setNetworkLinks, normalizeHandleId]
  );

  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);

      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          nodePositionsRef.current.set(change.id, change.position);
        }
        if (change.type === 'remove') {
          nodePositionsRef.current.delete(change.id);
          setNetworkDevices((prev) => prev.filter((d) => d.id !== change.id));
          if (selectedNodeId === change.id) {
            setSelectedNodeId(null);
          }
        }
      });
    },
    [onNodesChange, selectedNodeId]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);

      const removedIds = changes
        .filter((change) => change.type === 'remove')
        .map((change) => change.id);

      if (removedIds.length > 0) {
        setNetworkLinks((prev) => prev.filter((l) => !removedIds.includes(l.id)));
        if (selectedEdgeId && removedIds.includes(selectedEdgeId)) {
          setSelectedEdgeId(null);
        }
      }
    },
    [onEdgesChange, selectedEdgeId]
  );

  // Add a new NEO device
  const addNeoDevice = useCallback(() => {
    const nextIndex = networkDevices.filter((d) => d.type === 'neo').length + 1;
    const newDevice = {
      id: `network-node-${Date.now()}`,
      type: 'neo',
      label: `NEO-${nextIndex}`,
      neoId: '',
      passphrase: '',
      handleSide: 'right',
      terminalSides: {},
      wifiRssi: null,
      lteRssi: null,
    };
    setNetworkDevices((prev) => [...prev, newDevice]);
  }, [networkDevices]);

  // Add a new base station
  const addBaseStation = useCallback(() => {
    const nextIndex = networkDevices.filter((d) => d.type === 'baseStation').length + 1;
    const newDevice = {
      id: `network-node-${Date.now()}`,
      type: 'baseStation',
      label: `BASE-${nextIndex}`,
      neoId: '',
      passphrase: '',
      handleSide: 'right',
      terminalSides: {},
      mode: 'wifi',
      wifiRssi: -50,
      lteRssi: -90,
    };
    setNetworkDevices((prev) => [...prev, newDevice]);
  }, [networkDevices]);

  // Update a network device
  const updateDevice = useCallback((deviceId, updates) => {
    setNetworkDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, ...updates } : d))
    );
  }, []);

  // Remove a network device
  const removeDevice = useCallback(
    (deviceId) => {
      nodePositionsRef.current.delete(deviceId);
      setNetworkDevices((prev) => prev.filter((d) => d.id !== deviceId));
      setNetworkLinks((prev) =>
        prev.filter((l) => l.source !== deviceId && l.target !== deviceId)
      );
      if (selectedNodeId === deviceId) {
        setSelectedNodeId(null);
      }
    },
    [selectedNodeId]
  );

  // Update a network link
  const updateLink = useCallback((linkId, updates) => {
    setNetworkLinks((prev) =>
      prev.map((l) => (l.id === linkId ? { ...l, ...updates } : l))
    );
  }, []);

  // Remove a network link
  const removeLink = useCallback(
    (linkId) => {
      setNetworkLinks((prev) => prev.filter((l) => l.id !== linkId));
      if (selectedEdgeId === linkId) {
        setSelectedEdgeId(null);
      }
    },
    [selectedEdgeId]
  );

  // Export Design as JSON
  const handleSaveDesign = () => {
    const data = {
      devices: networkDevices,
      links: networkLinks,
      positions: Object.fromEntries(nodePositionsRef.current),
    };
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'neo_network_design.json');
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
        if (json.devices && Array.isArray(json.devices) && json.links && Array.isArray(json.links)) {
          setNodes([]);
          setEdges([]);
          setNetworkDevices(json.devices);
          setNetworkLinks(json.links);

          if (json.positions) {
            const posMap = new Map(Object.entries(json.positions));
            nodePositionsRef.current = posMap;
          } else {
            nodePositionsRef.current = new Map();
          }
        } else {
          alert('Invalid file format: Expected devices and links arrays.');
        }
      } catch {
        alert('Error parsing JSON file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Export Network Schedule as CSV
  const handleExportCSV = () => {
    let csvContent = 'Device ID,Type,Label,Connections\n';

    networkDevices.forEach((device) => {
      const connected = networkLinks
        .filter((l) => l.source === device.id || l.target === device.id)
        .map((l) => {
          const otherId = l.source === device.id ? l.target : l.source;
          const other = networkDevices.find((d) => d.id === otherId);
          const otherLabel = other ? other.label : otherId;
          return `${otherLabel} (${l.distance}m)`;
        })
        .join('; ');

      csvContent += `"${device.id}","${device.type}","${device.label}","${connected}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'neo_network_schedule.csv');
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
      const container = reactFlowWrapper.current;

      const selectorsToHide = [
        '.network-export-buttons',
        '.react-flow__controls',
        '.react-flow__minimap',
        '.react-flow__attribution',
      ];

      selectorsToHide.forEach((selector) => {
        const el = container.querySelector(selector);
        if (el) {
          elementsToRestore.push({
            element: el,
            originalDisplay: el.style.display,
            originalVisibility: el.style.visibility,
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

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      nodeElements.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const containerRect = reactFlowEl.getBoundingClientRect();

        const x = rect.left - containerRect.left;
        const y = rect.top - containerRect.top;
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

      await new Promise((resolve) => setTimeout(resolve, 300));

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
        },
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
      link.href = dataUrl;
      link.download = 'neo_network_design.png';
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

  const selectedNode = networkDevices.find((d) => d.id === selectedNodeId) || null;
  const selectedEdge = networkLinks.find((l) => l.id === selectedEdgeId) || null;

  return (
    <div className="network-designer-page">
      <div className="network-layout">
        {/* Left Sidebar - Device Palette */}
        <div className="network-palette">
          <h3 style={{ margin: '0 0 12px 0', color: 'var(--accent-color)', fontSize: '0.95rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '8px' }}>
            Network Palette
          </h3>
          <button
            onClick={addNeoDevice}
            className="palette-btn"
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '8px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '12px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
          >
            + NEO Device
          </button>
          <button
            onClick={addBaseStation}
            className="palette-btn"
            style={{
              width: '100%',
              padding: '10px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '12px',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
          >
            + Base Station
          </button>
        </div>

        {/* Center - React Flow Diagram */}
        <div className="network-diagram-container" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            minZoom={0.2}
            maxZoom={2}
            attributionPosition="bottom-left"
          >
            <NodeInternalsUpdater nodes={nodes} />
            <Background />
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

            <div className="network-export-buttons">
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
                  fontWeight: '500',
                }}
              >
                💾 Save
              </button>
              <button
                onClick={() => document.getElementById('load-network-input').click()}
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
                  fontWeight: '500',
                }}
              >
                📂 Load
              </button>
              <input
                type="file"
                id="load-network-input"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleLoadDesign}
              />
              <button
                onClick={handleExportCSV}
                className="action-btn"
                title="Export Network Schedule (CSV)"
                style={{
                  padding: '8px 12px',
                  background: '#4a4a5a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
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
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#9575cd'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#7c4dff'; }}
              >
                🖼️ Export Image
              </button>
            </div>
          </ReactFlow>
        </div>

        {/* Right Sidebar - Configuration */}
        <div className="network-config-sidebar">
          {selectedNode && (
            <div className="config-panel" style={{ padding: '15px', borderBottom: '1px solid var(--border-secondary)' }}>
              <h3 style={{ margin: '0 0 12px 0', color: 'var(--accent-color)', fontSize: '0.95rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '8px' }}>
                Device Config
              </h3>

              <div className="config-section" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase' }}>
                  Label
                </label>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => updateDevice(selectedNode.id, { label: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-primary)',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              {selectedNode.type === 'neo' && (
                <>
                  <div className="config-section" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase' }}>
                      Connection Side
                    </label>
                    <select
                      value={selectedNode.handleSide || 'right'}
                      onChange={(e) => updateDevice(selectedNode.id, { handleSide: e.target.value, terminalSides: {} })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)',
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '0.85rem',
                      }}
                    >
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div className="config-section" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase' }}>
                      NEO ID
                    </label>
                    <input
                      type="text"
                      value={selectedNode.neoId || ''}
                      onChange={(e) => updateDevice(selectedNode.id, { neoId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)',
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                  <div className="config-section" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase' }}>
                      CoreLink Passphrase
                    </label>
                    <input
                      type="text"
                      value={selectedNode.passphrase || ''}
                      onChange={(e) => updateDevice(selectedNode.id, { passphrase: e.target.value })}
                      placeholder="Enter network passphrase"
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)',
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                </>
              )}

              {selectedNode.type === 'baseStation' && (
                <>
                  <div className="config-section" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase' }}>
                      Connection Side
                    </label>
                    <select
                      value={selectedNode.handleSide || 'right'}
                      onChange={(e) => updateDevice(selectedNode.id, { handleSide: e.target.value, terminalSides: {} })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)',
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '0.85rem',
                      }}
                    >
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div className="config-section" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase' }}>
                      Connection Mode
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => updateDevice(selectedNode.id, { mode: 'wifi' })}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: selectedNode.mode === 'wifi' ? 'var(--accent-color)' : 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: selectedNode.mode === 'wifi' ? 'var(--bg-primary)' : 'var(--text-primary)',
                          fontFamily: 'Consolas, Monaco, monospace',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                        }}
                      >
                        WiFi
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDevice(selectedNode.id, { mode: 'lte' })}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: selectedNode.mode === 'lte' ? 'var(--accent-color)' : 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: selectedNode.mode === 'lte' ? 'var(--bg-primary)' : 'var(--text-primary)',
                          fontFamily: 'Consolas, Monaco, monospace',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                        }}
                      >
                        LTE
                      </button>
                    </div>
                  </div>
                  <div className="config-section" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase' }}>
                      CoreLink Passphrase
                    </label>
                    <input
                      type="text"
                      value={selectedNode.passphrase || ''}
                      onChange={(e) => updateDevice(selectedNode.id, { passphrase: e.target.value })}
                      placeholder="Enter network passphrase"
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)',
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                  {selectedNode.mode !== 'lte' && (
                  <div className="config-section" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase' }}>
                      WiFi RSSI (dBm)
                    </label>
                    <input
                      type="number"
                      value={selectedNode.wifiRssi ?? ''}
                      onChange={(e) =>
                        updateDevice(selectedNode.id, { wifiRssi: Number(e.target.value) })
                      }
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)',
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                  )}
                  {selectedNode.mode === 'lte' && (
                  <div className="config-section" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase' }}>
                      LTE RSSI (dBm)
                    </label>
                    <input
                      type="number"
                      value={selectedNode.lteRssi ?? ''}
                      onChange={(e) =>
                        updateDevice(selectedNode.id, { lteRssi: Number(e.target.value) })
                      }
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)',
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                  )}
                </>
              )}

              <div className="config-actions" style={{ marginTop: '15px' }}>
                <button
                  onClick={() => removeDevice(selectedNode.id)}
                  className="btn-remove"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--error-bg)',
                    border: '1px solid var(--error-color)',
                    color: 'var(--error-color)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'Consolas, Monaco, monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--error-color)';
                    e.currentTarget.style.color = 'var(--bg-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--error-bg)';
                    e.currentTarget.style.color = 'var(--error-color)';
                  }}
                >
                  Delete Device
                </button>
              </div>
            </div>
          )}

          {selectedEdge && (
            <div className="config-panel" style={{ padding: '15px', borderBottom: '1px solid var(--border-secondary)' }}>
              <h3 style={{ margin: '0 0 12px 0', color: 'var(--accent-color)', fontSize: '0.95rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '8px' }}>
                Link Config
              </h3>

              <div className="config-section" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase' }}>
                  Distance (m)
                </label>
                <input
                  type="number"
                  value={selectedEdge.distance}
                  onChange={(e) =>
                    updateLink(selectedEdge.id, { distance: Number(e.target.value) })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text-primary)',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div className="config-section" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="los-toggle"
                  checked={selectedEdge.los !== false}
                  onChange={(e) => updateLink(selectedEdge.id, { los: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <label
                  htmlFor="los-toggle"
                  style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'Consolas, Monaco, monospace', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Line of Sight
                </label>
              </div>

              <div className="config-actions" style={{ marginTop: '15px' }}>
                <button
                  onClick={() => removeLink(selectedEdge.id)}
                  className="btn-remove"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--error-bg)',
                    border: '1px solid var(--error-color)',
                    color: 'var(--error-color)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'Consolas, Monaco, monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--error-color)';
                    e.currentTarget.style.color = 'var(--bg-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--error-bg)';
                    e.currentTarget.style.color = 'var(--error-color)';
                  }}
                >
                  Delete Link
                </button>
              </div>
            </div>
          )}

          {!selectedNode && !selectedEdge && (
            <div style={{ padding: '15px', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem', borderBottom: '1px solid var(--border-secondary)' }}>
              Select a device or link to configure
            </div>
          )}

          <div style={{ flex: 1, padding: '15px', overflowY: 'auto' }}>
            <RssiRecommendations nodes={nodes} edges={edges} />
          </div>
        </div>
      </div>
    </div>
  );
};
