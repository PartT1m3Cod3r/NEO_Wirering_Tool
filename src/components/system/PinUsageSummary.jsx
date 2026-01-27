import { colorMap } from '../../data/plugData';

export const PinUsageSummary = ({ connectedDevices, pinConflicts }) => {
  // Get used pins for a device - returns object with plugType and pins
  const getUsedPins = (device) => {
    const pins = {
      plugType: device.plugType,
      signalPins: [],
      powerPins: [],
      all: []
    };

    if (device.plugType === 'inputs') {
      const channelPins = {
        1: { signal: [8], power: [3, 4] },
        2: { signal: [7], power: [3, 4] },
        3: { signal: [6], power: [3, 4] },
        4: { signal: [5], power: [3, 4] }
      };
      const channel = channelPins[device.channel];
      if (channel) {
        pins.signalPins.push(...channel.signal);
        pins.powerPins.push(...channel.power);
        pins.all.push(...channel.signal, ...channel.power);
      }
    } else if (device.plugType === 'outputs') {
      if (device.type === 'latching') {
        if (device.output === 1) {
          pins.signalPins.push(5, 6);
          pins.powerPins.push(4);
          pins.all.push(5, 6, 4);
        } else if (device.output === 3) {
          pins.signalPins.push(7, 8);
          pins.powerPins.push(4);
          pins.all.push(7, 8, 4);
        }
      } else {
        const outputPins = {
          1: { signal: [5], power: [4] },
          2: { signal: [6], power: [4] },
          3: { signal: [7], power: [4] },
          4: { signal: [8], power: [4] }
        };
        const output = outputPins[device.output];
        if (output) {
          pins.signalPins.push(...output.signal);
          pins.powerPins.push(...output.power);
          pins.all.push(...output.signal, ...output.power);
        }
      }
    } else if (device.plugType === 'communications') {
      if (device.type === 'rs485') {
        pins.signalPins.push(3, 4);
        pins.all.push(3, 4);
      } else if (device.type === 'wiegand') {
        pins.signalPins.push(6, 5);
        pins.all.push(6, 5);
      } else if (device.type === 'sdi12') {
        pins.signalPins.push(7, 8);
        pins.all.push(7, 8);
      } else if (device.type === 'pulse') {
        const inputNum = device.input || 1;
        pins.signalPins.push(inputNum === 1 ? 6 : 5);
        pins.powerPins.push(3, 4);
        pins.all.push(3, 4, inputNum === 1 ? 6 : 5);
      }
    }

    return pins;
  };

  // Build pin usage map per plug type
  const pinUsageByPlug = {
    inputs: {},
    communications: {},
    outputs: {}
  };

  connectedDevices.forEach(device => {
    const usedPins = getUsedPins(device);
    const plugType = device.plugType;

    usedPins.all.forEach(pin => {
      if (!pinUsageByPlug[plugType][pin]) {
        pinUsageByPlug[plugType][pin] = [];
      }
      pinUsageByPlug[plugType][pin].push(device);
    });
  });

  // Pin color mapping
  const pinColors = {
    1: { color: 'white', name: 'White' },
    2: { color: 'brown', name: 'Brown' },
    3: { color: 'green', name: 'Green' },
    4: { color: 'yellow', name: 'Yellow' },
    5: { color: 'grey', name: 'Grey' },
    6: { color: 'pink', name: 'Pink' },
    7: { color: 'blue', name: 'Blue' },
    8: { color: 'red', name: 'Red' }
  };

  // Get conflict status for a pin on a specific plug
  const isPinConflict = (pin, plugType) => {
    return pinConflicts.some(c => c.pin === pin && c.plugType === plugType);
  };

  // Get devices by plug type
  const devicesByPlug = {
    inputs: connectedDevices.filter(d => d.plugType === 'inputs'),
    communications: connectedDevices.filter(d => d.plugType === 'communications'),
    outputs: connectedDevices.filter(d => d.plugType === 'outputs')
  };

  const plugLabels = {
    inputs: 'Inputs Plug',
    communications: 'Communications Plug',
    outputs: 'Outputs Plug'
  };

  // Render pin list for a plug type
  const renderPinList = (plugType) => {
    const pinUsage = pinUsageByPlug[plugType];
    const pins = Object.entries(pinUsage).sort((a, b) => a[0] - b[0]);

    if (pins.length === 0) return null;

    return (
      <div key={plugType} className="plug-pin-section">
        <h5>{plugLabels[plugType]}</h5>
        {pins.map(([pin, devices]) => {
          const pinNum = parseInt(pin);
          const pinInfo = pinColors[pinNum];
          const hasConflict = isPinConflict(pinNum, plugType);
          const isPowerPin = pinNum === 3 || pinNum === 4;

          return (
            <div
              key={pin}
              className={`pin-item ${hasConflict ? 'conflict' : ''} ${isPowerPin ? 'power-pin' : ''}`}
            >
              <div
                className="pin-indicator"
                style={{ backgroundColor: colorMap[pinInfo?.color] || '#888' }}
              />
              <div className="pin-info">
                <span className="pin-number">Pin {pin}</span>
                <span className="pin-color-name">{pinInfo?.name}</span>
                <span className="pin-device-count">
                  {devices.length} device{devices.length !== 1 ? 's' : ''}
                  {isPowerPin && ' (shared)'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="pin-usage-summary">
      <h3>Pin Usage Summary</h3>

      {connectedDevices.length === 0 ? (
        <p className="empty-message">No devices connected</p>
      ) : (
        <>
          <div className="device-count">
            {connectedDevices.length} device{connectedDevices.length !== 1 ? 's' : ''} connected
          </div>

          {pinConflicts.length > 0 && (
            <div className="conflict-alert">
              <strong>⚠️ Pin Conflicts Detected</strong>
              <ul>
                {pinConflicts.map((conflict, idx) => (
                  <li key={idx}>
                    {conflict.plugType} Pin {conflict.pin} ({pinColors[conflict.pin]?.name || 'Unknown'})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pin-list">
            <h4>Used Pins by Plug</h4>
            {renderPinList('inputs')}
            {renderPinList('communications')}
            {renderPinList('outputs')}
          </div>
        </>
      )}
    </div>
  );
};
