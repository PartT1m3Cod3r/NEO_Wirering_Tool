export const plugOptions = [
  {
    value: 'inputs',
    label: 'Inputs',
    types: [
      {
        value: '0-10v',
        label: '0-10V',
        deviceType: 'sensor-2wire',
        pins: [
          { pin: 1, color: 'white', function: 'Solar Input (5 to 24v)', deviceTerminal: 'Power+' },
          { pin: 2, color: 'brown', function: 'Ground', deviceTerminal: 'Power-' },
          { pin: 3, color: 'green', function: 'Sensor power out (5v/6v/12v/24v)', deviceTerminal: 'Vout+' },
          { pin: 4, color: 'yellow', function: 'Ground', deviceTerminal: 'Vout-' },
          { pin: 5, color: 'grey', function: 'Analog Input 4' },
          { pin: 6, color: 'pink', function: 'Analog Input 3' },
          { pin: 7, color: 'blue', function: 'Analog Input 2' },
          { pin: 8, color: 'red', function: 'Analog Input 1', deviceTerminal: 'Signal' }
        ],
        connections: {
          1: { neo: 'white', device: 'Power+', description: 'Connect solar/power supply positive to White (Pin 1)' },
          2: { neo: 'brown', device: 'Power-', description: 'Connect solar/power supply negative to Brown (Pin 2)' },
          3: { neo: 'red', device: 'Signal', description: 'Connect sensor signal wire to Red (Pin 8)' },
          4: { neo: 'green', device: 'Vout+', description: 'Connect sensor power wire to Green (Pin 3)' },
          5: { neo: 'yellow', device: 'Vout-', description: 'Connect sensor ground to Yellow (Pin 4)' }
        }
      },
      {
        value: '4-20ma',
        label: '4-20mA',
        deviceType: 'sensor-2wire',
        pins: [
          { pin: 1, color: 'white', function: 'Solar Input (5 to 24v)', deviceTerminal: 'Power+' },
          { pin: 2, color: 'brown', function: 'Ground', deviceTerminal: 'Power-' },
          { pin: 3, color: 'green', function: 'Sensor power out (5v/6v/12v/24v)', deviceTerminal: 'Vout+' },
          { pin: 4, color: 'yellow', function: 'Ground', deviceTerminal: 'Vout-' },
          { pin: 5, color: 'grey', function: 'Analog Input 4' },
          { pin: 6, color: 'pink', function: 'Analog Input 3' },
          { pin: 7, color: 'blue', function: 'Analog Input 2' },
          { pin: 8, color: 'red', function: 'Analog Input 1', deviceTerminal: 'Signal' }
        ],
        connections: {
          1: { neo: 'white', device: 'Power+', description: 'Connect solar/power supply positive to White (Pin 1)' },
          2: { neo: 'brown', device: 'Power-', description: 'Connect solar/power supply negative to Brown (Pin 2)' },
          3: { neo: 'red', device: 'Signal', description: 'Connect sensor signal wire to Red (Pin 8)' },
          4: { neo: 'green', device: 'Vout+', description: 'Connect sensor power wire to Green (Pin 3)' },
          5: { neo: 'yellow', device: 'Vout-', description: 'Connect sensor ground to Yellow (Pin 4)' }
        }
      },
      {
        value: 'voltage-sensing',
        label: 'Input Voltage Sensing',
        deviceType: 'sensor-2wire',
        pins: [
          { pin: 1, color: 'white', function: 'Solar Input (5 to 24v)', deviceTerminal: 'Power+' },
          { pin: 2, color: 'brown', function: 'Ground', deviceTerminal: 'Power-' },
          { pin: 3, color: 'green', function: 'Sensor power out (5v/6v/12v/24v)', deviceTerminal: 'Vout+' },
          { pin: 4, color: 'yellow', function: 'Ground', deviceTerminal: 'Vout-' },
          { pin: 5, color: 'grey', function: 'Analog Input 4' },
          { pin: 6, color: 'pink', function: 'Analog Input 3' },
          { pin: 7, color: 'blue', function: 'Analog Input 2' },
          { pin: 8, color: 'red', function: 'Analog Input 1', deviceTerminal: 'Signal' }
        ],
        connections: {
          1: { neo: 'white', device: 'Power+', description: 'Connect solar/power supply positive to White (Pin 1)' },
          2: { neo: 'brown', device: 'Power-', description: 'Connect solar/power supply negative to Brown (Pin 2)' },
          3: { neo: 'red', device: 'Signal', description: 'Connect sensor signal wire to Red (Pin 8)' },
          4: { neo: 'green', device: 'Vout+', description: 'Connect sensor power wire to Green (Pin 3)' },
          5: { neo: 'yellow', device: 'Vout-', description: 'Connect sensor ground to Yellow (Pin 4)' }
        }
      },
      {
        value: 'power-input',
        label: 'Power Input',
        deviceType: 'power-supply',
        pins: [
          { pin: 1, color: 'white', function: 'VCC+ (5 to 24v)', deviceTerminal: 'VCC+' },
          { pin: 2, color: 'brown', function: 'GND', deviceTerminal: 'GND' },
          { pin: 3, color: 'green', function: 'Not connected' },
          { pin: 4, color: 'yellow', function: 'Not connected' },
          { pin: 5, color: 'grey', function: 'Not connected' },
          { pin: 6, color: 'pink', function: 'Not connected' },
          { pin: 7, color: 'blue', function: 'Not connected' },
          { pin: 8, color: 'red', function: 'Not connected' }
        ],
        connections: {
          1: { neo: 'white', device: 'VCC+', description: 'Connect power supply positive to White (Pin 1)' },
          2: { neo: 'brown', device: 'GND', description: 'Connect power supply ground to Brown (Pin 2)' }
        }
      }
    ]
  },
  {
    value: 'communications',
    label: 'Communications',
    types: [
      {
        value: 'rs485',
        label: 'RS485',
        deviceType: 'rs485-module',
        pins: [
          { pin: 1, color: 'white', function: 'Solar Input (5 to 24v)', deviceTerminal: 'Power+' },
          { pin: 2, color: 'brown', function: 'Ground', deviceTerminal: 'Power-' },
          { pin: 3, color: 'green', function: 'RS485 B', deviceTerminal: 'B' },
          { pin: 4, color: 'yellow', function: 'RS485 A', deviceTerminal: 'A' },
          { pin: 5, color: 'grey', function: 'Digital Input 2' },
          { pin: 6, color: 'pink', function: 'Digital Input 1' },
          { pin: 7, color: 'blue', function: 'SDI-12 Data' },
          { pin: 8, color: 'red', function: 'Ground' }
        ],
        connections: {
          1: { neo: 'white', device: 'Power+', description: 'Connect solar/power supply positive to White (Pin 1)' },
          2: { neo: 'brown', device: 'Power-', description: 'Connect solar/power supply negative to Brown (Pin 2)' },
          3: { neo: 'green', device: 'B', description: 'Connect RS485 B to Green (Pin 3)' },
          4: { neo: 'yellow', device: 'A', description: 'Connect RS485 A to Yellow (Pin 4)' }
        }
      },
      {
        value: 'wiegand',
        label: 'Wiegand',
        deviceType: 'wiegand-module',
        pins: [
          { pin: 1, color: 'white', function: 'Solar Input (5 to 24v)', deviceTerminal: 'Power+' },
          { pin: 2, color: 'brown', function: 'Ground', deviceTerminal: 'Power-' },
          { pin: 3, color: 'green', function: 'RS485 B' },
          { pin: 4, color: 'yellow', function: 'RS485 A' },
          { pin: 5, color: 'grey', function: 'Wiegand Data 1 / D1', deviceTerminal: 'D1' },
          { pin: 6, color: 'pink', function: 'Wiegand Data 0 / D0', deviceTerminal: 'D0' },
          { pin: 7, color: 'blue', function: 'SDI-12 Data' },
          { pin: 8, color: 'red', function: 'Ground' }
        ],
        connections: {
          1: { neo: 'white', device: 'Power+', description: 'Connect solar/power supply positive to White (Pin 1)' },
          2: { neo: 'brown', device: 'Power-', description: 'Connect solar/power supply negative to Brown (Pin 2)' },
          3: { neo: 'pink', device: 'D0', description: 'Connect Wiegand D0 to Pink (Pin 6)' },
          4: { neo: 'grey', device: 'D1', description: 'Connect Wiegand D1 to Grey (Pin 5)' }
        }
      },
      {
        value: 'sdi12',
        label: 'SDI-12',
        deviceType: 'sdi12-module',
        pins: [
          { pin: 1, color: 'white', function: 'Solar Input (5 to 24v)', deviceTerminal: 'Power+' },
          { pin: 2, color: 'brown', function: 'Ground', deviceTerminal: 'Power-' },
          { pin: 3, color: 'green', function: 'RS485 B' },
          { pin: 4, color: 'yellow', function: 'RS485 A' },
          { pin: 5, color: 'grey', function: 'Digital Input 2' },
          { pin: 6, color: 'pink', function: 'Digital Input 1' },
          { pin: 7, color: 'blue', function: 'SDI-12 Data', deviceTerminal: 'Data' },
          { pin: 8, color: 'red', function: 'Ground' }
        ],
        connections: {
          1: { neo: 'white', device: 'Power+', description: 'Connect solar/power supply positive to White (Pin 1)' },
          2: { neo: 'brown', device: 'Power-', description: 'Connect solar/power supply negative to Brown (Pin 2)' },
          3: { neo: 'blue', device: 'Data', description: 'Connect SDI-12 Data to Blue (Pin 7)' }
        }
      },
      {
        value: 'pulse',
        label: 'Pulse Counter',
        deviceType: 'pulse-counter',
        pins: [
          { pin: 1, color: 'white', function: 'Solar Input (5 to 24v)', deviceTerminal: 'Power+' },
          { pin: 2, color: 'brown', function: 'Ground', deviceTerminal: 'Power-' },
          { pin: 3, color: 'green', function: 'Sensor power out (5v/6v/12v/24v)', deviceTerminal: 'Vout+' },
          { pin: 4, color: 'yellow', function: 'Ground', deviceTerminal: 'Vout-' },
          { pin: 5, color: 'grey', function: 'Digital Input 2', deviceTerminal: 'Signal' },
          { pin: 6, color: 'pink', function: 'Pulse input 1', deviceTerminal: 'Signal' },
          { pin: 7, color: 'blue', function: 'SDI-12 Data' },
          { pin: 8, color: 'red', function: 'Ground' }
        ],
        connections: {
          1: { neo: 'white', device: 'Power+', description: 'Connect solar/power supply positive to White (Pin 1)' },
          2: { neo: 'brown', device: 'Power-', description: 'Connect solar/power supply negative to Brown (Pin 2)' },
          3: { neo: 'green', device: 'Vout+', description: 'Connect sensor power to Green (Pin 3)' },
          4: { neo: 'yellow', device: 'Vout-', description: 'Connect ground to Yellow (Pin 4)' },
          5: { neo: 'pink', device: 'Signal', description: 'Connect pulse signal to Pink (Pin 6 - Digital Input 1)' }
        }
      },
      {
        value: 'power-input',
        label: 'Power Input',
        deviceType: 'power-supply',
        pins: [
          { pin: 1, color: 'white', function: 'VCC+ (5 to 24v)', deviceTerminal: 'VCC+' },
          { pin: 2, color: 'brown', function: 'GND', deviceTerminal: 'GND' },
          { pin: 3, color: 'green', function: 'Not connected' },
          { pin: 4, color: 'yellow', function: 'Not connected' },
          { pin: 5, color: 'grey', function: 'Not connected' },
          { pin: 6, color: 'pink', function: 'Not connected' },
          { pin: 7, color: 'blue', function: 'Not connected' },
          { pin: 8, color: 'red', function: 'Not connected' }
        ],
        connections: {
          1: { neo: 'white', device: 'VCC+', description: 'Connect power supply positive to White (Pin 1)' },
          2: { neo: 'brown', device: 'GND', description: 'Connect power supply ground to Brown (Pin 2)' }
        }
      }
    ]
  },
  {
    value: 'outputs',
    label: 'Outputs',
    types: [
      {
        value: 'latching',
        label: 'Latching',
        deviceType: 'relay',
        pins: [
          { pin: 1, color: 'white', function: 'Solar Input (5 to 24v)', deviceTerminal: 'Power' },
          { pin: 2, color: 'brown', function: 'Ground', deviceTerminal: 'GND' },
          { pin: 3, color: 'green', function: 'Actuator Power out (5v/6v/12v/24v)', deviceTerminal: 'V+ for Relay' },
          { pin: 4, color: 'yellow', function: 'Ground', deviceTerminal: 'GND for Relay' },
          { pin: 5, color: 'grey', function: 'Actuator Output 1', deviceTerminal: 'A1' },
          { pin: 6, color: 'pink', function: 'Actuator Output 2', deviceTerminal: 'A2' },
          { pin: 7, color: 'blue', function: 'Actuator Output 3', deviceTerminal: 'A3' },
          { pin: 8, color: 'red', function: 'Actuator Output 4', deviceTerminal: 'A4' }
        ]
      },
      {
        value: 'relay',
        label: 'Relay',
        deviceType: 'relay',
        pins: [
          { pin: 1, color: 'white', function: 'Solar Input (5 to 24v)', deviceTerminal: 'Power' },
          { pin: 2, color: 'brown', function: 'Ground', deviceTerminal: 'GND' },
          { pin: 3, color: 'green', function: 'Actuator Power out (5v/6v/12v/24v)', deviceTerminal: 'V+ for Relay' },
          { pin: 4, color: 'yellow', function: 'Ground', deviceTerminal: 'GND for Relay' },
          { pin: 5, color: 'grey', function: 'Actuator Output 1', deviceTerminal: 'A1' },
          { pin: 6, color: 'pink', function: 'Actuator Output 2', deviceTerminal: 'A2' },
          { pin: 7, color: 'blue', function: 'Actuator Output 3', deviceTerminal: 'A3' },
          { pin: 8, color: 'red', function: 'Actuator Output 4', deviceTerminal: 'A4' }
        ]
      },
      {
        value: 'transistor',
        label: 'Transistor',
        deviceType: 'transistor',
        pins: [
          { pin: 1, color: 'white', function: 'Solar Input (5 to 24v)', deviceTerminal: 'Power' },
          { pin: 2, color: 'brown', function: 'Ground', deviceTerminal: 'GND' },
          { pin: 3, color: 'green', function: 'Actuator Power out (5v/6v/12v/24v)', deviceTerminal: 'Base/Driver' },
          { pin: 4, color: 'yellow', function: 'Ground', deviceTerminal: 'Emitter' },
          { pin: 5, color: 'grey', function: 'Actuator Output 1', deviceTerminal: 'Collector 1' },
          { pin: 6, color: 'pink', function: 'Actuator Output 2', deviceTerminal: 'Collector 2' },
          { pin: 7, color: 'blue', function: 'Actuator Output 3', deviceTerminal: 'Collector 3' },
          { pin: 8, color: 'red', function: 'Actuator Output 4', deviceTerminal: 'Collector 4' }
        ]
      },
      {
        value: 'power-input',
        label: 'Power Input',
        deviceType: 'power-supply',
        pins: [
          { pin: 1, color: 'white', function: 'VCC+ (5 to 24v)', deviceTerminal: 'VCC+' },
          { pin: 2, color: 'brown', function: 'GND', deviceTerminal: 'GND' },
          { pin: 3, color: 'green', function: 'Not connected' },
          { pin: 4, color: 'yellow', function: 'Not connected' },
          { pin: 5, color: 'grey', function: 'Not connected' },
          { pin: 6, color: 'pink', function: 'Not connected' },
          { pin: 7, color: 'blue', function: 'Not connected' },
          { pin: 8, color: 'red', function: 'Not connected' }
        ],
        connections: {
          1: { neo: 'white', device: 'VCC+', description: 'Connect power supply positive to White (Pin 1)' },
          2: { neo: 'brown', device: 'GND', description: 'Connect power supply ground to Brown (Pin 2)' }
        }
      }
    ]
  }
];

