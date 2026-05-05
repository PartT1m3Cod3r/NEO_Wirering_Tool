import { getNetworkRecommendations } from '../../utils/rssiLogic';

export const RssiRecommendations = ({ nodes, edges }) => {
  const recommendations = getNetworkRecommendations(nodes, edges);
  const hasData = nodes.length > 0 || edges.length > 0;

  const getRowStyles = (type) => {
    const borderColors = {
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff4444',
    };

    const backgrounds = {
      success: 'rgba(0, 255, 0, 0.05)',
      warning: 'transparent',
      error: 'transparent',
    };

    return {
      borderLeft: `4px solid ${borderColors[type] || borderColors.warning}`,
      background: backgrounds[type] || 'transparent',
      padding: '6px 8px',
      marginBottom: 4,
      fontSize: 11,
      color: 'var(--text-primary)',
      fontFamily: 'Consolas, Monaco, monospace',
      lineHeight: 1.3,
    };
  };

  return (
    <div
      style={{
        padding: 12,
        borderTop: '1px solid var(--border-secondary)',
        background: 'var(--bg-secondary)',
      }}
    >
      <div
        style={{
          fontFamily: 'Consolas, Monaco, monospace',
          fontSize: 12,
          color: 'var(--accent-color)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        RECOMMENDATIONS
      </div>

      {!hasData ? (
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'Consolas, Monaco, monospace',
            padding: '6px 0',
          }}
        >
          Add devices to see recommendations.
        </div>
      ) : (
        <div>
          {recommendations.map((rec, idx) => (
            <div key={idx} style={getRowStyles(rec.type)}>
              {rec.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
