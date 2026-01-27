import { colorMap, deviceInfo } from '../data/plugData';

export const WiringDiagram = ({ plugType, typeData, outputNumber }) => {
  if (!typeData || !plugType) {
    return (
      <div className="wiring-diagram">
        <div className="diagram-placeholder">
          <p>Select a plug type and configuration to view wiring diagram</p>
        </div>
      </div>
    );
  }

  const deviceTypeInfo = deviceInfo[typeData.deviceType];

  if (!deviceTypeInfo) {
    return null;
  }

  const showDeviceDiagram = () => {
    if (plugType === 'outputs' && outputNumber && typeData.deviceType === 'relay') {
      return renderRelayDiagram(outputNumber, typeData);
    } else if (plugType === 'inputs' && typeData.deviceType.includes('sensor')) {
      return renderSensorDiagram(typeData);
    } else if (plugType === 'communications') {
      return renderCommunicationDiagram(typeData);
    }

    return null;
  };

  return (
    <div className="wiring-diagram">
      <h3>Wiring Diagram - {deviceTypeInfo.name}</h3>
      <div className="diagram-container">
        {showDeviceDiagram()}
      </div>
      <div className="connection-instructions">
        <h4>Connection Instructions:</h4>
        {renderConnectionInstructions(typeData, outputNumber)}
      </div>
    </div>
  );
};

const renderRelayDiagram = (outputNum, typeData) => {
  const outputConnections = {
    '1': { neoPin: '5', neoColor: 'grey', terminal: 'A1', pinColor: 'grey' },
    '2': { neoPin: '6', neoColor: 'pink', terminal: 'A2', pinColor: 'pink' },
    '3': { neoPin: '7', neoColor: 'blue', terminal: 'A3', pinColor: 'blue' },
    '4': { neoPin: '8', neoColor: 'red', terminal: 'A4', pinColor: 'red' }
  };

  const connection = outputConnections[outputNum];

  if (!connection) return null;

  return (
    <div className="relay-diagram">
      <div className="neo-device">
        <h4>Neo Device</h4>
        <div className="neo-plug">
          <div className="pin" style={{ backgroundColor: colorMap['green'] }}>
            3<br/>Green<br/>V+
          </div>
          <div className="pin" style={{ backgroundColor: colorMap['yellow'] }}>
            4<br/>Yellow<br/>GND
          </div>
          <div className="pin" style={{ backgroundColor: colorMap[connection.pinColor], border: '2px solid #333' }}>
            {connection.neoPin}<br/>{connection.neoColor.charAt(0).toUpperCase() + connection.neoColor.slice(1)}<br/>A{outputNum}
          </div>
        </div>
      </div>

      <div className="connections">
        <div className="wire" style={{ backgroundColor: colorMap['green'] }}>
          <span>Actuator Power</span>
        </div>
        <div className="wire" style={{ backgroundColor: colorMap['yellow'] }}>
          <span>Actuator GND</span>
        </div>
        <div className="wire" style={{ backgroundColor: colorMap[connection.pinColor], border: '2px solid #333' }}>
          <span>Output {outputNum}</span>
        </div>
      </div>

      <div className="external-device">
        <h4>{typeData.label} Relay</h4>
        <div className="relay-terminals">
          <div className="terminal">V+</div>
          <div className="terminal">GND</div>
          <div className="terminal" style={{ border: '2px solid #333' }}>A{outputNum}</div>
        </div>
      </div>
    </div>
  );
};

