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
  } else if (sensorType === 'power-input') {
    sensorLabel = 'Power';
  } else {
    sensorLabel = 'Device';
  }

  // Power supply uses source handles (outputs), sensors use target handles (inputs)
  const isPowerSource = sensorType === 'power-input';

  return (
    <div className="sensor-node">
      <div className="node-header">
        <h4>{label}</h4>
      </div>
      <svg width="180" height="200" viewBox="0 0 180 200">
        {/* Sensor body - rectangular shape, clean style */}
        <rect x="50" y="30" width="80" height="120" rx="4" fill="var(--bg-secondary)" stroke="var(--accent-color)" strokeWidth="2" />

        {/* Sensor tip */}
        <circle cx="90" cy="160" r="8" fill="var(--accent-color)" opacity="0.8" />

        {/* Sensor label centered in rectangle */}
        <text x="90" y="90" fill="var(--accent-color)" fontSize="14" fontWeight="700" textAnchor="middle">
          {sensorLabel}
        </text>
      </svg>

      {/* React Flow Handles */}
      {terminals && terminals.map((terminal, idx) => {
        const topPos = 55 + (idx * 40);

        return (
          <Handle
            key={idx}
            type={isPowerSource ? 'source' : 'target'}
            position={isPowerSource ? Position.Right : Position.Left}
            id={terminal.id}
            style={{
              [isPowerSource ? 'right' : 'left']: -5,
              top: topPos,
              backgroundColor: terminal.color,
              border: '2px solid var(--bg-secondary)',
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
