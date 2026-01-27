import { Handle, Position } from 'reactflow';

export const NeoDeviceNode = ({ data }) => {
  const { label, outputs } = data;

  return (
    <div className="neo-device-node">
      <div className="node-header">
        <h4>{label}</h4>
      </div>
      <div style={{ padding: '10px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* M12 Connector Shell */}
          <circle cx="70" cy="70" r="60" fill="#1a1a2e" stroke="#00a896" strokeWidth="3" />
          <circle cx="70" cy="70" r="50" fill="none" stroke="#2a2a3a" strokeWidth="1" strokeDasharray="4 2" />

          {/* Keyway Notch (approximate for visual reference) */}
          <path d="M 65 14 Q 70 18 75 14" stroke="#00a896" strokeWidth="2" fill="none" />

          {/* 8 Pins (Standard M12-8 Pinout) */}
          {/* 1 - White */}
          <circle cx="95" cy="40" r="6" fill="#FFFFFF" stroke="none" />
          <text x="95" y="40" dy="2" fontSize="5" textAnchor="middle" fill="#000">1</text>

          {/* 2 - Brown */}
          <circle cx="108" cy="65" r="6" fill="#8B4513" stroke="none" />
          <text x="108" y="65" dy="2" fontSize="5" textAnchor="middle" fill="#FFF">2</text>

          {/* 3 - Green */}
          <circle cx="95" cy="90" r="6" fill="#00FF00" stroke="none" />
          <text x="95" y="90" dy="2" fontSize="5" textAnchor="middle" fill="#000">3</text>

          {/* 4 - Yellow */}
          <circle cx="70" cy="100" r="6" fill="#FFFF00" stroke="none" />
          <text x="70" y="100" dy="2" fontSize="5" textAnchor="middle" fill="#000">4</text>

          {/* 5 - Grey */}
          <circle cx="45" cy="90" r="6" fill="#808080" stroke="none" />
          <text x="45" y="90" dy="2" fontSize="5" textAnchor="middle" fill="#FFF">5</text>

          {/* 6 - Pink */}
          <circle cx="32" cy="65" r="6" fill="#FFC0CB" stroke="none" />
          <text x="32" y="65" dy="2" fontSize="5" textAnchor="middle" fill="#000">6</text>

          {/* 7 - Blue */}
          <circle cx="45" cy="40" r="6" fill="#0000FF" stroke="none" />
          <text x="45" y="40" dy="2" fontSize="5" textAnchor="middle" fill="#FFF">7</text>

          {/* 8 - Red (Center-ish) */}
          <circle cx="70" cy="70" r="6" fill="#FF0000" stroke="none" />
          <text x="70" y="70" dy="2" fontSize="5" textAnchor="middle" fill="#FFF">8</text>
        </svg>

        {/* React Flow Handles */}
        
        {/* Target handles (inputs) - for power input connections on RIGHT side */}
        <Handle
          type="target"
          position={Position.Right}
          id="vcc"
          style={{
            top: 40,
            right: -5,
            backgroundColor: '#FFFFFF',
            border: '2px solid #1a1a2e',
            width: '10px',
            height: '10px'
          }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="gnd"
          style={{
            top: 70,
            right: -5,
            backgroundColor: '#8B4513',
            border: '2px solid #1a1a2e',
            width: '10px',
            height: '10px'
          }}
        />
        
        {/* Source handles (outputs) */}
        {outputs && outputs.map((output, idx) => (
          <Handle
            key={idx}
            type="source"
            position={Position.Right}
            id={output.id}
            style={{
              top: 30 + (idx * 20),
              right: -5,
              backgroundColor: output.color,
              border: '2px solid #1a1a2e',
              width: '10px',
              height: '10px'
            }}
          />
        ))}
      </div>
    </div>
  );
};
