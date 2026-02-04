import { Handle, Position } from 'reactflow';

export const NeoDeviceNode = ({ data }) => {
  const { label, outputs } = data;

  // Generate reference designator based on label
  const getRefDes = () => {
    if (label?.includes('Inputs')) return 'J1';
    if (label?.includes('Coms')) return 'J2';
    if (label?.includes('Outputs')) return 'J3';
    return 'J?';
  };

  return (
    <div className="acad-node neo-device-acad">
      {/* Node header with reference designator */}
      <div className="acad-node-header">
        <span className="acad-ref-des">{getRefDes()}</span>
        <span className="acad-device-type">NEO</span>
      </div>

      <div className="acad-node-title" style={{ padding: '4px', fontSize: '10px' }}>
        {label}
      </div>

      {/* M12 Connector - Technical drawing style with more spacing */}
      <div style={{ padding: '8px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <svg width="160" height="140" viewBox="0 0 160 140">
          {/* Connector outline - hexagonal for M12 */}
          <polygon 
            points="80,15 120,38 120,88 80,110 40,88 40,38" 
            fill="var(--bg-primary)" 
            stroke="var(--accent-color)" 
            strokeWidth="2"
          />
          
          {/* Inner circle */}
          <circle 
            cx="80" 
            cy="62" 
            r="40" 
            fill="none" 
            stroke="var(--border-secondary)" 
            strokeWidth="1" 
            strokeDasharray="2 2"
          />

          {/* Keyway indicator */}
          <path 
            d="M 75 17 L 80 21 L 85 17" 
            stroke="var(--accent-color)" 
            strokeWidth="2" 
            fill="none"
          />

          {/* 8 Pins arranged in circle - with proper spacing for labels */}
          
          {/* Pin 1 - White (VCC+) - Top right */}
          <circle cx="110" cy="35" r="6" fill="#FFFFFF" stroke="#000" strokeWidth="0.5"/>
          <text x="110" y="36" dy="1" fontSize="7" textAnchor="middle" fill="#000" fontFamily="Consolas,monospace">1</text>
          <text x="132" y="30" fontSize="8" fill="var(--text-secondary)" fontFamily="Consolas,monospace">WHT</text>

          {/* Pin 2 - Brown (GND) - Right */}
          <circle cx="125" cy="62" r="6" fill="#8B4513" stroke="#000" strokeWidth="0.5"/>
          <text x="125" y="63" dy="1" fontSize="7" textAnchor="middle" fill="#FFF" fontFamily="Consolas,monospace">2</text>
          <text x="138" y="66" fontSize="8" fill="var(--text-secondary)" fontFamily="Consolas,monospace">BRN</text>

          {/* Pin 3 - Green (Vout+) - Bottom right */}
          <circle cx="110" cy="89" r="6" fill="#00AA00" stroke="#000" strokeWidth="0.5"/>
          <text x="110" y="90" dy="1" fontSize="7" textAnchor="middle" fill="#FFF" fontFamily="Consolas,monospace">3</text>
          <text x="132" y="96" fontSize="8" fill="var(--text-secondary)" fontFamily="Consolas,monospace">GRN</text>

          {/* Pin 4 - Yellow (GND) - Bottom */}
          <circle cx="80" cy="100" r="6" fill="#CCCC00" stroke="#000" strokeWidth="0.5"/>
          <text x="80" y="101" dy="1" fontSize="7" textAnchor="middle" fill="#000" fontFamily="Consolas,monospace">4</text>
          <text x="80" y="118" fontSize="8" fill="var(--text-secondary)" fontFamily="Consolas,monospace">YEL</text>

          {/* Pin 5 - Grey (Ch4/Out1) - Bottom left */}
          <circle cx="50" cy="89" r="6" fill="#808080" stroke="#000" strokeWidth="0.5"/>
          <text x="50" y="90" dy="1" fontSize="7" textAnchor="middle" fill="#FFF" fontFamily="Consolas,monospace">5</text>
          <text x="28" y="96" fontSize="8" fill="var(--text-secondary)" fontFamily="Consolas,monospace">GRY</text>

          {/* Pin 6 - Pink (Ch3/Out2) - Left */}
          <circle cx="35" cy="62" r="6" fill="#FF69B4" stroke="#000" strokeWidth="0.5"/>
          <text x="35" y="63" dy="1" fontSize="7" textAnchor="middle" fill="#000" fontFamily="Consolas,monospace">6</text>
          <text x="8" y="66" fontSize="8" fill="var(--text-secondary)" fontFamily="Consolas,monospace">PNK</text>

          {/* Pin 7 - Blue (Ch2/Out3) - Top left */}
          <circle cx="50" cy="35" r="6" fill="#0000FF" stroke="#000" strokeWidth="0.5"/>
          <text x="50" y="36" dy="1" fontSize="7" textAnchor="middle" fill="#FFF" fontFamily="Consolas,monospace">7</text>
          <text x="28" y="30" fontSize="8" fill="var(--text-secondary)" fontFamily="Consolas,monospace">BLU</text>

          {/* Pin 8 - Red (Ch1/Out4) - Center */}
          <circle cx="80" cy="62" r="6" fill="#FF0000" stroke="#000" strokeWidth="0.5"/>
          <text x="80" y="63" dy="1" fontSize="7" textAnchor="middle" fill="#FFF" fontFamily="Consolas,monospace">8</text>
          <text x="80" y="80" fontSize="8" fill="var(--text-secondary)" fontFamily="Consolas,monospace">RED</text>

          {/* Connector type label */}
          <text x="80" y="135" fontSize="9" textAnchor="middle" fill="var(--accent-color)" fontFamily="Consolas,monospace">
            M12-8
          </text>
        </svg>

        {/* React Flow Handles - AutoCAD grip style */}
        
        {/* Target handles (inputs) - for power input connections on RIGHT side */}
        <Handle
          type="target"
          position={Position.Right}
          id="vcc"
          style={{
            top: 42,
            right: -6,
            backgroundColor: '#FFFFFF',
            border: '2px solid var(--accent-color)',
            width: '12px',
            height: '12px'
          }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="gnd"
          style={{
            top: 72,
            right: -6,
            backgroundColor: '#8B4513',
            border: '2px solid var(--accent-color)',
            width: '12px',
            height: '12px'
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
              top: 32 + (idx * 22),
              right: -6,
              backgroundColor: output.color,
              border: '2px solid var(--accent-color)',
              width: '12px',
              height: '12px'
            }}
          />
        ))}
      </div>

      {/* Connection terminal strip */}
      <div style={{ 
        borderTop: '1px solid var(--border-secondary)', 
        padding: '4px 8px',
        fontSize: '9px',
        fontFamily: 'Consolas,monospace',
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>TERM STRIP</span>
        <span>{outputs?.length || 0} CONN</span>
      </div>
    </div>
  );
};
