export const DeviceConfigPanel = ({ device, onUpdate, onRemove, availableDevices }) => {
  if (!device) {
    return (
      <div className="device-config-panel empty">
        <h3>Device Configuration</h3>
        <p>Select a device from the diagram to configure</p>
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

  const handleWireNumberChange = (edgeKey, value) => {
    const wireNumbers = { ...(device.wireNumbers || {}) };
    wireNumbers[edgeKey] = value;
    onUpdate(device.id, { wireNumbers });
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

  // Get wire number inputs for each connection
  const getWireNumberInputs = () => {
    const connections = getWiringConnections(device);
    const wireNumbers = device.wireNumbers || {};
    
    return connections.map((conn, idx) => {
      // Generate edge key based on connection type
      let edgeKey = '';
      if (conn.label.includes('VCC') || conn.label.includes('Pin 1')) edgeKey = 'vcc';
      else if (conn.label.includes('GND') && conn.pin === 2) edgeKey = 'gnd';
      else if (conn.label.includes('Power') || conn.label.includes('Vout')) edgeKey = 'power';
      else if (conn.label.includes('GND') || conn.label.includes('Sensor GND')) edgeKey = 'gnd';
      else if (conn.label.includes('Signal')) edgeKey = 'signal';
      else if (conn.label === 'A1' || conn.label === 'A3') edgeKey = 'a1';
      else if (conn.label === 'A2' || conn.label === 'A4') edgeKey = 'a2';
      else if (conn.label === 'Out 1' || conn.label === 'Out 2' || conn.label === 'Out 3' || conn.label === 'Out 4') edgeKey = 'a1';
      else if (conn.label === 'B') edgeKey = 'b';
      else if (conn.label === 'A') edgeKey = 'a';
      else if (conn.label === 'D0') edgeKey = 'd0';
      else if (conn.label === 'D1') edgeKey = 'd1';
      else if (conn.label === 'Data') edgeKey = 'data';
      else edgeKey = `conn-${idx}`;
      
      // Generate default wire number
      const defaultWireNum = generateDefaultWireNumber(conn, idx);
      
      return {
        ...conn,
        edgeKey,
        currentValue: wireNumbers[edgeKey] || defaultWireNum
      };
    });
  };

  const generateDefaultWireNumber = (conn, idx) => {
    const baseNum = 100 + (idx * 10);
    return `${baseNum}`;
  };

  const wireInputs = getWireNumberInputs();

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

      {device.channels && device.type !== 'power-input' && (
        <div className="config-section">
          <label htmlFor="wire-mode-select">Wiring Mode:</label>
          <select
            id="wire-mode-select"
            value={device.wireMode || '3-wire'}
            onChange={(e) => onUpdate(device.id, { wireMode: e.target.value })}
          >
            <option value="2-wire">2-Wire (Signal + Power, no GND)</option>
            <option value="3-wire">3-Wire (Signal + Power + GND)</option>
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

      {/* Wire Number Editor */}
      <div className="config-section wire-number-section">
        <h4>Wire Numbers</h4>
        <div className="wire-number-list">
          {wireInputs.map((conn, idx) => (
            <div key={idx} className="wire-number-item">
              <div className="wire-number-info">
                <span className="dot" style={{ backgroundColor: conn.colorCode }}></span>
                <span className="wire-label-text">{conn.label}</span>
              </div>
              <input
                type="text"
                value={conn.currentValue}
                onChange={(e) => handleWireNumberChange(conn.edgeKey, e.target.value)}
                className="wire-number-input"
                placeholder="###"
                maxLength={6}
              />
            </div>
          ))}
        </div>
      </div>

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
      // Check wire mode - 2-wire excludes GND pins
      const is2Wire = device.wireMode === '2-wire';
      
      // Signal and sensor power (always shown)
      const channelPins = { 1: 8, 2: 7, 3: 6, 4: 5 };
      const pin = channelPins[device.channel];
      if (pin) addConn(pin, 'Signal');
      addConn(3, 'Sensor Vout+');
      
      // Only show GND connections for 3-wire mode
      if (!is2Wire) {
        addConn(4, 'Sensor GND');
      }
    }
  }
  else if (device.plugType === 'outputs') {
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
