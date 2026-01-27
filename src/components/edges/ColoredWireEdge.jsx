import { getSmoothStepPath } from 'reactflow';

export const ColoredWireEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
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
    borderRadius: 15, // Rounded corners for wires
  });

  const { label, color = '#e0e0e0' } = data || {};

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: color,
          strokeWidth: 3, // Slightly thinner for cleaner look
          strokeLinecap: 'round',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {label && (
        <foreignObject
          x={labelX - 50}
          y={labelY - 10}
          width={100}
          height={20}
          style={{ overflow: 'visible' }} // Ensure content isn't clipped
        >
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%'
          }}>
            <span style={{
              backgroundColor: '#1a1a2e',
              color: color,
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600',
              border: `1px solid ${color}`,
              whiteSpace: 'nowrap'
            }}>
              {label}
            </span>
          </div>
        </foreignObject>
      )}
    </>
  );
};
