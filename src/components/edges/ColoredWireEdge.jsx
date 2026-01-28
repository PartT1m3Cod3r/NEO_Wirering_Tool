import { getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';

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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 15,
  });

  const { label, color = '#e0e0e0' } = data || {};

  // Detect if this is a power input edge (battery -> neo)
  // Power input edges have source as device-* and target as neo-*
  const isPowerInput = source && target && source.startsWith('device-') && target.startsWith('neo-');

  // Position labels:
  // - Power input: near battery (source side) - left side
  // - Other devices: near Neo (target side) - right side
  let shiftedX, shiftedY;
  if (isPowerInput) {
    // Position near battery (source)
    const xOffset = sourcePosition === 'left' ? -35 : 35;
    shiftedX = sourceX + xOffset;
    shiftedY = sourceY;
  } else {
    // Position near Neo device (target)
    const xOffset = targetPosition === 'right' ? 55 : -35;
    shiftedX = targetX + xOffset;
    shiftedY = targetY;
  }

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: color,
          strokeWidth: 3,
          strokeLinecap: 'round',
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
              transform: `translate(-50%, -50%) translate(${shiftedX}px, ${shiftedY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            className="nodrag nopan"
          >
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <span className="edge-label-text" style={{
                backgroundColor: '#1a1a2e',
                color: '#e0e0e0',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                border: `2px solid ${color}`,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                display: 'inline-block',
                lineHeight: '1.2'
              }}>
                {label}
              </span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
