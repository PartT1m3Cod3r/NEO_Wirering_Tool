export const DeviceConfigPanel = ({ device, onUpdate, onRemove, availableDevices }) => {
  if (!device) {
    return (
      <div className="device-config-panel empty">
        <h3>Device Configuration</h3>
        <p>Select a device from the diagram to configure it</p>
      </div>
    );
  }

  const handleChannelChange = (e) => {
    onUpdate(device.id, { channel: parseInt(e.target.value) });
  };

  const handleOutputChange = (e) => {
    onUpdate(device.id, { output: parseInt(e.target.value) });
  };

  const handleInputChange = (e) => {
    onUpdate(device.id, { input: parseInt(e.target.value) });
  };

  const handlePowerSourceChange = (e) => {
    onUpdate(device.id, { powerSource: e.target.value });
  };

  const getChannelOptions = () => {
    if (device.channels) {
      return device.channels.map(ch => ({
        value: ch,
        label: `Channel ${ch} - ${getChannelColor(ch)} (Pin ${getChannelPin(ch)})`
      }));
    }
    return [];
  };

  const getOutputOptions = () => {
    if (device.type === 'latching') {
      return [
        { value: 1, label: 'Output 1 (Latching Relay 1: Out 1+2)' },
        { value: 3, label: 'Output 3 (Latching Relay 2: Out 3+4)' }
      ];
    }
    if (device.outputs) {
      return device.outputs.map(out => ({
        value: out,
        label: `Output ${out} - ${getOutputColor(out)} (Pin ${getOutputPin(out)})`
      }));
    }
    return [];
  };

  const getChannelColor = (ch) => {
    const colors = { 1: 'Red', 2: 'Blue', 3: 'Pink', 4: 'Grey' };
    return colors[ch] || 'Unknown';
  };

  const getChannelPin = (ch) => {
    const pins = { 1: 8, 2: 7, 3: 6, 4: 5 };
    return pins[ch] || '?';
  };

  const getOutputColor = (out) => {
    const colors = { 1: 'Grey', 2: 'Pink', 3: 'Blue', 4: 'Red' };
    return colors[out] || 'Unknown';
  };

  const getOutputPin = (out) => {
    const pins = { 1: 5, 2: 6, 3: 7, 4: 8 };
    return pins[out] || '?';
  };

  return (
    <div className="device-config-panel">
      <h3>Device Configuration</h3>

      <div className="config-section">
        <h4>{device.label}</h4>
        <p className="device-type">Type: {device.type}</p>
        <p className="device-plug">Plug: {device.plugType}</p>
      </div>

      <div className="config-section">
        <label htmlFor="device-name">Name:</label>
        <input
          type="text"
          id="device-name"
          value={device.label}
          onChange={(e) => onUpdate(device.id, { label: e.target.value })}
          className="device-name-input"
        />
      </div>

      {device.channels && (
        <div className="config-section">
          <label htmlFor="channel-select">Channel:</label>
          <select
            id="channel-select"
            value={device.channel || ''}
            onChange={handleChannelChange}
          >
            {getChannelOptions().map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {device.outputs && (
        <div className="config-section">
          <label htmlFor="output-select">Output:</label>
          <select
            id="output-select"
            value={device.output || ''}
            onChange={handleOutputChange}
          >
            {getOutputOptions().map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {device.inputs && (
        <div className="config-section">
          <label htmlFor="input-select">Digital Input:</label>
          <select
            id="input-select"
            value={device.input || ''}
            onChange={handleInputChange}
          >
            {device.inputs.map(inp => (
              <option key={inp} value={inp}>
                Input {inp} - {inp === 1 ? 'Pink (Pin 6)' : 'Grey (Pin 5)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {device.powerSource && (
        <div className="config-section">
          <label htmlFor="power-source-select">Power Source:</label>
          <select
            id="power-source-select"
            value={device.powerSource || 'Solar'}
            onChange={handlePowerSourceChange}
          >
            <option value="Solar">Solar</option>
            <option value="PSU">PSU (Power Supply Unit)</option>
          </select>
        </div>
      )}

      <div className="config-actions">
        <button
          className="btn-remove"
          onClick={() => onRemove(device.id)}
        >
          Remove Device
        </button>
      </div>

      <div className="wiring-legend">
        <h4>Wiring Connections</h4>
        <div className="connection-list">
          {getWiringConnections(device).map((conn, idx) => (
            <div key={idx} className="connection-item">
              <span className="dot" style={{ backgroundColor: conn.colorCode }}></span>
              <span className="pin-text">
                <strong>Pin {conn.pin}</strong> ({conn.colorName})
              </span>
              <span className="arrow">→</span>
              <span className="device-label">{conn.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper: Generate list of connections for a device
const getWiringConnections = (device) => {
  const connections = [];
  const colorNames = { 1: 'White', 2: 'Brown', 3: 'Green', 4: 'Yellow', 5: 'Grey', 6: 'Pink', 7: 'Blue', 8: 'Red' };
  const colorCodes = { 1: '#FFFFFF', 2: '#8B4513', 3: '#00FF00', 4: '#FFFF00', 5: '#808080', 6: '#FFC0CB', 7: '#0000FF', 8: '#FF0000' };

  const addConn = (pin, label) => {
    connections.push({
      pin,
      label,
      colorName: colorNames[pin],
      colorCode: colorCodes[pin]
    });
  };

  if (device.plugType === 'inputs') {
    if (device.type === 'power-input') {
      // Power input - only pins 1 and 2
      addConn(1, 'VCC+');
      addConn(2, 'GND');
    } else {
      // Solar power pins (always present)
      addConn(1, 'Solar/Supply +');
      addConn(2, 'GND');
      // Signal and sensor power
      const channelPins = { 1: 8, 2: 7, 3: 6, 4: 5 };
      const pin = channelPins[device.channel];
      if (pin) addConn(pin, 'Signal');
      addConn(3, 'Sensor Vout+');
      addConn(4, 'Sensor GND');
    }
  }
  else if (device.plugType === 'outputs') {
    // Solar power pins (always present)
    addConn(1, 'Solar/Supply +');
    addConn(2, 'GND');
    // Actuator connections
    if (device.type === 'latching') {
      if (device.output === 1) {
        addConn(5, 'A1');
        addConn(6, 'A2');
      } else if (device.output === 3) {
        addConn(7, 'A3');
        addConn(8, 'A4');
      }
      addConn(4, 'Actuator GND');
    } else {
      const outputPins = { 1: 5, 2: 6, 3: 7, 4: 8 };
      const pin = outputPins[device.output];
      if (pin) addConn(pin, `Out ${device.output}`);
      addConn(4, 'Actuator GND');
    }
  }
  else if (device.plugType === 'power') {
    // Power input - only pins 1 and 2
    const sourceLabel = device.powerSource || 'Solar';
    addConn(1, `${sourceLabel} +`);
    addConn(2, `${sourceLabel} -`);
  }
  else if (device.plugType === 'communications') {
    // Solar power pins (always present for all comms devices)
    addConn(1, 'Solar/Supply +');
    addConn(2, 'GND');
    // Device-specific connections
    if (device.type === 'rs485') {
      addConn(3, 'B');
      addConn(4, 'A');
    } else if (device.type === 'wiegand') {
      addConn(6, 'D0');
      addConn(5, 'D1');
    } else if (device.type === 'sdi12') {
      addConn(7, 'Data');
      addConn(8, 'GND');
    } else if (device.type === 'pulse') {
      const inputNum = device.input || 1;
      addConn(inputNum === 1 ? 6 : 5, 'Signal');
      addConn(3, 'Sensor Vout+');
      addConn(4, 'Sensor GND');
    }
  }

  return connections;
};
