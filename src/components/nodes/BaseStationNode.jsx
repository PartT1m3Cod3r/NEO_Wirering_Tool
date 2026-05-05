import { Handle, Position } from 'reactflow';
import { getWifiStatus, getLteStatus } from '../../utils/rssiLogic.js';

export const BaseStationNode = ({ data }) => {
  const { label, wifiRssi, lteRssi, mode, passphrase } = data;
  const defaultSide = data.handleSide || 'right';
  const terminalSides = data.terminalSides || {};

  // Single terminal for WAN connection
  const terminals = [{ id: 'wan', name: 'WAN' }];

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
      if (group.length === 1) pos = 100;
      else if (group.length === 2) pos = 55 + idx * 90;
      else if (group.length === 3) pos = 45 + idx * 55;
      else pos = 40 + idx * 40;
    } else {
      if (group.length === 1) pos = 70;
      else if (group.length === 2) pos = 36 + idx * 68;
      else if (group.length === 3) pos = 30 + idx * 50;
      else pos = 26 + idx * 36;
    }
    const handlePosition = side === 'top' ? Position.Top : side === 'bottom' ? Position.Bottom : side === 'left' ? Position.Left : Position.Right;
    return { side, pos, isHorizontal, handlePosition };
  };

  // RSSI color coding — use shared logic so thresholds stay in sync
  const getWifiColor = (rssi) => getWifiStatus(rssi).color;
  const getLteColor = (rssi) => getLteStatus(rssi).color;

  return (
    <div style={{
      width: '200px',
      height: '140px',
      background: 'var(--bg-secondary)',
      border: '2px solid var(--accent-secondary)',
      borderRadius: '4px',
      position: 'relative',
      fontFamily: "'Consolas', 'Monaco', monospace",
      overflow: 'visible'
    }}>
      {/* Terminal pins — matches NeoDeviceNode source handle pattern */}
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
              backgroundColor: 'var(--accent-secondary)',
              border: '1px solid var(--border-color)'
            }} />
            {/* React Flow Handle — wire lands here */}
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
      <div style={{
        background: 'var(--bg-tertiary)',
        color: 'var(--accent-secondary)',
        fontFamily: "'Consolas', 'Monaco', monospace",
        fontSize: '12px',
        textTransform: 'uppercase',
        padding: '4px 8px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {label || 'BASE STATION'}{passphrase ? ' 🔒' : ''}
      </div>
      <div style={{
        textAlign: 'center',
        fontSize: '9px',
        color: 'var(--text-muted)',
        fontFamily: "'Consolas', 'Monaco', monospace",
        textTransform: 'uppercase',
        padding: '2px 0',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-secondary)',
      }}>
        {mode === 'lte' ? 'LTE MODE' : 'WIFI MODE'}
      </div>

      {/* Body */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '70px',
        position: 'relative'
      }}>
        <span style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          lineHeight: '32px'
        }}>
          {'📡'}
        </span>
        {mode !== 'lte' && (typeof wifiRssi === 'number') && (
          <span style={{
            fontSize: '10px',
            fontFamily: "'Consolas', 'Monaco', monospace",
            color: getWifiColor(wifiRssi),
            marginTop: '2px'
          }}>
            WIFI: {wifiRssi} dBm
          </span>
        )}
        {mode === 'lte' && (typeof lteRssi === 'number') && (
          <span style={{
            fontSize: '10px',
            fontFamily: "'Consolas', 'Monaco', monospace",
            color: getLteColor(lteRssi),
            marginTop: '2px'
          }}>
            LTE: {lteRssi} dBm
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
        GATEWAY
      </div>
    </div>
  );
};
