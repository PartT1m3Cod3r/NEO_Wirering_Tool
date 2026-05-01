import { colorMap } from '../data/plugData';

export const PlugDisplay = ({ pins, allPins, title, selectedChannel, plugType, typeData, usedPins }) => {
  // Check if this is pulse counter
  const isPulseCounter = typeData?.value === 'pulse';

  // Filter to show only relevant pins for pulse counter
  const getPulseCounterCommsPins = () => {
    // Communications plug: pins 3 (Green - Power) and 4 (Yellow - GND)
    return pins.filter(p => p.pin === 3 || p.pin === 4);
  };

  const getPulseCounterInputsPins = () => {
    // Communications plug: pins 3, 4, 6 (Power, GND, and Pulse input 1)
    return pins?.filter(p => p.pin === 3 || p.pin === 4 || p.pin === 6) || [];
  };
  if (!allPins || allPins.length === 0) {
    return (
      <div className="plug-container">
        <h3>{title}</h3>
        <p>Select a plug type to view pin configuration</p>
      </div>
    );
  }

  // Show message when user needs to select channel/output to see used pins
  const needsSelection = usedPins.length === 0 && (
    (plugType === 'inputs' && typeData?.value !== 'power-input') ||
    (plugType === 'outputs' && typeData?.value !== 'power-input')
  );

  // Render pin row
  const renderPinRow = (pin, isSelected = false) => (
    <div
      key={pin.pin}
      className="pin-row"
      style={{
        borderLeft: `8px solid ${colorMap[pin.color]}`,
        backgroundColor: isSelected ? '#2a3a2a' : '#1a1a2e',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease',
        boxShadow: isSelected ? '0 0 15px ' + colorMap[pin.color] : 'none'
      }}
    >
      <div className="pin-number" style={{
        backgroundColor: isSelected ? '#0a2a23' : '#0f0f23',
        color: isSelected ? '#00a896' : '#00a896'
      }}>
        {pin.pin}
      </div>
      <div
        className="pin-color"
        style={{
          backgroundColor: colorMap[pin.color],
          border: isSelected ? '2px solid #00a896' : 'none'
        }}
      >
        {pin.color.charAt(0).toUpperCase() + pin.color.slice(1)}
      </div>
      <div className="pin-function" style={{
        fontWeight: isSelected ? '700' : '500',
        color: isSelected ? '#ffffff' : '#e0e0e0'
      }}>
        {pin.function}
      </div>
    </div>
  );

  // Render plug table
  const renderPlugTable = (plugPins, plugTitle, highlightPins = []) => (
    <div className="plug" style={{ marginBottom: '20px' }}>
      <div className="plug-header">{plugTitle}</div>
      <div className="plug-body">
        {plugPins.map((pin) => {
          const isSelected = highlightPins.includes(pin.pin);
          return renderPinRow(pin, isSelected);
        })}
      </div>
    </div>
  );

  return (
    <div className="plug-container">
      <h3>{title}</h3>
      {selectedChannel && (
        <div style={{
          textAlign: 'center',
          marginBottom: '15px',
          padding: '8px',
          backgroundColor: 'rgba(0, 168, 150, 0.2)',
          border: '1px solid #00a896',
          borderRadius: '6px',
          fontWeight: '600',
          color: '#00a896'
        }}>
          Selected: {(plugType === 'inputs' ? 'Channel ' : 'Output ') + selectedChannel}
        </div>
      )}

      {needsSelection ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          backgroundColor: '#1a1a2e',
          border: '1px dashed #444',
          borderRadius: '6px',
          color: '#888'
        }}>
          <p>Select a {plugType === 'inputs' ? 'channel' : 'output'} to see used pins</p>
        </div>
      ) : isPulseCounter ? (
        // Pulse Counter: Show both Communications and Inputs plugs
        <>
          {renderPlugTable(getPulseCounterCommsPins(), 'Inputs Plug', [3, 4])}
          {renderPlugTable(getPulseCounterInputsPins(), 'Communications Plug', [6])}
        </>
      ) : (
        // Normal display - show only used pins
        renderPlugTable(pins, 'Used Pins Only')
      )}
    </div>
  );
};
