import { getSmoothStepPath, EdgeLabelRenderer } from 'reactflow';

export const ColoredWireEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
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

  // Position all labels at the arrow tip (target)
  // This applies uniformly to sensor connections AND power input connections
  const xOffset = targetPosition === 'right' ? 55 : -35;
  const shiftedX = targetX + xOffset;
  const shiftedY = targetY;

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
              <span style={{
                backgroundColor: '#1a1a2e',
                color: color,
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '600',
                border: `1px solid ${color}`,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
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
