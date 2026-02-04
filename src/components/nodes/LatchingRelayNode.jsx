import { Handle, Position } from 'reactflow';

export const LatchingRelayNode = ({ data }) => {
  const { label, terminals } = data;

  return (
    <div className="acad-node latching-relay-acad">
      {/* Node header with reference designator */}
      <div className="acad-node-header">
        <span className="acad-ref-des">K1-L</span>
        <span className="acad-device-type">LATCH</span>
      </div>

      <div className="acad-node-body">
        {/* IEC latching relay with dual coils - larger for better spacing */}
        <svg width="180" height="150" viewBox="0 0 180 150">
          {/* Device outline */}
          <rect 
            x="40" y="15" width="100" height="120" 
            fill="var(--bg-primary)" 
            stroke="var(--text-primary)" 
            strokeWidth="1.5"
          />

          {/* SET Coil (top) - rectangle with + symbol */}
          <rect 
            x="70" y="30" width="35" height="30" 
            fill="none" 
            stroke="var(--accent-color)" 
            strokeWidth="2"
          />
          <text x="87" y="50" fill="var(--accent-color)" fontSize="10" textAnchor="middle" fontFamily="Consolas,monospace">
            SET
          </text>
          {/* Plus symbol for set */}
          <line x1="77" y1="45" x2="97" y2="45" stroke="var(--accent-color)" strokeWidth="1.5"/>
          <line x1="87" y1="35" x2="87" y2="55" stroke="var(--accent-color)" strokeWidth="1.5"/>

          {/* RESET Coil (bottom) - rectangle with - symbol */}
          <rect 
            x="70" y="75" width="35" height="30" 
            fill="none" 
            stroke="var(--accent-color)" 
            strokeWidth="2"
          />
          <text x="87" y="95" fill="var(--accent-color)" fontSize="10" textAnchor="middle" fontFamily="Consolas,monospace">
            RST
          </text>
          {/* Minus symbol for reset */}
          <line x1="77" y1="90" x2="97" y2="90" stroke="var(--accent-color)" strokeWidth="1.5"/>

          {/* Latching indicator arrow between coils */}
          <g transform="translate(115, 55)">
            <polygon points="0,0 8,4 0,8" fill="var(--accent-secondary)"/>
            <line x1="-5" y1="4" x2="0" y2="4" stroke="var(--accent-secondary)" strokeWidth="2"/>
          </g>
          <text x="132" y="60" fill="var(--accent-secondary)" fontSize="8" fontFamily="Consolas,monospace">
            LAT
          </text>

          {/* Terminal labels and connection points - with more spacing */}
          {terminals && terminals.map((terminal, idx) => {
            const yPos = idx === 0 ? 45 : 90; // A2 on top, A1 on bottom
            const labelText = terminal.name;
            return (
              <g key={idx}>
                {/* Terminal circle */}
                <circle cx="22" cy={yPos} r="5" fill={terminal.color} stroke="var(--border-color)" strokeWidth="1"/>
                {/* Terminal label */}
                <text x="12" y={yPos + 3} fill="var(--text-secondary)" fontSize="10" textAnchor="end" fontFamily="Consolas,monospace">
                  {labelText}
                </text>
                {/* Connection line */}
                <line x1="27" y1={yPos} x2="40" y2={yPos} stroke="var(--border-secondary)" strokeWidth="1.5"/>
                {/* Internal connection to coil */}
                <line x1="40" y1={yPos} x2="70" y2={yPos} stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="3 2"/>
              </g>
            );
          })}

          {/* Output indicator on right */}
          <g transform="translate(145, 50)">
            {/* Dual contact symbol */}
            <text x="5" y="0" fill="var(--text-muted)" fontSize="8" textAnchor="middle" fontFamily="Consolas,monospace">
              NO
            </text>
            <line x1="0" y1="12" x2="12" y2="12" stroke="var(--border-secondary)" strokeWidth="1"/>
            <line x1="0" y1="42" x2="12" y2="42" stroke="var(--border-secondary)" strokeWidth="1"/>
            <line x1="12" y1="12" x2="22" y2="2" stroke="var(--text-primary)" strokeWidth="1.5"/>
          </g>

          {/* Latching relay label */}
          <text x="90" y="142" fill="var(--text-muted)" fontSize="8" textAnchor="middle" fontFamily="Consolas,monospace">
            LATCHING RELAY
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
        <span>TB-K1L</span>
        <span>2COIL</span>
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
