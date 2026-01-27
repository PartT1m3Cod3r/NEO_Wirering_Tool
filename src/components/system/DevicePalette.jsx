export const DevicePalette = ({ availableDevices, onAddDevice }) => {
  return (
    <div className="device-palette">
      <h3>Device Palette</h3>
      <p className="palette-hint">Click a device to add it to the diagram</p>

      {availableDevices.map((category) => (
        <div key={category.category} className="device-category">
          <h4>{category.category}</h4>
          <div className="device-list">
            {category.items.map((device) => (
              <button
                key={device.type}
                className="device-item"
                onClick={() => onAddDevice(device)}
              >
                <span className="device-icon">
                  {device.type === 'power-input' && '🔋'}
                  {device.type !== 'power-input' && category.category === 'Inputs' && '📊'}
                  {device.type !== 'power-input' && category.category === 'Communications' && '📡'}
                  {device.type !== 'power-input' && category.category === 'Outputs' && '🔌'}
                </span>
                <span className="device-label">{device.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
