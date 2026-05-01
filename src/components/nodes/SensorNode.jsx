import { Handle, Position } from 'reactflow';

export const SensorNode = ({ data }) => {
  const { label, sensorType, terminals } = data;

  // Determine the sensor type symbol and reference designator per IEC 60617
  let centerSymbol = '';
  let refDes = '';
  let description = '';
  let bodyTextColor = 'var(--text-primary)';

  if (sensorType === '0-10v' || label?.includes('0-10')) {
    centerSymbol = 'U~';
    refDes = 'AI';
    description = 'Analog Input';
    bodyTextColor = '#ffffff';
  } else if (sensorType === '4-20ma' || label?.includes('4-20')) {
    centerSymbol = 'I~';
    refDes = 'AI';
    description = 'Analog Input';
    bodyTextColor = '#ffffff';
  } else if (sensorType === 'voltage-sensing') {
    centerSymbol = 'V';
    refDes = 'VS';
    description = 'Voltage Sense';
    bodyTextColor = '#ffffff';
  } else if (sensorType === 'rs485') {
    centerSymbol = 'RS485';
    refDes = 'COM';
    description = 'RS485';
    bodyTextColor = 'var(--accent-color)';
  } else if (sensorType === 'sdi12') {
    centerSymbol = 'SDI-12';
    refDes = 'COM';
    description = 'SDI-12';
    bodyTextColor = 'var(--accent-color)';
  } else if (sensorType === 'wiegand') {
    centerSymbol = 'WIEGAND';
    refDes = 'RD';
    description = 'Wiegand';
    bodyTextColor = 'var(--accent-color)';
  } else if (sensorType === 'pulse') {
    centerSymbol = 'P';
    refDes = 'PI';
    description = 'Pulse In';
    bodyTextColor = 'var(--accent-secondary)';
  } else if (sensorType === 'power-input') {
    centerSymbol = 'DC';
    refDes = 'PS';
    description = 'Power Supply';
    bodyTextColor = '#ffffff';
  } else {
    centerSymbol = 'S';
    refDes = 'S';
    description = 'Sensor';
    bodyTextColor = '#ffffff';
  }

  const isPowerSource = sensorType === 'power-input';
  const symbolFontSize = centerSymbol.length > 3 ? '14px' : '24px';
  const termCount = terminals?.length || 0;
  const defaultSide = data.handleSide || 'bottom';
  const terminalSides = data.terminalSides || {};

  // Group terminals by their actual side
  const bySide = { top: [], bottom: [], left: [], right: [] };
  terminals?.forEach(t => {
    const side = terminalSides[t.id] || defaultSide;
    bySide[side].push(t);
  });

  const getTerminalLayout = (terminal) => {
    const side = terminalSides[terminal.id] || defaultSide;
    const group = bySide[side];
    const idx = group.findIndex(t => t.id === terminal.id);
    const isHorizontal = side === 'top' || side === 'bottom';
    let pos;
    if (isHorizontal) {
      if (group.length === 1) pos = 80;
      else if (group.length === 2) pos = 40 + idx * 80;
      else if (group.length === 3) pos = 30 + idx * 50;
      else pos = 40 + idx * 32;
    } else {
      if (group.length === 1) pos = 74;
      else if (group.length === 2) pos = 44 + idx * 60;
      else if (group.length === 3) pos = 34 + idx * 45;
      else pos = 30 + idx * 32;
    }
    const handlePosition = side === 'top' ? Position.Top : side === 'bottom' ? Position.Bottom : side === 'left' ? Position.Left : Position.Right;
    return { side, pos, isHorizontal, handlePosition };
  };

  // Terminal labels always spread horizontally across the top of the body
  const getHandleLeft = (idx) => {
    if (termCount === 1) return 80;
    if (termCount === 2) return 40 + idx * 80;
    if (termCount === 3) return 30 + idx * 50;
    return 40 + idx * 32;
  };

  return (
    <div className="acad-node sensor-node-acad" style={{ width: '160px', position: 'relative' }}>
      {/* Terminal pins — outside the card */}
      {terminals && terminals.map((terminal) => {
        const { side, pos, isHorizontal, handlePosition } = getTerminalLayout(terminal);
        return (
          <div key={`pin-${terminal.id}`}>
            {/* Dot sitting outside the card */}
            <div style={{
              position: 'absolute',
              ...(isHorizontal
                ? { left: `${pos - 5}px`, [side]: '-14px' }
                : { [side]: '-14px', top: `${pos - 5}px` }
              ),
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: terminal.color,
              border: '1px solid var(--border-color)'
            }} />
            {/* Invisible React Flow Handle — wire lands here */}
            <Handle
              type={isPowerSource ? 'source' : 'target'}
              position={handlePosition}
              id={terminal.id}
              style={{
                position: 'absolute',
                ...(isHorizontal
                  ? { [side]: -14, left: pos }
                  : { [side]: -14, top: pos }
                ),
                opacity: 0,
                width: '12px',
                height: '12px',
                zIndex: 10
              }}
            />
          </div>
        );
      })}

      {/* Header */}
      <div className="acad-node-header">
        <span className="acad-ref-des">{refDes}1</span>
        <span className="acad-device-type">{description.toUpperCase()}</span>
      </div>

      {/* Body */}
      <div style={{
        background: 'var(--bg-secondary)',
        height: '100px',
        position: 'relative',
        display: 'flex'
      }}>
        {/* Terminal labels inside the body */}
        {terminals && terminals.map((terminal, idx) => {
          const leftPos = getHandleLeft(idx);
          return (
            <div key={`label-${idx}`} style={{
              position: 'absolute',
              left: `${leftPos - 12}px`,
              top: '4px',
              fontSize: '8px',
              color: 'var(--text-secondary)',
              lineHeight: '10px',
              fontFamily: "'Consolas', 'Monaco', monospace",
              textAlign: 'center',
              width: '24px'
            }}>
              {terminal.name}
            </div>
          );
        })}

        {/* Center symbol rectangle */}
        <div style={{
          position: 'absolute',
          left: '8px',
          right: '8px',
          top: '20px',
          bottom: '6px',
          border: '1px solid var(--border-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: symbolFontSize,
            fontWeight: 'bold',
            color: bodyTextColor,
            fontFamily: "'Consolas', 'Monaco', monospace"
          }}>
            {centerSymbol}
          </span>
        </div>

        {/* Device label */}
        <div style={{
          position: 'absolute',
          left: '8px',
          right: '8px',
          bottom: '2px',
          fontSize: '9px',
          color: 'var(--text-primary)',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 600,
          fontFamily: "'Consolas', 'Monaco', monospace",
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {label}
        </div>
      </div>

      {/* Footer */}
      <div className="acad-node-footer">
        <span>TB{refDes}1</span>
        <span>{terminals?.length || 0}P</span>
      </div>
    </div>
  );
};