export const colorMap = {
  white: '#FFFFFF',
  brown: '#8B4513',
  green: '#00FF00',
  yellow: '#FFFF00',
  grey: '#808080',
  pink: '#FFC0CB',
  blue: '#0000FF',
  red: '#FF0000'
};

export const deviceInfo = {
  'relay': {
    name: 'Relay',
    terminals: ['A1', 'A2', 'V+', 'GND'],
    description: 'Standard relay with coil terminals'
  },
  'sensor-2wire': {
    name: '2-Wire Sensor',
    terminals: ['Signal', 'Power+'],
    description: '2-wire analog sensor (power + signal combined)'
  },
  'rs485-module': {
    name: 'RS485 Module',
    terminals: ['A', 'B'],
    description: 'RS485 communication module'
  },
  'wiegand-module': {
    name: 'Wiegand Reader',
    terminals: ['D0', 'D1'],
    description: 'Wiegand communication device'
  },
  'sdi12-module': {
    name: 'SDI-12 Device',
    terminals: ['Data'],
    description: 'SDI-12 sensor or device'
  },
  'transistor': {
    name: 'Transistor Output',
    terminals: ['Base/Driver', 'Emitter', 'Collector'],
    description: 'Transistor output driver'
  },
  'pulse-counter': {
    name: 'Pulse Counter',
    terminals: ['Power+', 'GND', 'Signal'],
    description: 'Pulse counter sensor using digital inputs'
  },
  'power-supply': {
    name: 'Power Input',
    terminals: ['Power+', 'Power-'],
    description: 'Solar or PSU power input connection'
  }
};

