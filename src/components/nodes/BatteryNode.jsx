import { Handle, Position } from 'reactflow';

export const BatteryNode = ({ data }) => {
  const { label } = data;

  return (
    <div className="acad-node battery-node-acad">
      {/* Node header with reference designator */}
      <div className="acad-node-header">
        <span className="acad-ref-des">PS1</span>
        <span className="acad-device-type">POWER</span>
      </div>

      <div className="acad-node-body">
        {/* IEC DC Power Source Symbol - shifted right to prevent VCC cutoff */}
        <svg width="160" height="130" viewBox="0 0 160 130">
          {/* Device outline */}
          <rect 
            x="45" y="20" width="90" height="90" 
            fill="var(--bg-primary)" 
            stroke="var(--text-primary)" 
            strokeWidth="1.5"
          />

          {/* DC Source symbol - battery style lines - shifted right */}
          <g transform="translate(75, 40)">
            {/* Long line (positive) */}
            <rect x="0" y="0" width="35" height="5" fill="var(--accent-color)"/>
            {/* Short line (negative) */}
            <rect x="7" y="18" width="20" height="5" fill="var(--text-primary)"/>
            
            {/* Polarity labels */}
            <text x="17" y="-5" fill="var(--accent-color)" fontSize="14" textAnchor="middle" fontFamily="Consolas,monospace" fontWeight="bold">
              +
            </text>
            <text x="17" y="35" fill="var(--text-primary)" fontSize="14" textAnchor="middle" fontFamily="Consolas,monospace" fontWeight="bold">
              -
            </text>
          </g>

          {/* Terminal labels - shifted right to prevent cutoff */}
          <text x="35" y="50" fill="var(--text-secondary)" fontSize="10" textAnchor="end" fontFamily="Consolas,monospace">
            VCC+
          </text>
          <text x="35" y="95" fill="var(--text-secondary)" fontSize="10" textAnchor="end" fontFamily="Consolas,monospace">
            GND
          </text>

          {/* Terminal circles - shifted right */}
          <circle cx="40" cy="52" r="5" fill="#FFFFFF" stroke="var(--border-color)" strokeWidth="1"/>
          <circle cx="40" cy="92" r="5" fill="#8B4513" stroke="var(--border-color)" strokeWidth="1"/>

          {/* Connection lines from terminals to symbol - adjusted */}
          <line x1="45" y1="52" x2="65" y2="52" stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="3 2"/>
          <line x1="45" y1="92" x2="65" y2="92" stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="3 2"/>
          <line x1="65" y1="52" x2="75" y2="44" stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="3 2"/>
          <line x1="65" y1="92" x2="75" y2="57" stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="3 2"/>


        </svg>

        {/* Device label */}
        <div className="acad-node-title" style={{ fontSize: '10px', marginTop: '2px' }}>
          {label}
        </div>
      </div>

      {/* Terminal strip footer */}
      <div style={{ 
        borderTop: '1px solid var(--border-secondary)', 
        padding: '4px 8px',
        fontSize: '9px',
        fontFamily: 'Consolas,monospace',
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>TB-PS1</span>
        <span>SOLAR/PSU</span>
      </div>

      {/* React Flow Handles - shifted right */}
      <Handle
        type="source"
        position={Position.Left}
        id="vcc+"
        style={{
          left: -6,
          top: 55,
          backgroundColor: '#FFFFFF',
          border: '2px solid var(--accent-color)',
          width: '12px',
          height: '12px'
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="gnd"
        style={{
          left: -6,
          top: 95,
          backgroundColor: '#8B4513',
          border: '2px solid var(--accent-color)',
          width: '12px',
          height: '12px'
        }}
      />
    </div>
  );
};
