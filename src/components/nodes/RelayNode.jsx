import { Handle, Position } from 'reactflow';

export const RelayNode = ({ data }) => {
  const { relayType, terminals } = data;

  return (
    <div className="relay-node">
      <div className="node-header">
        <h4>{relayType === 'transistor' ? 'Device' : 'Relay'}</h4>
      </div>
      <svg width="200" height="180" viewBox="0 0 200 180">
        {/* Relay body - Clean dark background */}
        <rect x="20" y="20" width="160" height="140" rx="4" fill="#1a1a2e" stroke="#00a896" strokeWidth="2" />

        {/* Terminal connectors - only A1 and A2 on left side (swapped positions) */}
        {terminals && terminals.map((terminal, idx) => {
          const positions = [
            { x: 0, y: 50 },   // Top (A2)
            { x: 0, y: 90 }    // Bottom (A1)
          ];

          const pos = positions[idx] || { x: 0, y: 50 };

          return (
            <g key={idx}>
              {/* Terminal Label removed - moved to cable */}
            </g>
          );
        })}

        {/* Coil symbol or Type indicator */}
        <rect x="80" y="60" width="40" height="40" rx="2" fill="none" stroke="#00a896" strokeWidth="1" strokeDasharray="4 2" />
        <line x1="80" y1="80" x2="120" y2="80" stroke="#00a896" strokeWidth="1" />

        {/* Relay type indicator - centered at bottom */}
        <text x="100" y="140" fill="#00a896" fontSize="11" fontWeight="400" textAnchor="middle" opacity="0.8">
          {relayType === 'latching' ? 'Latching Type' : relayType === 'transistor' ? 'Transistor Type' : 'Standard Type'}
        </text>
      </svg>

      {/* React Flow Handles */}
      {terminals && terminals.map((terminal, idx) => {
        const positions = [
          { x: 15, y: 50 },   // Top
          { x: 15, y: 90 }    // Bottom
        ];

        const pos = positions[idx] || { x: 15, y: 50 };

        return (
          <Handle
            key={idx}
            type="target"
            position={Position.Left}
            id={terminal.id}
            style={{
              left: pos.x,
              top: pos.y,
              backgroundColor: terminal.color,
              border: '2px solid #1a1a2e',
              width: '10px',
              height: '10px'
            }}
          />
        );
      })}
    </div>
  );
};
