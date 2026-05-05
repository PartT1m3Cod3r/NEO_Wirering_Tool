import { EdgeLabelRenderer } from 'reactflow';

// Small vertical offset per wire color so parallel cables don't perfectly overlap
const getWireOffset = (color) => {
  const offsets = {
    '#FFFFFF': 0,
    '#8B4513': 0,
    '#00FF00': -4,
    '#FFFF00': 4,
    '#808080': -2,
    '#FFC0CB': 2,
    '#0000FF': -3,
    '#FF0000': 3,
  };
  return offsets[color?.toUpperCase?.()] || 0;
};

// Larger stagger for labels so multiple labels on the same side don't overlap
const getLabelStagger = (color, isHorizontalSide) => {
  const offsets = {
    '#FFFFFF': 0,
    '#8B4513': 0,
    '#00FF00': -22,
    '#FFFF00': 22,
    '#808080': -12,
    '#FFC0CB': 12,
    '#0000FF': -18,
    '#FF0000': 18,
  };
  const val = offsets[color?.toUpperCase?.()] || 0;
  // For top/bottom handles, stagger horizontally (spread left-right)
  // For left/right handles, stagger vertically (spread up-down)
  return isHorizontalSide ? { x: val, y: 0 } : { x: 0, y: val };
};

const CORNER_R = 12; // corner arc radius in canvas pixels

