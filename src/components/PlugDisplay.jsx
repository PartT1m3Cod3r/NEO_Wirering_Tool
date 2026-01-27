import { colorMap, plugOptions } from '../data/plugData';

export const PlugDisplay = ({ pins, title, selectedChannel, plugType, typeData }) => {
  // Check if this is pulse counter
  const isPulseCounter = typeData?.value === 'pulse';

  // Get pins for inputs plug (needed for pulse counter)
  const inputsPlug = plugOptions.find(p => p.value === 'inputs');
  const inputsPins = inputsPlug?.types.find(t => t.value === '0-10v')?.pins;

  // Filter to show only relevant pins for pulse counter
  const getPulseCounterCommsPins = () => {
    // Communications plug: pins 3 (Green - Power) and 4 (Yellow - GND)
    return pins.filter(p => p.pin === 3 || p.pin === 4);
  };

  const getPulseCounterInputsPins = () => {
    // Communications plug: pins 3, 4, 6 (Power, GND, and Pulse input 1)
    return pins?.filter(p => p.pin === 3 || p.pin === 4 || p.pin === 6) || [];
  };
  if (!pins || pins.length === 0) {
    return (
      <div className="plug-container">
        <h3>{title}</h3>
        <p>Select a plug type to view pin configuration</p>
      </div>
    );
  }

  // Determine if a pin is the selected channel
  const isSelectedChannel = (pin) => {
    if (!selectedChannel) return false;

    const channelNum = parseInt(selectedChannel);

    if (plugType === 'inputs') {
      // Map channel to pins (1=Red/Pin8, 2=Blue/Pin7, 3=Pink/Pin6, 4=Grey/Pin5)
      const channelPins = {
        1: { pin: 8, color: 'red' },
        2: { pin: 7, color: 'blue' },
        3: { pin: 6, color: 'pink' },
        4: { pin: 5, color: 'grey' }
      };
      const channel = channelPins[channelNum];
      return channel && pin.pin === channel.pin;
    } else if (plugType === 'outputs') {
      // Map output to pins (1=Grey/Pin5, 2=Pink/Pin6, 3=Blue/Pin7, 4=Red/Pin8)
      const outputPins = {
        1: { pin: 5, color: 'grey' },
        2: { pin: 6, color: 'pink' },
        3: { pin: 7, color: 'blue' },
        4: { pin: 8, color: 'red' }
      };
      const output = outputPins[channelNum];
      return output && pin.pin === output.pin;
    }

    return false;
  };

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

      {isPulseCounter ? (
        // Pulse Counter: Show both Communications and Inputs plugs
        <>
          {renderPlugTable(getPulseCounterCommsPins(), 'Inputs Plug', [3, 4])}
          {renderPlugTable(getPulseCounterInputsPins(), 'Communications Plug', [6])}
        </>
      ) : (
        // Normal display
        renderPlugTable(pins, 'Plug View')
      )}
    </div>
  );
};
