import { EdgeLabelRenderer } from 'reactflow';

// Custom path generation that routes edges around nodes
const getCustomPath = (sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition) => {
  // Calculate the midpoint
  const midX = (sourceX + targetX) / 2;

  // Determine offset based on edge direction and handle position
  // This creates routing that goes around nodes rather than through them
  const isHorizontal = Math.abs(targetX - sourceX) > Math.abs(targetY - sourceY);

  // Calculate routing offset - push edges further out from nodes
  const routeOffset = 80; // Distance to route around nodes

  let path;

  if (sourcePosition === 'right' && targetPosition === 'left') {
    // Standard left-to-right connection (Neo -> Device)
    // Route: source -> right offset -> vertical to target Y -> target
    const offsetX = Math.max(sourceX + routeOffset, midX);
    path = `M ${sourceX} ${sourceY} 
            L ${offsetX} ${sourceY} 
            L ${offsetX} ${targetY} 
            L ${targetX} ${targetY}`;
  } else if (sourcePosition === 'left' && targetPosition === 'right') {
    // Right-to-left connection (Device -> Neo for power inputs)
    const offsetX = Math.min(sourceX - routeOffset, midX);
    path = `M ${sourceX} ${sourceY} 
            L ${offsetX} ${sourceY} 
            L ${offsetX} ${targetY} 
            L ${targetX} ${targetY}`;
  } else if (sourcePosition === 'right' && targetPosition === 'right') {
    // Both on right side - route around the right
    const maxX = Math.max(sourceX, targetX) + routeOffset;
    path = `M ${sourceX} ${sourceY} 
            L ${maxX} ${sourceY} 
            L ${maxX} ${targetY} 
            L ${targetX} ${targetY}`;
  } else if (sourcePosition === 'left' && targetPosition === 'left') {
    // Both on left side - route around the left
    const minX = Math.min(sourceX, targetX) - routeOffset;
    path = `M ${sourceX} ${sourceY} 
            L ${minX} ${sourceY} 
            L ${minX} ${targetY} 
            L ${targetX} ${targetY}`;
  } else {
    // Fallback - simple step path with offset
    path = `M ${sourceX} ${sourceY} 
            L ${midX} ${sourceY} 
            L ${midX} ${targetY} 
            L ${targetX} ${targetY}`;
  }

  return path;
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
  // Generate custom path that routes around nodes
  const edgePath = getCustomPath(sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition);

  const { label, color = '#e0e0e0' } = data || {};

  // Detect if this is a power input edge (battery -> neo)
  // Power input edges have source as device-* and target as neo-*
  const isPowerInput = source && target && source.startsWith('device-') && target.startsWith('neo-');

  // Position labels - all shifted 20px more to the left
  let shiftedX, shiftedY;
  if (isPowerInput) {
    // Power input: near battery (source side)
    const xOffset = sourcePosition === 'left' ? -55 : 15;
    shiftedX = sourceX + xOffset;
    shiftedY = sourceY;
  } else {
    // Other devices: near Neo (target side)
    const xOffset = targetPosition === 'right' ? 35 : -55;
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