const renderSensorDiagram = (typeData) => {
  return (
    <div className="sensor-diagram">
      <div className="neo-device">
        <h4>Neo Device</h4>
        <div className="neo-plug">
          <div className="pin" style={{ backgroundColor: colorMap['green'] }}>
            3<br/>Green<br/>Power Out
          </div>
          <div className="pin" style={{ backgroundColor: colorMap['yellow'] }}>
            4<br/>Yellow<br/>GND
          </div>
          <div className="pin" style={{ backgroundColor: colorMap['red'] }}>
            8<br/>Red<br/>Signal
          </div>
        </div>
      </div>

      <div className="connections">
        <div className="wire" style={{ backgroundColor: colorMap['green'] }}>
          <span>Power+</span>
        </div>
        <div className="wire" style={{ backgroundColor: colorMap['yellow'] }}>
          <span>Ground</span>
        </div>
        <div className="wire" style={{ backgroundColor: colorMap['red'] }}>
          <span>Signal</span>
        </div>
      </div>

      <div className="external-device">
        <h4>{typeData.label} Sensor</h4>
        <div className="sensor-body">
          <div className="sensor-wires">
            <div className="wire-connector" style={{ backgroundColor: colorMap['red'] }}>
              Red<br/>Signal
            </div>
            <div className="wire-connector" style={{ backgroundColor: colorMap['green'] }}>
              Green<br/>Power+
            </div>
            <div className="wire-connector" style={{ backgroundColor: colorMap['yellow'] }}>
              Yellow<br/>GND
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const renderCommunicationDiagram = (typeData) => {
  const connectionMap = {
    'rs485': [
      { neoPin: '3', neoColor: 'green', terminal: 'B' },
      { neoPin: '4', neoColor: 'yellow', terminal: 'A' }
    ],
    'wiegand': [
      { neoPin: '3', neoColor: 'green', terminal: 'D0' },
      { neoPin: '4', neoColor: 'yellow', terminal: 'D1' }
    ],
    'sdi12': [
      { neoPin: '7', neoColor: 'blue', terminal: 'Data' }
    ]
  };

  const connections = connectionMap[typeData.value] || [];

  return (
    <div className="communication-diagram">
      <div className="neo-device">
        <h4>Neo Device</h4>
        <div className="neo-plug">
          {connections.map((conn, idx) => (
            <div key={idx} className="pin" style={{ backgroundColor: colorMap[conn.neoColor] }}>
              {conn.neoPin}<br/>{conn.neoColor.charAt(0).toUpperCase() + conn.neoColor.slice(1)}<br/>{conn.terminal}
            </div>
          ))}
        </div>
      </div>

      <div className="connections">
        {connections.map((conn, idx) => (
          <div key={idx} className="wire" style={{ backgroundColor: colorMap[conn.neoColor] }}>
            <span>{conn.terminal}</span>
          </div>
        ))}
      </div>

      <div className="external-device">
        <h4>{typeData.label} Device</h4>
        <div className="device-terminals">
          {connections.map((conn, idx) => (
            <div key={idx} className="terminal">
              {conn.terminal}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const renderConnectionInstructions = (typeData, outputNumber) => {
  if (typeData.deviceType === 'relay' && outputNumber) {
    const connections = {
      '1': [
        { step: 1, wire: 'Grey', pin: 5, terminal: 'A1', description: 'Connect Grey wire (Pin 5) to relay terminal A1' },
        { step: 2, wire: 'Green', pin: 3, terminal: 'V+', description: 'Connect Green wire (Pin 3) to relay V+ terminal for power' },
        { step: 3, wire: 'Yellow', pin: 4, terminal: 'GND', description: 'Connect Yellow wire (Pin 4) to relay GND terminal' }
      ],
      '2': [
        { step: 1, wire: 'Pink', pin: 6, terminal: 'A2', description: 'Connect Pink wire (Pin 6) to relay terminal A2' },
        { step: 2, wire: 'Green', pin: 3, terminal: 'V+', description: 'Connect Green wire (Pin 3) to relay V+ terminal for power' },
        { step: 3, wire: 'Yellow', pin: 4, terminal: 'GND', description: 'Connect Yellow wire (Pin 4) to relay GND terminal' }
      ],
      '3': [
        { step: 1, wire: 'Blue', pin: 7, terminal: 'A3', description: 'Connect Blue wire (Pin 7) to relay terminal A3' },
        { step: 2, wire: 'Green', pin: 3, terminal: 'V+', description: 'Connect Green wire (Pin 3) to relay V+ terminal for power' },
        { step: 3, wire: 'Yellow', pin: 4, terminal: 'GND', description: 'Connect Yellow wire (Pin 4) to relay GND terminal' }
      ],
      '4': [
        { step: 1, wire: 'Red', pin: 8, terminal: 'A4', description: 'Connect Red wire (Pin 8) to relay terminal A4' },
        { step: 2, wire: 'Green', pin: 3, terminal: 'V+', description: 'Connect Green wire (Pin 3) to relay V+ terminal for power' },
        { step: 3, wire: 'Yellow', pin: 4, terminal: 'GND', description: 'Connect Yellow wire (Pin 4) to relay GND terminal' }
      ]
    };

    const outputConnections = connections[outputNumber];
    if (!outputConnections) return null;

    return (
      <ol>
        {outputConnections.map(conn => (
          <li key={conn.step}>
            <strong>{conn.wire}</strong> (Pin {conn.pin}) → <strong>{conn.terminal}</strong>: {conn.description}
          </li>
        ))}
      </ol>
    );
  } else if (typeData.deviceType.includes('sensor')) {
    return (
      <ol>
        <li>
          <strong>Red</strong> (Pin 8) → <strong>Signal</strong>: Connect sensor signal wire to Red
        </li>
        <li>
          <strong>Green</strong> (Pin 3) → <strong>Power+</strong>: Connect sensor positive/power wire to Green
        </li>
        <li>
          <strong>Yellow</strong> (Pin 4) → <strong>Ground</strong>: Connect sensor ground to Yellow
        </li>
      </ol>
    );
  } else if (typeData.value === 'rs485') {
    return (
      <ol>
        <li><strong>Green</strong> (Pin 3) → <strong>B</strong>: Connect RS485 B terminal</li>
        <li><strong>Yellow</strong> (Pin 4) → <strong>A</strong>: Connect RS485 A terminal</li>
      </ol>
    );
  } else if (typeData.value === 'wiegand') {
    return (
      <ol>
        <li><strong>Green</strong> (Pin 3) → <strong>D0</strong>: Connect Wiegand D0 terminal</li>
        <li><strong>Yellow</strong> (Pin 4) → <strong>D1</strong>: Connect Wiegand D1 terminal</li>
      </ol>
    );
  } else if (typeData.value === 'sdi12') {
    return (
      <ol>
        <li><strong>Blue</strong> (Pin 7) → <strong>Data</strong>: Connect SDI-12 Data terminal</li>
      </ol>
    );
  }

  return null;
};
