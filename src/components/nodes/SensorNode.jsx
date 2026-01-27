import { Handle, Position } from 'reactflow';

export const SensorNode = ({ data }) => {
  const { label, sensorType, terminals } = data;

  // Determine the sensor label based on type
  let sensorLabel = '';
  if (sensorType === '0-10v' || label.includes('0-10')) {
    sensorLabel = '0-10V';
  } else if (sensorType === '4-20ma' || label.includes('4-20')) {
    sensorLabel = '4-20mA';
  } else if (sensorType === 'voltage-sensing') {
    sensorLabel = 'V-Sense';
  } else if (sensorType === 'rs485') {
    sensorLabel = 'RS485';
  } else if (sensorType === 'sdi12') {
    sensorLabel = 'SDI-12';
  } else if (sensorType === 'wiegand') {
    sensorLabel = 'Wiegand';
  } else {
    sensorLabel = 'Device';
  }

  return (
    <div className="sensor-node">
      <div className="node-header">
        <h4>{label}</h4>
      </div>
      <svg width="180" height="200" viewBox="0 0 180 200">
        {/* Sensor body - rectangular shape, clean style */}
        <rect x="50" y="30" width="80" height="120" rx="4" fill="#1a1a2e" stroke="#00a896" strokeWidth="2" />

        {/* Sensor tip */}
        <circle cx="90" cy="160" r="8" fill="#00a896" opacity="0.8" />

        {/* Sensor label centered in rectangle */}
        <text x="90" y="90" fill="#00a896" fontSize="14" fontWeight="700" textAnchor="middle">
          {sensorLabel}
        </text>

        {/* Connection terminals */}
        {terminals && terminals.map((terminal, idx) => {
          // Align with Neo Device spacing (start 55, step 40)
          // Handle centers at: 55, 95, 135
          const positions = [
            { x: 10, y: 55 },   // Terminal 1 (centers at 55)
            { x: 10, y: 95 },   // Terminal 2 (centers at 95)
            { x: 10, y: 135 }   // Terminal 3 (centers at 135)
          ];
          const pos = positions[idx] || { x: 10, y: 55 + (idx * 40) };

          return (
            <g key={idx}>
              {/* Terminal Label removed - moved to cable */}
            </g>
          );
        })}
      </svg>

      {/* React Flow Handles */}
      {terminals && terminals.map((terminal, idx) => {
        // Handle positions must align with Neo device handle positions
        // Neo device handles: 55, 95, 135 (center position)
        // Handle is 10px high, so 'top' should be center - 5 = 55, 95, 135
        const topPos = 55 + (idx * 40);

        return (
          <Handle
            key={idx}
            type="target"
            position={Position.Left}
            id={terminal.id}
            style={{
              left: 45, // Integrated into the SVG visual area
              top: topPos,
              backgroundColor: terminal.color,
              border: '2px solid #1a1a2e',
              width: '10px',
              height: '10px',
              zIndex: 10
            }}
          />
        );
      })}
    </div>
  );
};
