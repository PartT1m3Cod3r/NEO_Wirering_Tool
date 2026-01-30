import { useState } from 'react'
import { plugOptions } from './data/plugData'
import { PlugDisplay } from './components/PlugDisplay'
import { ReactFlowDiagram } from './components/ReactFlowDiagram'
import './App.css'

function App() {
  const [selectedPlug, setSelectedPlug] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedOutput, setSelectedOutput] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('')
  const [wireMode, setWireMode] = useState('3-wire')

  const selectedPlugData = plugOptions.find(p => p.value === selectedPlug)
  const selectedTypeData = selectedPlugData?.types.find(t => t.value === selectedType)

  const handlePlugChange = (e) => {
    setSelectedPlug(e.target.value)
    setSelectedType('')
    setSelectedOutput('')
    setSelectedChannel('')
    setWireMode('3-wire')
  }

  // Determine which pins are used for the current configuration
  const getUsedPins = () => {
    if (!selectedPlug || !selectedTypeData) return [];

    const pins = [];

    if (selectedPlug === 'inputs') {
      if (selectedTypeData.value === 'power-input') {
        // Power input only uses pins 1 & 2
        pins.push(1, 2);
      } else if (selectedChannel) {
        // Map channel to signal pin
        const channelPins = { 1: 8, 2: 7, 3: 6, 4: 5 };
        pins.push(channelPins[selectedChannel]);
        // Power (Pin 3) always used for sensors
        pins.push(3);
        // GND (Pin 4) only for 3-wire mode
        if (wireMode === '3-wire') {
          pins.push(4);
        }
      }
    } else if (selectedPlug === 'outputs') {
      if (selectedTypeData.value === 'power-input') {
        // Power input only uses pins 1 & 2
        pins.push(1, 2);
      } else if (selectedOutput) {
        // Map output to pins
        const outputPins = { 1: 5, 2: 6, 3: 7, 4: 8 };
        pins.push(outputPins[selectedOutput]);
        // GND (Pin 4) always used for outputs
        pins.push(4);
        // For latching with output 3, also add pin 8
        if (selectedTypeData.value === 'latching') {
          if (selectedOutput === '1') {
            pins.push(6); // A2
          } else if (selectedOutput === '3') {
            pins.push(8); // A4
          }
        }
      }
    } else if (selectedPlug === 'communications') {
      // Communications devices
      if (selectedTypeData.value === 'power-input') {
        // Power input only uses pins 1 & 2
        pins.push(1, 2);
      } else if (selectedTypeData.value === 'rs485') {
        pins.push(3, 4); // B and A
      } else if (selectedTypeData.value === 'wiegand') {
        pins.push(5, 6); // D1, D0
      } else if (selectedTypeData.value === 'sdi12') {
        pins.push(7, 8); // Data, GND
      } else if (selectedTypeData.value === 'pulse') {
        pins.push(3, 4, 6); // Power, GND, Signal
      }
    }

    return [...new Set(pins)].sort((a, b) => a - b);
  };

  const usedPins = getUsedPins();

  // Filter pins for display
  const getFilteredPins = () => {
    if (!selectedTypeData?.pins) return [];
    return selectedTypeData.pins.filter(pin => usedPins.includes(pin.pin));
  };

  // Filter legend items based on used pins
  const getLegendItems = () => {
    const allColors = [
      { pin: 1, color: '#FFFFFF', name: 'White', border: true },
      { pin: 2, color: '#8B4513', name: 'Brown' },
      { pin: 3, color: '#00FF00', name: 'Green' },
      { pin: 4, color: '#FFFF00', name: 'Yellow' },
      { pin: 5, color: '#808080', name: 'Grey' },
      { pin: 6, color: '#FFC0CB', name: 'Pink' },
      { pin: 7, color: '#0000FF', name: 'Blue' },
      { pin: 8, color: '#FF0000', name: 'Red' },
    ];
    
    if (usedPins.length === 0) return allColors;
    return allColors.filter(item => usedPins.includes(item.pin));
  };

  return (
    <div className="app">
      <div className="controls">
        <div className="dropdown-group">
          <label htmlFor="plug-select">Plug Type:</label>
          <select
            id="plug-select"
            value={selectedPlug}
            onChange={handlePlugChange}
          >
            <option value="">Select Plug Type</option>
            {plugOptions.map(plug => (
              <option key={plug.value} value={plug.value}>
                {plug.label}
              </option>
            ))}
          </select>
        </div>

        {selectedPlugData && (
          <div className="dropdown-group">
            <label htmlFor="type-select">Type:</label>
            <select
              id="type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Select Type</option>
              {selectedPlugData.types.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedPlug === 'inputs' && selectedTypeData && selectedTypeData.value !== 'power-input' && (
          <>
            <div className="dropdown-group">
              <label htmlFor="channel-select">Channel Number:</label>
              <select
                id="channel-select"
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
              >
                <option value="">Select Channel</option>
                <option value="1">Channel 1 - Red (Pin 8)</option>
                <option value="2">Channel 2 - Blue (Pin 7)</option>
                <option value="3">Channel 3 - Pink (Pin 6)</option>
                <option value="4">Channel 4 - Grey (Pin 5)</option>
              </select>
            </div>
            <div className="dropdown-group">
              <label htmlFor="wire-mode-select">Wiring Mode:</label>
              <select
                id="wire-mode-select"
                value={wireMode}
                onChange={(e) => setWireMode(e.target.value)}
              >
                <option value="2-wire">2-Wire (Signal + Power)</option>
                <option value="3-wire">3-Wire (Signal + Power + GND)</option>
              </select>
            </div>
          </>
        )}

        {selectedPlug === 'outputs' && selectedTypeData && selectedTypeData.value !== 'power-input' && (
          <div className="dropdown-group">
            <label htmlFor="output-select">Output Number:</label>
            <select
              id="output-select"
              value={selectedOutput}
              onChange={(e) => setSelectedOutput(e.target.value)}
            >
              <option value="">Select Output</option>
              {selectedTypeData.value === 'latching' ? (
                <>
                  <option value="1">Output 1 (Latching Relay 1: Out 1+2)</option>
                  <option value="3">Output 3 (Latching Relay 2: Out 3+4)</option>
                </>
              ) : (
                <>
                  <option value="1">Output 1</option>
                  <option value="2">Output 2</option>
                  <option value="3">Output 3</option>
                  <option value="4">Output 4</option>
                </>
              )}
            </select>
          </div>
        )}
      </div>

      <div className="plug-display-container">
        <PlugDisplay
          pins={getFilteredPins()}
          allPins={selectedTypeData?.pins}
          title={selectedTypeData ? `${selectedPlugData.label} - ${selectedTypeData.label}` : 'Select Configuration'}
          selectedChannel={selectedChannel}
          plugType={selectedPlug}
          typeData={selectedTypeData}
          usedPins={usedPins}
        />
      </div>

      <div className="wiring-diagram-container">
        <ReactFlowDiagram
          plugType={selectedPlug}
          typeData={selectedTypeData}
          outputNumber={selectedOutput}
          channelNumber={selectedChannel}
          wireMode={wireMode}
        />
      </div>

      <div className="legend">
        <h3>Color Legend {usedPins.length > 0 && <span style={{ fontSize: '0.8em', fontWeight: 'normal', color: '#888' }}>(Used Pins Only)</span>}</h3>
        <div className="legend-items">
          {getLegendItems().map(item => (
            <div key={item.pin} className="legend-item">
              <div 
                className="legend-color" 
                style={{ 
                  backgroundColor: item.color, 
                  border: item.border ? '1px solid #ccc' : 'none' 
                }}
              ></div>
              <span>{item.name} (Pin {item.pin})</span>
            </div>
          ))}
        </div>
      </div>

      <footer className="app-footer">
        <p>Neo Wiring Lookup Tool</p>
      </footer>
    </div>
  )
}

export default App
