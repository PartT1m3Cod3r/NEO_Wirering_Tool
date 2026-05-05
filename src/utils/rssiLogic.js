/**
 * Get WiFi RSSI status
 * @param {number} rssi - dBm value
 * @returns {{ level: string, color: string, recommendation: string }}
 */
export const getWifiStatus = (rssi) => {
  if (rssi >= -50) return { level: 'EXCELLENT', color: '#00ff00', recommendation: 'WiFi signal is excellent. No action needed.' };
  if (rssi >= -60) return { level: 'GOOD', color: '#ccff00', recommendation: 'WiFi signal is good. Monitor for changes.' };
  if (rssi >= -70) return { level: 'FAIR', color: '#ffff00', recommendation: 'WiFi signal is fair. Consider reducing distance or adding an access point.' };
  if (rssi >= -80) return { level: 'POOR', color: '#ff8800', recommendation: 'WiFi signal is poor. Reduce distance to NEOs, ensure line of sight, or add a WiFi extender.' };
  return { level: 'VERY POOR', color: '#ff4444', recommendation: 'WiFi signal is very poor. Immediate action required: reposition base station or add a repeater.' };
};

/**
 * Get LTE RSSI status
 * @param {number} rssi - dBm value
 * @returns {{ level: string, color: string, recommendation: string }}
 */
export const getLteStatus = (rssi) => {
  if (rssi >= -80) return { level: 'EXCELLENT', color: '#00ff00', recommendation: 'LTE signal is excellent. No action needed.' };
  if (rssi >= -90) return { level: 'GOOD', color: '#ccff00', recommendation: 'LTE signal is good. Monitor for changes.' };
  if (rssi >= -100) return { level: 'FAIR', color: '#ffff00', recommendation: 'LTE signal is fair. Consider repositioning the base station or adding an external antenna.' };
  if (rssi >= -110) return { level: 'POOR', color: '#ff8800', recommendation: 'LTE signal is poor. Reposition base station or install an external LTE antenna.' };
  return { level: 'VERY POOR', color: '#ff4444', recommendation: 'LTE signal is very poor. Immediate action required: relocate base station to area with better cellular coverage.' };
};

/**
 * Generate network recommendations based on all nodes and links
 * @param {Array} nodes - network device nodes (with data.type, data.label, data.wifiRssi, data.lteRssi)
 * @param {Array} edges - network links (with data.distance, data.los)
 * @returns {Array<{type: 'success'|'warning'|'error', message: string}>}
 */
export const getNetworkRecommendations = (nodes, edges) => {
  const recs = [];

  nodes.forEach((node) => {
    if (node.data?.type === 'baseStation') {
      const mode = node.data.mode || 'wifi';
      if (mode === 'wifi' && node.data.wifiRssi !== undefined && node.data.wifiRssi !== null) {
        const status = getWifiStatus(node.data.wifiRssi);
        if (status.level === 'POOR' || status.level === 'VERY POOR') {
          recs.push({ type: 'error', message: `${node.data.label}: ${status.recommendation}` });
        } else if (status.level === 'FAIR') {
          recs.push({ type: 'warning', message: `${node.data.label}: ${status.recommendation}` });
        }
      }
      if (mode === 'lte' && node.data.lteRssi !== undefined && node.data.lteRssi !== null) {
        const status = getLteStatus(node.data.lteRssi);
        if (status.level === 'POOR' || status.level === 'VERY POOR') {
          recs.push({ type: 'error', message: `${node.data.label}: ${status.recommendation}` });
        } else if (status.level === 'FAIR') {
          recs.push({ type: 'warning', message: `${node.data.label}: ${status.recommendation}` });
        }
      }
    }
  });

  edges.forEach((edge) => {
    if (!edge.data?.los) {
      const sourceLabel = nodes.find(n => n.id === edge.source)?.data?.label || edge.source;
      const targetLabel = nodes.find(n => n.id === edge.target)?.data?.label || edge.target;
      recs.push({ type: 'warning', message: `Link ${sourceLabel} \u2192 ${targetLabel} has no line of sight. Enable LOS for better CoreLink performance.` });
    }
    if (edge.data?.distance > 500) {
      const sourceLabel = nodes.find(n => n.id === edge.source)?.data?.label || edge.source;
      const targetLabel = nodes.find(n => n.id === edge.target)?.data?.label || edge.target;
      recs.push({ type: 'warning', message: `Link ${sourceLabel} \u2192 ${targetLabel} is ${edge.data.distance}m. CoreLink range may be limited beyond 500m.` });
    }
  });

  if (recs.length === 0) {
    recs.push({ type: 'success', message: 'Network looks good. All signals and links are within recommended parameters.' });
  }

  return recs;
};
