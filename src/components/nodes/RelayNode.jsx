import { Handle, Position } from 'reactflow';

export const RelayNode = ({ data }) => {
  const { label, outputNumber, terminals } = data;

  return (
    <div className="relay-node">
      <div className="node-header">
        <h4>{label || 'Relay'}</h4>
      </div>
      <svg width="200" height="180" viewBox="0 0 200 180">
        {/* Relay body - Clean dark background */}
        <rect x="20" y="20" width="160" height="140" rx="4" fill="#1a1a2e" stroke="#00a896" strokeWidth="2" />

        {/* Coil symbol */}
        <rect x="80" y="60" width="40" height="40" rx="2" fill="none" stroke="#00a896" strokeWidth="1" strokeDasharray="4 2" />
        <line x1="80" y1="80" x2="120" y2="80" stroke="#00a896" strokeWidth="1" />

        {/* Relay type indicator - centered at bottom */}
        <text x="100" y="140" fill="#00a896" fontSize="11" fontWeight="400" textAnchor="middle" opacity="0.8">
          Standard Type
        </text>
      </svg>

      {/* React Flow Handles - A2 (top/GND) first, then A1 (bottom/output) */}
      {terminals && terminals.map((terminal, idx) => {
        const topPos = 50 + (idx * 40);
        const handleId = idx === 0 ? 'a2' : 'a1';

        return (
          <Handle
            key={idx}
            type="target"
            position={Position.Left}
            id={handleId}
            style={{
              left: -5,
              top: topPos,
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
