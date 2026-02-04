import { EdgeLabelRenderer } from 'reactflow';

// Custom path generation that routes edges around nodes - AutoCAD style orthogonal routing
const getCustomPath = (sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition) => {
  // Calculate the midpoint
  const midX = (sourceX + targetX) / 2;

  // Determine offset based on edge direction and handle position
  const routeOffset = 60; // Slightly reduced for tighter routing

  let path;

  if (sourcePosition === 'right' && targetPosition === 'left') {
    // Standard left-to-right connection (Neo -> Device)
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

  const { label, color = '#e0e0e0', wireNumber = '' } = data || {};

  // Detect if this is a power input edge (battery -> neo)
  const isPowerInput = source && target && source.startsWith('device-') && target.startsWith('neo-');

  // Calculate label position - centered on the wire
  let labelX, labelY;
  if (isPowerInput) {
    const xOffset = sourcePosition === 'left' ? -40 : 10;
    labelX = sourceX + xOffset;
    labelY = sourceY - 15;
  } else {
    const xOffset = targetPosition === 'right' ? 25 : -40;
    labelX = targetX + xOffset;
    labelY = targetY - 15;
  }

  return (
    <>
      {/* Main wire path - AutoCAD style thicker lines */}
      <path
        id={id}
        style={{
          ...style,
          stroke: color,
          strokeWidth: 2.5,
          strokeLinecap: 'butt',  // AutoCAD uses butt caps
          strokeLinejoin: 'miter',
          fill: 'none',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {/* Wire outline for better visibility on dark background */}
      <path
        style={{
          stroke: 'var(--bg-primary)',
          strokeWidth: 5,
          strokeLinecap: 'butt',
          strokeLinejoin: 'miter',
          fill: 'none',
          opacity: 0.8,
        }}
        d={edgePath}
      />
      
      {/* Main wire on top */}
      <path
        style={{
          stroke: color,
          strokeWidth: 2.5,
          strokeLinecap: 'butt',
          strokeLinejoin: 'miter',
          fill: 'none',
        }}
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
            {/* AutoCAD Electrical style wire label - horizontal layout with wire number on left */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '0',
            }}>
              {/* Wire number (left) - yellow text like AutoCAD */}
              {wireNumber && (
                <span style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--accent-secondary)',
                  padding: '2px 5px',
                  fontSize: '10px',
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontWeight: 'bold',
                  border: '1px solid var(--border-secondary)',
                  borderRight: 'none',
                  whiteSpace: 'nowrap',
                  lineHeight: '1.2',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  {wireNumber}
                </span>
              )}
              
              {/* Wire label */}
              <span style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                padding: '2px 6px',
                fontSize: '10px',
                fontFamily: 'Consolas, Monaco, monospace',
                fontWeight: '600',
                border: `1.5px solid ${color}`,
                borderLeft: wireNumber ? `1px solid var(--border-secondary)` : `4px solid ${color}`,
                whiteSpace: 'nowrap',
                lineHeight: '1.2',
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
