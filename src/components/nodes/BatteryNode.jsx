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
        {/* IEC DC Power Source Symbol - larger for better spacing */}
        <svg width="160" height="130" viewBox="0 0 160 130">
          {/* Device outline */}
          <rect 
            x="35" y="20" width="90" height="90" 
            fill="var(--bg-primary)" 
            stroke="var(--text-primary)" 
            strokeWidth="1.5"
          />

          {/* DC Source symbol - battery style lines */}
          <g transform="translate(65, 40)">
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

          {/* Terminal labels - with more spacing */}
          <text x="20" y="50" fill="var(--text-secondary)" fontSize="10" textAnchor="end" fontFamily="Consolas,monospace">
            VCC+
          </text>
          <text x="20" y="95" fill="var(--text-secondary)" fontSize="10" textAnchor="end" fontFamily="Consolas,monospace">
            GND
          </text>

          {/* Terminal circles */}
          <circle cx="25" cy="52" r="5" fill="#FFFFFF" stroke="var(--border-color)" strokeWidth="1"/>
          <circle cx="25" cy="92" r="5" fill="#8B4513" stroke="var(--border-color)" strokeWidth="1"/>

          {/* Connection lines from terminals to symbol */}
          <line x1="30" y1="52" x2="55" y2="52" stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="3 2"/>
          <line x1="30" y1="92" x2="55" y2="92" stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="3 2"/>
          <line x1="55" y1="52" x2="65" y2="44" stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="3 2"/>
          <line x1="55" y1="92" x2="65" y2="57" stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="3 2"/>

          {/* Voltage label */}
          <text x="80" y="112" fill="var(--accent-color)" fontSize="9" textAnchor="middle" fontFamily="Consolas,monospace">
            12V DC
          </text>

          {/* Ground symbol at bottom right */}
          <g transform="translate(125, 65)">
            <line x1="0" y1="0" x2="0" y2="15" stroke="var(--text-primary)" strokeWidth="1.5"/>
            <line x1="-10" y1="15" x2="10" y2="15" stroke="var(--text-primary)" strokeWidth="1.5"/>
            <line x1="-6" y1="20" x2="6" y2="20" stroke="var(--text-primary)" strokeWidth="1"/>
            <line x1="-2" y1="25" x2="2" y2="25" stroke="var(--text-primary)" strokeWidth="1"/>
          </g>
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

      {/* React Flow Handles - AutoCAD grip style with more spacing - Source handles on LEFT */}
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
