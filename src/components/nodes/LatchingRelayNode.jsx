import { Handle, Position } from 'reactflow';

export const LatchingRelayNode = ({ data }) => {
  const { outputNumber, terminals } = data;

  return (
    <div className="relay-node">
      <div className="node-header">
        <h4>Latching</h4>
      </div>
      <svg width="200" height="180" viewBox="0 0 200 180">
        {/* Relay body - Clean dark background */}
        <rect x="20" y="20" width="160" height="140" rx="4" fill="#1a1a2e" stroke="#00a896" strokeWidth="2" />

        {/* Latching relay symbol - two coils */}
        <rect x="70" y="50" width="60" height="30" rx="2" fill="none" stroke="#00a896" strokeWidth="1.5" />
        <text x="100" y="70" fill="#00a896" fontSize="10" fontWeight="500" textAnchor="middle">SET</text>
        
        <rect x="70" y="90" width="60" height="30" rx="2" fill="none" stroke="#00a896" strokeWidth="1.5" />
        <text x="100" y="110" fill="#00a896" fontSize="10" fontWeight="500" textAnchor="middle">RESET</text>

        {/* Latching indicator */}
        <text x="100" y="145" fill="#00a896" fontSize="10" fontWeight="400" textAnchor="middle" opacity="0.8">
          Latching Type
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
