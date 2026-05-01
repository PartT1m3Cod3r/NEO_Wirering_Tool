import { Handle, Position } from 'reactflow';
import { colorMap } from '../../data/plugData';

// Pin definitions for each plug type (M12 standard)
const pinDefinitions = {
  inputs: [
    { pin: 1, color: 'white', colorHex: colorMap.white, function: 'Solar Input (5 to 24V)', textColor: '#000' },
    { pin: 2, color: 'brown', colorHex: colorMap.brown, function: 'Ground', textColor: '#FFF' },
    { pin: 3, color: 'green', colorHex: colorMap.green, function: 'Sensor Power Out', textColor: '#000' },
    { pin: 4, color: 'yellow', colorHex: colorMap.yellow, function: 'Ground', textColor: '#000' },
    { pin: 5, color: 'grey', colorHex: colorMap.grey, function: 'Analog Input 4', textColor: '#FFF' },
    { pin: 6, color: 'pink', colorHex: colorMap.pink, function: 'Analog Input 3', textColor: '#000' },
    { pin: 7, color: 'blue', colorHex: colorMap.blue, function: 'Analog Input 2', textColor: '#FFF' },
    { pin: 8, color: 'red', colorHex: colorMap.red, function: 'Analog Input 1', textColor: '#FFF' },
  ],
  outputs: [
    { pin: 1, color: 'white', colorHex: colorMap.white, function: 'Solar Input (5 to 24V)', textColor: '#000' },
    { pin: 2, color: 'brown', colorHex: colorMap.brown, function: 'Ground', textColor: '#FFF' },
    { pin: 3, color: 'green', colorHex: colorMap.green, function: 'Actuator Power Out', textColor: '#000' },
    { pin: 4, color: 'yellow', colorHex: colorMap.yellow, function: 'Ground', textColor: '#000' },
    { pin: 5, color: 'grey', colorHex: colorMap.grey, function: 'Actuator Output 1', textColor: '#FFF' },
    { pin: 6, color: 'pink', colorHex: colorMap.pink, function: 'Actuator Output 2', textColor: '#000' },
    { pin: 7, color: 'blue', colorHex: colorMap.blue, function: 'Actuator Output 3', textColor: '#FFF' },
    { pin: 8, color: 'red', colorHex: colorMap.red, function: 'Actuator Output 4', textColor: '#FFF' },
  ],
  communications: [
    { pin: 1, color: 'white', colorHex: colorMap.white, function: 'Solar Input (5 to 24V)', textColor: '#000' },
    { pin: 2, color: 'brown', colorHex: colorMap.brown, function: 'Ground', textColor: '#FFF' },
    { pin: 3, color: 'green', colorHex: colorMap.green, function: 'RS485 B', textColor: '#000' },
    { pin: 4, color: 'yellow', colorHex: colorMap.yellow, function: 'RS485 A', textColor: '#000' },
    { pin: 5, color: 'grey', colorHex: colorMap.grey, function: 'Digital Input 2 / Wiegand D1', textColor: '#FFF' },
    { pin: 6, color: 'pink', colorHex: colorMap.pink, function: 'Digital Input 1 / Wiegand D0', textColor: '#000' },
    { pin: 7, color: 'blue', colorHex: colorMap.blue, function: 'SDI-12 Data', textColor: '#FFF' },
    { pin: 8, color: 'red', colorHex: colorMap.red, function: 'Ground', textColor: '#FFF' },
  ],
};

// Source handle IDs per pin for each plug type
// React Flow matches edges to handles by ID. Multiple IDs at same position are fine.
const pinSourceHandles = {
  inputs: {
    3: [{ id: 'power', color: colorMap.green }],
    4: [{ id: 'gnd', color: colorMap.yellow }],
    5: [{ id: 'pin-5', color: colorMap.grey }],
    6: [{ id: 'pin-6', color: colorMap.pink }],
    7: [{ id: 'pin-7', color: colorMap.blue }],
    8: [{ id: 'pin-8', color: colorMap.red }],
  },
  outputs: {
    4: [{ id: 'gnd', color: colorMap.yellow }],
    5: [{ id: 'pin-5', color: colorMap.grey }],
    6: [{ id: 'pin-6', color: colorMap.pink }],
    7: [{ id: 'pin-7', color: colorMap.blue }],
    8: [{ id: 'pin-8', color: colorMap.red }],
  },
  communications: {
    3: [{ id: 'b', color: colorMap.green }],
    4: [{ id: 'a', color: colorMap.yellow }],
    5: [{ id: 'pin-5', color: colorMap.grey }, { id: 'd1', color: colorMap.grey }],
    6: [{ id: 'pin-6', color: colorMap.pink }, { id: 'd0', color: colorMap.pink }],
    7: [{ id: 'pin-7', color: colorMap.blue }, { id: 'data', color: colorMap.blue }],
    8: [{ id: 'gnd', color: colorMap.red }],
  },
};

