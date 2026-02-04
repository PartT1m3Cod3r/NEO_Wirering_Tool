import { Handle, Position } from 'reactflow';

export const SensorNode = ({ data }) => {
  const { label, sensorType, terminals } = data;

  // Determine the sensor type symbol and reference designator
  let sensorSymbol = '';
  let refDes = '';
  let description = '';
  
  if (sensorType === '0-10v' || label?.includes('0-10')) {
    sensorSymbol = '0-10V';
    refDes = 'AI';
    description = 'Analog Input';
  } else if (sensorType === '4-20ma' || label?.includes('4-20')) {
    sensorSymbol = '4-20mA';
    refDes = 'AI';
    description = 'Analog Input';
  } else if (sensorType === 'voltage-sensing') {
    sensorSymbol = 'V';
    refDes = 'VS';
    description = 'Voltage Sense';
  } else if (sensorType === 'rs485') {
    sensorSymbol = '485';
    refDes = 'COM';
    description = 'RS485';
  } else if (sensorType === 'sdi12') {
    sensorSymbol = 'SDI';
    refDes = 'COM';
    description = 'SDI-12';
  } else if (sensorType === 'wiegand') {
    sensorSymbol = 'WG';
    refDes = 'RD';
    description = 'Wiegand';
  } else if (sensorType === 'pulse') {
    sensorSymbol = 'P';
    refDes = 'PI';
    description = 'Pulse In';
  } else if (sensorType === 'power-input') {
    sensorSymbol = 'DC';
    refDes = 'PS';
    description = 'Power Supply';
  } else {
    sensorSymbol = 'S';
    refDes = 'S';
    description = 'Sensor';
  }

  // Power supply uses source handles (outputs), sensors use target handles (inputs)
  const isPowerSource = sensorType === 'power-input';

  return (
    <div className="acad-node sensor-node-acad">
      {/* Node header with reference designator */}
      <div className="acad-node-header">
        <span className="acad-ref-des">{refDes}1</span>
        <span className="acad-device-type">{description.toUpperCase()}</span>
      </div>

      <div className="acad-node-body">
        {/* IEC-style sensor symbol - larger for better spacing */}
        <svg width="160" height="120" viewBox="0 0 160 120">
          {/* Device outline - rectangle with chamfered corners */}
          <path 
            d="M 40 20 L 120 20 L 125 25 L 125 85 L 120 90 L 40 90 L 35 85 L 35 25 Z" 
            fill="var(--bg-primary)" 
            stroke="var(--text-primary)" 
            strokeWidth="1.5"
          />

          {/* Sensor type symbol in center */}
          {sensorType === '0-10v' || sensorType === '4-20ma' || sensorType === 'voltage-sensing' ? (
            // Analog sensor - sine wave symbol
            <g>
              <path 
                d="M 55 55 Q 70 35 85 55 Q 100 75 115 55" 
                fill="none" 
                stroke="var(--accent-color)" 
                strokeWidth="2.5"
              />
              <text x="85" y="75" fill="var(--accent-color)" fontSize="11" textAnchor="middle" fontFamily="Consolas,monospace">
                {sensorSymbol}
              </text>
            </g>
          ) : sensorType === 'power-input' ? (
            // Power supply - DC symbol
            <g>
              <rect x="70" y="40" width="40" height="35" fill="none" stroke="var(--accent-color)" strokeWidth="2"/>
              <text x="90" y="62" fill="var(--accent-color)" fontSize="16" textAnchor="middle" fontFamily="Consolas,monospace" fontWeight="bold">
                DC
              </text>
            </g>
          ) : sensorType === 'pulse' ? (
            // Pulse counter - square wave
            <g>
              <polyline 
                points="60,60 68,60 68,45 82,45 82,60 96,60 96,45 110,45 110,60 118,60" 
                fill="none" 
                stroke="var(--accent-color)" 
                strokeWidth="2.5"
              />
              <text x="89" y="82" fill="var(--accent-color)" fontSize="10" textAnchor="middle" fontFamily="Consolas,monospace">
                PULSE
              </text>
            </g>
          ) : (
            // Digital/Communication - generic box with label
            <g>
              <rect x="60" y="40" width="60" height="35" fill="none" stroke="var(--accent-color)" strokeWidth="2"/>
              <text x="90" y="62" fill="var(--accent-color)" fontSize="11" textAnchor="middle" fontFamily="Consolas,monospace">
                {sensorSymbol}
              </text>
            </g>
          )}

          {/* Terminal labels on left side - with more spacing */}
          {terminals && terminals.map((terminal, idx) => {
            const yPos = 35 + (idx * 28);
            return (
              <g key={idx}>
                {/* Terminal circle */}
                <circle cx="22" cy={yPos} r="5" fill={terminal.color} stroke="var(--border-color)" strokeWidth="1"/>
                {/* Terminal label */}
                <text x="10" y={yPos + 3} fill="var(--text-secondary)" fontSize="9" textAnchor="end" fontFamily="Consolas,monospace">
                  {terminal.name}
                </text>
                {/* Connection line */}
                <line x1="27" y1={yPos} x2="35" y2={yPos} stroke="var(--border-secondary)" strokeWidth="1"/>
              </g>
            );
          })}
        </svg>

        {/* Device label below */}
        <div className="acad-node-title" style={{ marginTop: '-5px', fontSize: '10px' }}>
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
        <span>TB{refDes}1</span>
        <span>{terminals?.length || 0}P</span>
      </div>

      {/* React Flow Handles - AutoCAD grip style with more spacing */}
      {terminals && terminals.map((terminal, idx) => {
        const topPos = 40 + (idx * 32);

        return (
          <Handle
            key={idx}
            type={isPowerSource ? 'source' : 'target'}
            position={isPowerSource ? Position.Right : Position.Left}
            id={terminal.id}
            style={{
              [isPowerSource ? 'right' : 'left']: -6,
              top: topPos,
              backgroundColor: terminal.color,
              border: '2px solid var(--accent-color)',
              width: '12px',
              height: '12px',
              zIndex: 10
            }}
          />
        );
      })}
    </div>
  );
};
