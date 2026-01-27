import { Handle, Position } from 'reactflow';

export const BatteryNode = ({ data }) => {
  const { label } = data;

  return (
    <div className="battery-node">
      <div className="node-header">
        <h4>{label}</h4>
      </div>
      <svg width="160" height="120" viewBox="0 0 160 120">
        {/* Battery body - rounded rectangle */}
        <rect 
          x="30" 
          y="30" 
          width="90" 
          height="60" 
          rx="6" 
          fill="#1a1a2e" 
          stroke="#00a896" 
          strokeWidth="2" 
        />
        
        {/* Battery positive terminal (top) */}
        <rect 
          x="65" 
          y="20" 
          width="20" 
          height="10" 
          fill="#00a896"
        />
        
        {/* Battery negative terminal (bottom) - shorter */}
        <rect 
          x="70" 
          y="90" 
          width="10" 
          height="10" 
          fill="#666"
        />
        
        {/* Battery symbol - plus sign */}
        <text 
          x="75" 
          y="58" 
          fill="#00a896" 
          fontSize="24" 
          fontWeight="700" 
          textAnchor="middle"
        >
          +
        </text>
        
        {/* DC label */}
        <text 
          x="75" 
          y="78" 
          fill="#00a896" 
          fontSize="10" 
          fontWeight="500" 
          textAnchor="middle"
          opacity="0.8"
        >
          DC IN
        </text>
      </svg>

      {/* Source handles - power flows OUT to Neo (on LEFT side) */}
      <Handle
        type="source"
        position={Position.Left}
        id="vcc+"
        style={{
          left: -5,
          top: 45,
          backgroundColor: '#FFFFFF',
          border: '2px solid #1a1a2e',
          width: '10px',
          height: '10px'
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="gnd"
        style={{
          left: -5,
          top: 75,
          backgroundColor: '#8B4513',
          border: '2px solid #1a1a2e',
          width: '10px',
          height: '10px'
        }}
      />
    </div>
  );
};