// Target handles for pins 1 & 2 (power input connections INTO the Neo)
const targetHandleMap = {
  1: { id: 'vcc', color: colorMap.white },
  2: { id: 'gnd', color: colorMap.brown },
};

const getRefDes = (label) => {
  if (label?.includes('Inputs')) return 'J1';
  if (label?.includes('Coms')) return 'J2';
  if (label?.includes('Outputs')) return 'J3';
  return 'J?';
};

const getPlugType = (label) => {
  if (label?.includes('Inputs')) return 'inputs';
  if (label?.includes('Coms')) return 'communications';
  if (label?.includes('Outputs')) return 'outputs';
  return 'inputs';
};

export const NeoDeviceNode = ({ data }) => {
  const { label } = data;
  const plugType = data.plugType || getPlugType(label);
  const pins = pinDefinitions[plugType] || pinDefinitions.inputs;
  const refDes = getRefDes(label);

  return (
    <div className="neo-terminal-block">
      {/* Node header with reference designator */}
      <div className="neo-terminal-header">
        <span className="neo-terminal-ref">{refDes}</span>
        <span className="neo-terminal-type">NEO</span>
      </div>

      <div className="neo-terminal-title">
        {label?.replace('Neo Device ', '')}
      </div>

      {/* Terminal Block Table */}
      <div className="neo-terminal-table">
        {/* Table Header */}
        <div className="neo-terminal-row neo-terminal-header-row">
          <div className="neo-terminal-cell pin-col">PIN</div>
          <div className="neo-terminal-cell desc-col">DESCRIPTION</div>
          <div className="neo-terminal-cell color-col">COLOUR</div>
        </div>

        {/* Table Rows - one per pin */}
        {pins.map((pinDef) => {
          const isPowerPin = pinDef.pin === 1 || pinDef.pin === 2;
          const targetHandle = targetHandleMap[pinDef.pin];
          const sourceHandles = pinSourceHandles[plugType]?.[pinDef.pin] || [];

          return (
            <div
              key={pinDef.pin}
              className="neo-terminal-row"
              style={{ position: 'relative' }}
            >
              <div className="neo-terminal-cell pin-col">
                {pinDef.pin}
              </div>
              <div className="neo-terminal-cell desc-col">
                {pinDef.function}
              </div>
              <div
                className="neo-terminal-cell color-col"
                style={{
                  backgroundColor: pinDef.colorHex,
                  color: pinDef.textColor,
                  fontWeight: 'bold',
                }}
              >
                {pinDef.color.toUpperCase()}
              </div>

              {/* Target handle for power input (pins 1 & 2) */}
              {isPowerPin && targetHandle && (
                <Handle
                  type="target"
                  position={Position.Right}
                  id={targetHandle.id}
                  style={{
                    position: 'absolute',
                    right: -6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: targetHandle.color,
                    border: '2px solid var(--accent-color)',
                    width: '10px',
                    height: '10px',
                    zIndex: 10,
                  }}
                />
              )}

              {/* Source handles for all other pins (3-8) */}
              {sourceHandles.map((handle, idx) => (
                <Handle
                  key={`${pinDef.pin}-${handle.id}`}
                  type="source"
                  position={Position.Right}
                  id={handle.id}
                  style={{
                    position: 'absolute',
                    right: -6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: handle.color,
                    border: '2px solid var(--accent-color)',
                    width: '10px',
                    height: '10px',
                    zIndex: 10,
                    // Slight offset for overlapping handles on same pin
                    marginTop: sourceHandles.length > 1 ? (idx === 0 ? -3 : 3) : 0,
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Terminal strip footer */}
      <div className="neo-terminal-footer">
        <span>TB-{refDes}</span>
        <span>M12-8 A-CODED</span>
      </div>
    </div>
  );
};
