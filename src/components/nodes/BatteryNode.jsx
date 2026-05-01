import { Handle, Position } from 'reactflow';

export const BatteryNode = ({ data }) => {
  const { label } = data;

  const refDes = 'PS';
  const description = 'Power Supply';

  // 2 wire power supply — VCC and GND
  const terminals = [
    { id: 'vcc', name: 'VCC', color: '#8B4513' },
    { id: 'gnd', name: 'GND', color: '#0000FF' },
  ];

  const defaultSide = data.handleSide || 'bottom';
  const terminalSides = data.terminalSides || {};

  // Group terminals by their actual side
  const bySide = { top: [], bottom: [], left: [], right: [] };
  terminals.forEach(t => {
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
      else pos = 40 + idx * 32;
    } else {
      if (group.length === 1) pos = 74;
      else if (group.length === 2) pos = 44 + idx * 60;
      else pos = 30 + idx * 32;
    }
    const handlePosition = side === 'top' ? Position.Top : side === 'bottom' ? Position.Bottom : side === 'left' ? Position.Left : Position.Right;
    return { side, pos, isHorizontal, handlePosition };
  };

  return (
    <div className="acad-node battery-node-acad" style={{ width: '160px', position: 'relative' }}>
      {/* Terminal pins — outside the card */}
      {terminals.map((terminal) => {
        const { side, pos, isHorizontal, handlePosition } = getTerminalLayout(terminal);
        return (
          <div key={`pin-${terminal.id}`}>
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
            <Handle
              type="source"
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
        {/* Terminal labels */}
        {terminals.map((terminal, idx) => {
          const leftPos = [40, 120][idx];
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
          <svg width="48" height="36" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Battery symbol — IEC style */}
            <line x1="4" y1="18" x2="16" y2="18" stroke="var(--text-primary)" strokeWidth="2"/>
            <line x1="32" y1="18" x2="44" y2="18" stroke="var(--text-primary)" strokeWidth="2"/>
            {/* Positive plate (long) */}
            <line x1="16" y1="8" x2="16" y2="28" stroke="var(--text-primary)" strokeWidth="2"/>
            {/* Negative plate (short) */}
            <line x1="32" y1="12" x2="32" y2="24" stroke="var(--text-primary)" strokeWidth="2"/>
            {/* + and - */}
            <text x="22" y="14" fill="var(--text-primary)" fontSize="10" fontFamily="monospace" fontWeight="bold">+</text>
            <text x="24" y="28" fill="var(--text-primary)" fontSize="12" fontFamily="monospace" fontWeight="bold">–</text>
          </svg>
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
        <span>{terminals.length}P</span>
      </div>
    </div>
  );
};
