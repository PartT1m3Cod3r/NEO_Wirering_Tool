import { Handle, Position } from 'reactflow';

export const RelayNode = ({ data }) => {
  const { label, terminals } = data;

  return (
    <div className="acad-node relay-node-acad">
      {/* Node header with reference designator */}
      <div className="acad-node-header">
        <span className="acad-ref-des">K1</span>
        <span className="acad-device-type">RELAY</span>
      </div>

      <div className="acad-node-body">
        {/* IEC relay coil symbol - larger for better spacing */}
        <svg width="160" height="130" viewBox="0 0 160 130">
          {/* Device outline */}
          <rect 
            x="35" y="20" width="90" height="90" 
            fill="var(--bg-primary)" 
            stroke="var(--text-primary)" 
            strokeWidth="1.5"
          />

          {/* IEC Coil symbol - rectangle with diagonal */}
          <rect 
            x="65" y="45" width="40" height="45" 
            fill="none" 
            stroke="var(--accent-color)" 
            strokeWidth="2"
          />
          
          {/* Diagonal line through coil */}
          <line x1="65" y1="90" x2="105" y2="45" stroke="var(--accent-color)" strokeWidth="1.5"/>
          
          {/* Coil label */}
          <text x="85" y="72" fill="var(--accent-color)" fontSize="11" textAnchor="middle" fontFamily="Consolas,monospace">
            A
          </text>

          {/* Terminal labels and connection points - with more spacing */}
          {terminals && terminals.map((terminal, idx) => {
            const yPos = idx === 0 ? 45 : 90; // A2 on top, A1 on bottom - more spacing
            const labelText = terminal.name;
            return (
              <g key={idx}>
                {/* Terminal circle */}
                <circle cx="20" cy={yPos} r="5" fill={terminal.color} stroke="var(--border-color)" strokeWidth="1"/>
                {/* Terminal label */}
                <text x="10" y={yPos + 3} fill="var(--text-secondary)" fontSize="10" textAnchor="end" fontFamily="Consolas,monospace">
                  {labelText}
                </text>
                {/* Connection line */}
                <line x1="25" y1={yPos} x2="35" y2={yPos} stroke="var(--border-secondary)" strokeWidth="1.5"/>
                {/* Internal connection to coil */}
                <line x1="35" y1={yPos} x2="65" y2={yPos} stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="3 2"/>
              </g>
            );
          })}

          {/* Output indicator - normally open contact symbol on right */}
          <g transform="translate(130, 48)">
            {/* Contact symbol */}
            <line x1="0" y1="0" x2="15" y2="0" stroke="var(--border-secondary)" strokeWidth="1"/>
            <line x1="0" y1="35" x2="15" y2="35" stroke="var(--border-secondary)" strokeWidth="1"/>
            {/* Open contact */}
            <line x1="15" y1="0" x2="25" y2="-8" stroke="var(--text-primary)" strokeWidth="1.5"/>
            {/* Arrow indicating operation */}
            <path d="M 20 5 L 25 -8 L 15 -5" fill="none" stroke="var(--accent-color)" strokeWidth="1"/>
          </g>

          {/* Relay type label */}
          <text x="80" y="122" fill="var(--text-muted)" fontSize="8" textAnchor="middle" fontFamily="Consolas,monospace">
            SPDT RELAY
          </text>
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
        <span>TB-K1</span>
        <span>OUT</span>
      </div>

      {/* React Flow Handles - AutoCAD grip style with more spacing */}
      {terminals && terminals.map((terminal, idx) => {
        const topPos = 48 + (idx * 45);
        const handleId = idx === 0 ? 'a2' : 'a1';

        return (
          <Handle
            key={idx}
            type="target"
            position={Position.Left}
            id={handleId}
            style={{
              left: -6,
              top: topPos,
              backgroundColor: terminal.color,
              border: '2px solid var(--accent-color)',
              width: '12px',
              height: '12px'
            }}
          />
        );
      })}
    </div>
  );
};
