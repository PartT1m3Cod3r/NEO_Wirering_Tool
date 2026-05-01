import { Handle, Position } from 'reactflow';

export const LatchingRelayNode = ({ data }) => {
  const { label } = data;

  // Latching relay reference designator
  const refDes = 'KR';
  const description = 'Latching Relay';

  // 2 wire latching relay — SET and RESET
  const terminals = [
    { id: 'set', name: 'SET', color: '#8B4513' },
    { id: 'reset', name: 'RST', color: '#0000FF' },
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
    <div className="acad-node latching-relay-node-acad" style={{ width: '160px', position: 'relative' }}>
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
              type="target"
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
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          {/* IEC Latching Relay Symbol */}
          <svg width="48" height="56" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Box */}
            <rect x="8" y="4" width="32" height="48" stroke="var(--text-primary)" strokeWidth="2" fill="none"/>
            {/* Vertical divider */}
            <line x1="24" y1="4" x2="24" y2="52" stroke="var(--text-primary)" strokeWidth="2"/>
            {/* Left diagonal (SET) */}
            <line x1="8" y1="4" x2="24" y2="28" stroke="var(--text-primary)" strokeWidth="2"/>
            {/* Right diagonal (RESET) */}
            <line x1="24" y1="28" x2="40" y2="52" stroke="var(--text-primary)" strokeWidth="2"/>
            {/* SET label */}
            <text x="16" y="18" textAnchor="middle" fill="var(--text-primary)" fontSize="8" fontFamily="monospace" fontWeight="bold">S</text>
            {/* RESET label */}
            <text x="32" y="48" textAnchor="middle" fill="var(--text-primary)" fontSize="8" fontFamily="monospace" fontWeight="bold">R</text>
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
