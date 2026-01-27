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

  const selectedPlugData = plugOptions.find(p => p.value === selectedPlug)
  const selectedTypeData = selectedPlugData?.types.find(t => t.value === selectedType)

  const handlePlugChange = (e) => {
    setSelectedPlug(e.target.value)
    setSelectedType('')
    setSelectedOutput('')
    setSelectedChannel('')
  }

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
          pins={selectedTypeData?.pins}
          title={selectedTypeData ? `${selectedPlugData.label} - ${selectedTypeData.label}` : 'Select Configuration'}
          selectedChannel={selectedChannel}
          plugType={selectedPlug}
          typeData={selectedTypeData}
        />
      </div>

      <div className="wiring-diagram-container">
        <ReactFlowDiagram
          plugType={selectedPlug}
          typeData={selectedTypeData}
          outputNumber={selectedOutput}
          channelNumber={selectedChannel}
        />
      </div>

      <div className="legend">
        <h3>Color Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FFFFFF', border: '1px solid #ccc' }}></div>
            <span>White (Pin 1)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#8B4513' }}></div>
            <span>Brown (Pin 2)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#00FF00' }}></div>
            <span>Green (Pin 3)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FFFF00' }}></div>
            <span>Yellow (Pin 4)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#808080' }}></div>
            <span>Grey (Pin 5)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FFC0CB' }}></div>
            <span>Pink (Pin 6)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#0000FF' }}></div>
            <span>Blue (Pin 7)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FF0000' }}></div>
            <span>Red (Pin 8)</span>
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>Neo Wiring Lookup Tool</p>
      </footer>
    </div>
  )
}

export default App