// Convert an array of [x, y] waypoints into an SVG path string where every
// interior corner is replaced with a small quadratic-bezier arc.
const roundedPath = (pts) => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [cx, cy] = pts[i];
    const next = pts[i + 1];
    if (!next) { d += ` L ${cx} ${cy}`; continue; }
    const [px, py] = pts[i - 1];
    const [nx, ny] = next;
    const dx1 = cx - px, dy1 = cy - py;
    const dx2 = nx - cx, dy2 = ny - cy;
    const len1 = Math.hypot(dx1, dy1);
    const len2 = Math.hypot(dx2, dy2);
    if (len1 < CORNER_R * 2 || len2 < CORNER_R * 2) {
      d += ` L ${cx} ${cy}`; continue;
    }
    const ax = cx - (dx1 / len1) * CORNER_R;
    const ay = cy - (dy1 / len1) * CORNER_R;
    const bx = cx + (dx2 / len2) * CORNER_R;
    const by = cy + (dy2 / len2) * CORNER_R;
    d += ` L ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
  }
  return d;
};

// Orthogonal routing — define waypoints then smooth every corner
const getOrthogonalPath = (sx, sy, tx, ty, sourcePosition, targetPosition) => {
  const midX = (sx + tx) / 2;

  if (sourcePosition === 'right' && targetPosition === 'left') {
    return roundedPath([[sx, sy], [midX, sy], [midX, ty], [tx, ty]]);
  }
  if (sourcePosition === 'left' && targetPosition === 'right') {
    return roundedPath([[sx, sy], [midX, sy], [midX, ty], [tx, ty]]);
  }
  if (sourcePosition === 'right' && targetPosition === 'top') {
    return roundedPath([[sx, sy], [tx, sy], [tx, ty]]);
  }
  if (sourcePosition === 'right' && targetPosition === 'bottom') {
    return roundedPath([[sx, sy], [tx, sy], [tx, ty]]);
  }
  if (sourcePosition === 'top' && targetPosition === 'right') {
    const turnY = Math.min(sy, ty) - 50;
    return roundedPath([[sx, sy], [sx, turnY], [tx, turnY], [tx, ty]]);
  }
  if (sourcePosition === 'bottom' && targetPosition === 'right') {
    const turnY = Math.max(sy, ty) + 40;
    return roundedPath([[sx, sy], [sx, turnY], [tx, turnY], [tx, ty]]);
  }
  if (sourcePosition === 'bottom' && targetPosition === 'bottom') {
    const turnY = Math.max(sy, ty) + 40;
    return roundedPath([[sx, sy], [sx, turnY], [tx, turnY], [tx, ty]]);
  }
  if (sourcePosition === 'bottom' && targetPosition === 'left') {
    const turnY = Math.max(sy, ty) + 40;
    return roundedPath([[sx, sy], [sx, turnY], [tx, turnY], [tx, ty]]);
  }
  if (sourcePosition === 'right' && targetPosition === 'right') {
    const maxX = Math.max(sx, tx) + 40;
    return roundedPath([[sx, sy], [maxX, sy], [maxX, ty], [tx, ty]]);
  }
  if (sourcePosition === 'left' && targetPosition === 'left') {
    const minX = Math.min(sx, tx) - 40;
    return roundedPath([[sx, sy], [minX, sy], [minX, ty], [tx, ty]]);
  }
  // Fallback
  return roundedPath([[sx, sy], [midX, sy], [midX, ty], [tx, ty]]);
};

export const ColoredWireEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
  style = {},
  markerEnd,
  data,
}) => {
  const { label, color = '#e0e0e0', wireNumber = '' } = data || {};

  const offset = getWireOffset(color);
  const sY = sourceY + offset;
  const tY = targetY + offset;

  const edgePath = getOrthogonalPath(sourceX, sY, targetX, tY, sourcePosition, targetPosition);

  const isLightTheme = document.body.getAttribute('data-theme') === 'light';
  const isWhiteWire = color.toLowerCase() === '#ffffff' || color.toLowerCase() === 'white' || color === '#fff';
  const isPowerInput = source && target && source.startsWith('device-') && target.startsWith('neo-');

  // Position label outside the node based on which side the handle is on
  const getLabelPosition = () => {
    const isHorizontalTarget = targetPosition === 'top' || targetPosition === 'bottom';
    const isHorizontalSource = sourcePosition === 'top' || sourcePosition === 'bottom';
    const targetStagger = getLabelStagger(color, isHorizontalTarget);
    const sourceStagger = getLabelStagger(color, isHorizontalSource);

    if (isPowerInput) {
      // Label near the source (device side)
      switch (sourcePosition) {
        case 'top': return { x: sourceX + sourceStagger.x, y: sY - 26 };
        case 'bottom': return { x: sourceX + sourceStagger.x, y: sY + 26 };
        case 'left': return { x: sourceX - 26, y: sY + sourceStagger.y };
        case 'right': return { x: sourceX + 26, y: sY + sourceStagger.y };
        default: return { x: sourceX + sourceStagger.x, y: sY - 26 };
      }
    }
    // Label near the target (device side)
    switch (targetPosition) {
      case 'top': return { x: targetX + targetStagger.x, y: tY - 26 };
      case 'bottom': return { x: targetX + targetStagger.x, y: tY + 26 };
      case 'left': return { x: targetX - 26, y: tY + targetStagger.y };
      case 'right': return { x: targetX + 26, y: tY + targetStagger.y };
      default: return { x: targetX + 26 + targetStagger.x, y: tY + targetStagger.y };
    }
  };

  const { x: labelX, y: labelY } = getLabelPosition();

  const getWireLabelStyles = () => {
    const baseStyles = {
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      padding: '2px 6px',
      fontSize: '10px',
      fontFamily: 'Consolas, Monaco, monospace',
      fontWeight: '600',
      border: `1.5px solid ${color}`,
      borderLeft: `3px solid ${color}`,
      whiteSpace: 'nowrap',
      lineHeight: '1.2',
    };
    if (isLightTheme && isWhiteWire) {
      baseStyles.border = '1.5px solid #000000';
      baseStyles.borderLeft = '3px solid #000000';
    }
    return baseStyles;
  };

  return (
    <>
      {/* Background outline for visibility on dark bg */}
      <path
        style={{
          stroke: 'var(--bg-primary)',
          strokeWidth: 5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
          opacity: 0.8,
        }}
        d={edgePath}
      />

      {/* Main wire */}
      <path
        id={id}
        style={{
          ...style,
          stroke: color,
          strokeWidth: 2.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'none',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            className="nodrag nopan"
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              {wireNumber && (
                <span style={{
                  backgroundColor: '#000000',
                  color: 'var(--accent-secondary)',
                  padding: '1px 6px',
                  fontSize: '9px',
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontWeight: 'bold',
                  border: '1px solid #333',
                  whiteSpace: 'nowrap',
                  lineHeight: '1.2',
                }}>
                  {wireNumber}
                </span>
              )}
              <span style={getWireLabelStyles()}>
                {label}
              </span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
