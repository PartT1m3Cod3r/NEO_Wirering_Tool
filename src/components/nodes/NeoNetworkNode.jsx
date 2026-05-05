import { Handle, Position } from 'reactflow';

export const NeoNetworkNode = ({ data }) => {
  const { label, neoId, passphrase } = data;
  const defaultSide = data.handleSide || 'right';
  const terminalSides = data.terminalSides || {};

  // Single terminal for ethernet/radio connection
  const terminals = [{ id: 'eth', name: 'ETH' }];

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
      if (group.length === 1) pos = 90;
      else if (group.length === 2) pos = 50 + idx * 80;
      else if (group.length === 3) pos = 40 + idx * 50;
      else pos = 35 + idx * 37;
    } else {
      if (group.length === 1) pos = 50;
      else if (group.length === 2) pos = 24 + idx * 52;
      else if (group.length === 3) pos = 20 + idx * 40;
      else pos = 18 + idx * 30;
    }
    const handlePosition = side === 'top' ? Position.Top : side === 'bottom' ? Position.Bottom : side === 'left' ? Position.Left : Position.Right;
    return { side, pos, isHorizontal, handlePosition };
  };

  return (
    <div style={{
      width: '180px',
      height: '100px',
      background: 'var(--bg-secondary)',
      border: '2px solid var(--accent-color)',
      borderRadius: '4px',
      position: 'relative',
      fontFamily: "'Consolas', 'Monaco', monospace",
      overflow: 'visible'
    }}>
      {/* Terminal pins — matches SensorNode.jsx pattern exactly */}
      {terminals.map((terminal) => {
        const { side, pos, isHorizontal, handlePosition } = getTerminalLayout(terminal);
        return (
          <div key={`pin-${terminal.id}`}>
            {/* Visible dot sitting outside the card */}
            <div style={{
              position: 'absolute',
              ...(isHorizontal
                ? { left: `${pos - 5}px`, [side]: '-14px' }
                : { [side]: '-14px', top: `${pos - 5}px` }
              ),
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-color)',
              border: '1px solid var(--border-color)'
            }} />
            {/* React Flow Handle — wire lands here */}
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
      <div style={{
        background: 'var(--bg-tertiary)',
        color: 'var(--accent-color)',
        fontFamily: "'Consolas', 'Monaco', monospace",
        fontSize: '12px',
        textTransform: 'uppercase',
        padding: '4px 8px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {label || 'NEO'}{passphrase ? ' 🔒' : ''}
      </div>

      {/* Body */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50px',
        position: 'relative'
      }}>
        <span style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          lineHeight: '28px'
        }}>
          {'🔗'}
        </span>
        {neoId && (
          <span style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            marginTop: '2px'
          }}>
            ID: {neoId}
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{
        background: 'var(--bg-tertiary)',
        padding: '4px',
        textAlign: 'center',
        fontSize: '10px',
        color: 'var(--text-muted)',
        textTransform: 'uppercase'
      }}>
        CORELINK
      </div>
    </div>
  );
};
