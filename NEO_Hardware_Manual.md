# NEO Hardware Manual

**Document Version:** 1.0  
**Date:** April 2026  
**Product:** Aquamonix NEO IoT Device  
**Document Type:** Hardware Installation & Reference Manual

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Safety Information](#2-safety-information)
3. [Specifications](#3-specifications)
4. [Physical Overview](#4-physical-overview)
5. [Connector Pinouts](#5-connector-pinouts)
   - 5.1 [Inputs Connector](#51-inputs-connector)
   - 5.2 [Outputs Connector](#52-outputs-connector)
   - 5.3 [Communications Connector](#53-communications-connector)
6. [Wiring Guidelines](#6-wiring-guidelines)
   - 6.1 [Cable Color Code](#61-cable-color-code)
   - 6.2 [2-Wire vs 3-Wire Sensors](#62-2-wire-vs-3-wire-sensors)
   - 6.3 [Power Wiring](#63-power-wiring)
   - 6.4 [RS485 Multi-Drop Wiring](#64-rs485-multi-drop-wiring)
7. [Device-Specific Connection Instructions](#7-device-specific-connection-instructions)
8. [LED Indicators](#8-led-indicators)
9. [Mounting Instructions](#9-mounting-instructions)
10. [Troubleshooting](#10-troubleshooting)
11. [Quick Reference](#11-quick-reference)

---

## 1. Introduction

The **Aquamonix NEO** is an industrial IoT device designed for remote monitoring and control applications. It features multiple analog inputs, digital outputs, and communication interfaces — all housed in a rugged, weatherproof enclosure suitable for agricultural, environmental, and industrial deployments.

This manual provides complete hardware installation instructions, connector pinouts, and wiring reference information for system integrators and field technicians.

### Key Features

- **4 Analog Input Channels** (0-10V, 4-20mA, voltage sensing)
- **4 Actuator Outputs** (relay, latching relay, transistor)
- **Multi-Protocol Communications** (RS485, SDI-12, Wiegand, pulse counter)
- **Wide Voltage Input** (5V to 24V DC)
- **Programmable Sensor Power** (5V / 6V / 12V / 24V)
- **M12 Industrial Connectors** (8-pin, A-coded)
- **Solar or PSU Power Input**

---

## 2. Safety Information

> ⚠️ **WARNING:** Read all safety information before installing or servicing this device.

### General Safety

- Ensure all power is disconnected before making or breaking any connections.
- Only qualified personnel should install this equipment.
- Do not exceed the specified voltage ratings on any pin.
- Use appropriately rated cables and connectors for the application environment.

### Electrical Safety

| Parameter | Rating |
|---|---|
| Supply Voltage | 5V – 24V DC |
| Maximum Input Voltage | 30V DC |
| Sensor Power Output | 5V / 6V / 12V / 24V (configurable) |
| Output Current | Refer to device label for per-channel rating |

### Environmental Safety

- Install in a location protected from direct sunlight if operating near maximum temperature limits.
- Ensure cable glands and connectors are fully tightened to maintain IP rating.
- Do not install in hazardous or explosive atmospheres without appropriate certification.

---

## 3. Specifications

### Electrical Specifications

| Parameter | Specification |
|---|---|
| **Power Input** | 5V – 24V DC (nominal) |
| **Power Consumption** | < 2W (typical, excluding outputs) |
| **Analog Inputs** | 4 channels: 0-10V, 4-20mA, voltage sensing |
| **Digital / Pulse Input** | 2 channels (shared with communications plug) |
| **Outputs** | 4 channels: relay, latching relay, or transistor |
| **Sensor Power** | 5V, 6V, 12V, or 24V DC (software selectable) |
| **Communications** | RS485, SDI-12, Wiegand |

### Physical Specifications

| Parameter | Specification |
|---|---|
| **Enclosure Rating** | IP67 (when connectors fitted) |
| **Connectors** | 3 × M12 8-pin female (A-coded) |
| **Mounting** | DIN rail or wall mount (bracket dependent) |
| **Dimensions** | [Insert dimensions] |
| **Weight** | [Insert weight] |

### Environmental Specifications

| Parameter | Specification |
|---|---|
| **Operating Temperature** | -20°C to +60°C |
| **Storage Temperature** | -30°C to +70°C |
| **Relative Humidity** | 0% – 95% non-condensing |
| **Altitude** | Up to 2000m |

---

## 4. Physical Overview

The NEO device has three M12 8-pin connectors arranged on the enclosure:

```
┌─────────────────────────────┐
│                             │
│   [INPUTS]  [COMMS]  [OUTPUTS]  ← M12 Connectors (front view)
│                             │
│         [LED Indicators]    │
│                             │
└─────────────────────────────┘
```

### Connector Identification

| Label | Function | Typical Position |
|---|---|---|
| **INPUTS** | Analog inputs, sensor power, main power | Left |
| **COMMS** | RS485, SDI-12, Wiegand, pulse, digital inputs | Center |
| **OUTPUTS** | Relay / transistor outputs, actuator power | Right |

> **Note:** All three connectors share pins 1 (VCC+) and 2 (GND) for power distribution. You may power the device through any connector, or use the dedicated Power Input configuration.

---

## 5. Connector Pinouts

All NEO connectors are **M12 8-pin A-coded female**. The pin numbering follows the standard M12 clockwise arrangement when viewed from the front (mating face):

```
         Pin 8 (Red)
            🔴
   Pin 7 (Blue)   Pin 1 (White)
      🔵             ⚪
 Pin 6 (Pink)       Pin 2 (Brown)
    🩷               🟤
   Pin 5 (Grey)   Pin 3 (Green)
      🩶             🟢
         Pin 4 (Yellow)
            🟡
```

### Universal Pin Color Map

| Pin | Color | Typical Function |
|:---:|:---:|---|
| 1 | White | VCC+ / Solar Input (5-24V) |
| 2 | Brown | GND / Power Return |
| 3 | Green | Power Out / RS485 B / Sensor Vout+ |
| 4 | Yellow | GND / RS485 A / Sensor Vout- |
| 5 | Grey | Analog In 4 / Output 1 (A1) / Digital In 2 / Wiegand D1 |
| 6 | Pink | Analog In 3 / Output 2 (A2) / Digital In 1 / Pulse In / Wiegand D0 |
| 7 | Blue | Analog In 2 / Output 3 (A3) / SDI-12 Data |
| 8 | Red | Analog In 1 / Output 4 (A4) / GND |

---

### 5.1 Inputs Connector

Used for: analog sensors (0-10V, 4-20mA), voltage sensing, and power input.

| Pin | Color | Function | Device Terminal |
|:---:|:---:|---|:---:|
| 1 | White | Solar / Power Input (5 to 24V) | Power+ |
| 2 | Brown | Ground | Power- |
| 3 | Green | Sensor Power Out (5V/6V/12V/24V) | Vout+ |
| 4 | Yellow | Ground | Vout- |
| 5 | Grey | Analog Input 4 | — |
| 6 | Pink | Analog Input 3 | — |
| 7 | Blue | Analog Input 2 | — |
| 8 | Red | Analog Input 1 | Signal |

#### Analog Input Channel Mapping

| Channel | Pin | Color |
|:---:|:---:|:---:|
| 1 | 8 | Red |
| 2 | 7 | Blue |
| 3 | 6 | Pink |
| 4 | 5 | Grey |

#### 0-10V Sensor Wiring

| Step | NEO Cable | Device Wire | Description |
|:---|:---|:---|:---|
| 1 | White | Power+ | Connect power supply positive to White (Pin 1) |
| 2 | Brown | Power- | Connect power supply negative to Brown (Pin 2) |
| 3 | Red | Signal | Connect sensor signal wire to Red (Pin 8) |
| 4 | Green | Vout+ | Connect sensor power wire to Green (Pin 3) |
| 5 | Yellow | Vout- | Connect sensor ground to Yellow (Pin 4) |

#### 4-20mA Sensor Wiring

Same pinout as 0-10V. Use the channel that corresponds to your configured input.

#### Voltage Sensing Wiring

Same pinout as 0-10V. Connect the voltage to be measured to the Signal pin.

#### Power Input (Inputs Connector)

| Pin | Color | Function | Device Terminal |
|:---:|:---:|---|:---:|
| 1 | White | VCC+ (5 to 24V) | VCC+ |
| 2 | Brown | GND | GND |
| 3-8 | — | Not connected | — |

---

### 5.2 Outputs Connector

Used for: relay outputs, latching relays, and transistor outputs.

| Pin | Color | Function | Device Terminal |
|:---:|:---:|---|:---:|
| 1 | White | Solar / Power Input (5 to 24V) | Power |
| 2 | Brown | Ground | GND |
| 3 | Green | Actuator Power Out (5V/6V/12V/24V) | V+ for Relay |
| 4 | Yellow | Ground | GND for Relay |
| 5 | Grey | Actuator Output 1 | A1 |
| 6 | Pink | Actuator Output 2 | A2 |
| 7 | Blue | Actuator Output 3 | A3 |
| 8 | Red | Actuator Output 4 | A4 |

#### Output Channel Mapping

| Output | Pin | Color | Terminal |
|:---:|:---:|:---:|:---:|
| 1 | 5 | Grey | A1 |
| 2 | 6 | Pink | A2 |
| 3 | 7 | Blue | A3 |
| 4 | 8 | Red | A4 |

#### Relay Wiring

- **Power:** Connect supply to White (Pin 1) and Brown (Pin 2).
- **Actuator Power:** If the relay requires external actuator power, use Green (Pin 3) and Yellow (Pin 4).
- **Switching Contacts:** Use Grey/Pink/Blue/Red (Pins 5-8) as the switched outputs (A1-A4).

#### Latching Relay Wiring

Same pinout as standard relay. The device firmware handles SET and RESET coil switching automatically on the configured outputs.

#### Transistor Output Wiring

| Pin | Color | Transistor Terminal |
|:---:|:---:|---|
| 3 | Green | Base / Driver |
| 4 | Yellow | Emitter |
| 5 | Grey | Collector 1 |
| 6 | Pink | Collector 2 |
| 7 | Blue | Collector 3 |
| 8 | Red | Collector 4 |

---

### 5.3 Communications Connector

Used for: RS485, SDI-12, Wiegand, pulse counter, and digital inputs.

| Pin | Color | Function | Device Terminal |
|:---:|:---:|---|:---:|
| 1 | White | Solar / Power Input (5 to 24V) | Power+ |
| 2 | Brown | Ground | Power- |
| 3 | Green | RS485 B | B |
| 4 | Yellow | RS485 A | A |
| 5 | Grey | Digital Input 2 / Wiegand D1 | D1 |
| 6 | Pink | Digital Input 1 / Pulse Input | D0 / Signal |
| 7 | Blue | SDI-12 Data | Data |
| 8 | Red | Ground | — |

#### RS485 Wiring

| Step | NEO Cable | Device Wire | Description |
|:---|:---|:---|:---|
| 1 | White | Power+ | Connect power supply positive to White (Pin 1) |
| 2 | Brown | Power- | Connect power supply negative to Brown (Pin 2) |
| 3 | Green | B | Connect RS485 B to Green (Pin 3) |
| 4 | Yellow | A | Connect RS485 A to Yellow (Pin 4) |

#### Wiegand Wiring

| Step | NEO Cable | Device Wire | Description |
|:---|:---|:---|:---|
| 1 | White | Power+ | Connect power supply positive to White (Pin 1) |
| 2 | Brown | Power- | Connect power supply negative to Brown (Pin 2) |
| 3 | Pink | D0 | Connect Wiegand D0 to Pink (Pin 6) |
| 4 | Grey | D1 | Connect Wiegand D1 to Grey (Pin 5) |

#### SDI-12 Wiring

| Step | NEO Cable | Device Wire | Description |
|:---|:---|:---|:---|
| 1 | White | Power+ | Connect power supply positive to White (Pin 1) |
| 2 | Brown | Power- | Connect power supply negative to Brown (Pin 2) |
| 3 | Blue | Data | Connect SDI-12 Data to Blue (Pin 7) |

> **Note:** SDI-12 devices share a single data line. Multiple sensors can be connected in parallel (multi-drop) on the same Blue wire, each with a unique SDI-12 address.

#### Pulse Counter Wiring

| Step | NEO Cable | Device Wire | Description |
|:---|:---|:---|:---|
| 1 | White | Power+ | Connect solar/power supply positive to White (Pin 1) |
| 2 | Brown | Power- | Connect solar/power supply negative to Brown (Pin 2) |
| 3 | Green | Vout+ | Connect sensor power to Green (Pin 3) |
| 4 | Yellow | Vout- | Connect ground to Yellow (Pin 4) |
| 5 | Pink | Signal | Connect pulse signal to Pink (Pin 6 — Digital Input 1) |

---

## 6. Wiring Guidelines

### 6.1 Cable Color Code

The NEO uses industry-standard M12 cable colors. Always verify with a multimeter if cable colors are non-standard.

| Color | Hex Code | Typical Use |
|:---|:---:|---|
| White | `#FFFFFF` | VCC+ / Power Input |
| Brown | `#8B4513` | Ground / Power Return |
| Green | `#00FF00` | Power Out / RS485 B / Vout+ |
| Yellow | `#FFFF00` | Ground / RS485 A / Vout- |
| Grey | `#808080` | Analog In 4 / Output 1 / Digital In 2 |
| Pink | `#FFC0CB` | Analog In 3 / Output 2 / Digital In 1 / Pulse |
| Blue | `#0000FF` | Analog In 2 / Output 3 / SDI-12 Data |
| Red | `#FF0000` | Analog In 1 / Output 4 / GND |

### 6.2 2-Wire vs 3-Wire Sensors

The NEO supports both 2-wire and 3-wire analog sensor configurations.

#### 3-Wire Mode (Standard)

Used when the sensor requires separate power and signal connections.

| Wire | Connection |
|---|---|
| Signal | Red (Pin 8), Blue (Pin 7), Pink (Pin 6), or Grey (Pin 5) |
| Power+ | Green (Pin 3) — Vout+ |
| Ground | Yellow (Pin 4) — Vout- |

#### 2-Wire Mode

Used when the sensor combines power and signal on two wires (e.g., loop-powered 4-20mA).

| Wire | Connection |
|---|---|
| Signal / Power | Red (Pin 8) or relevant channel pin |
| Ground / Return | Yellow (Pin 4) — Vout- |

> **Note:** In 2-wire mode, the Green (Pin 3) Vout+ connection is not used. The sensor derives power from the signal loop.

### 6.3 Power Wiring

#### Solar Power

- Connect solar panel positive to **White (Pin 1)** on any connector.
- Connect solar panel negative to **Brown (Pin 2)** on any connector.
- The NEO has an internal charge controller. Ensure panel open-circuit voltage does not exceed 24V.

#### PSU Power

- Connect PSU positive to **White (Pin 1)**.
- Connect PSU negative to **Brown (Pin 2)**.
- Recommended PSU rating: 12V DC, 2A minimum (higher if driving multiple relays).

#### Power Distribution

All three connectors have pins 1 and 2 connected internally. You may:
- Power through a single connector.
- Use a dedicated Power Input device on any plug if only power is needed.

### 6.4 RS485 Multi-Drop Wiring

RS485 supports multiple devices on a single bus.

```
    NEO (Master)          Device 1              Device 2
    ┌───────┐            ┌───────┐             ┌───────┐
    │ A  B  │            │ A  B  │             │ A  B  │
    └─┬──┬──┘            └─┬──┬──┘             └─┬──┬──┘
      │  │                 │  │                  │  │
    ──┴──┴────────────────┴──┴──────────────────┴──┴──
    Yellow Green           Daisy-chain            Termination
    (Pin 4) (Pin 3)                              (120Ω at far end)
```

- **Daisy-chain** A to A and B to B. Do not use star topology.
- **Terminate** the bus with a 120Ω resistor at the farthest device if experiencing communication errors.
- **Maximum cable length:** 1200m at 9600 baud (shorter for higher baud rates).

---

## 7. Device-Specific Connection Instructions

### 2-Wire Sensor (0-10V / 4-20mA)

| Terminal | NEO Pin | Color |
|---|---|---|
| Power+ | 1 | White |
| Power- | 2 | Brown |
| Signal | 8 | Red |
| Vout+ | 3 | Green |
| Vout- | 4 | Yellow |

### RS485 Module

| Terminal | NEO Pin | Color |
|---|---|---|
| Power+ | 1 | White |
| Power- | 2 | Brown |
| B | 3 | Green |
| A | 4 | Yellow |

### Wiegand Reader

| Terminal | NEO Pin | Color |
|---|---|---|
| Power+ | 1 | White |
| Power- | 2 | Brown |
| D0 | 6 | Pink |
| D1 | 5 | Grey |

### SDI-12 Device

| Terminal | NEO Pin | Color |
|---|---|---|
| Power+ | 1 | White |
| Power- | 2 | Brown |
| Data | 7 | Blue |

### Pulse Counter

| Terminal | NEO Pin | Color |
|---|---|---|
| Power+ | 1 | White |
| Power- | 2 | Brown |
| Vout+ | 3 | Green |
| Vout- | 4 | Yellow |
| Signal | 6 | Pink |

### Relay / Latching Relay

| Terminal | NEO Pin | Color |
|---|---|---|
| Power | 1 | White |
| GND | 2 | Brown |
| V+ for Relay | 3 | Green |
| GND for Relay | 4 | Yellow |
| A1 | 5 | Grey |
| A2 | 6 | Pink |
| A3 | 7 | Blue |
| A4 | 8 | Red |

### Transistor Output

| Terminal | NEO Pin | Color |
|---|---|---|
| Power | 1 | White |
| GND | 2 | Brown |
| Base/Driver | 3 | Green |
| Emitter | 4 | Yellow |
| Collector 1 | 5 | Grey |
| Collector 2 | 6 | Pink |
| Collector 3 | 7 | Blue |
| Collector 4 | 8 | Red |

---

## 8. LED Indicators

The NEO has status LEDs on the enclosure. Behavior may vary by firmware version.

| LED | Color | State | Meaning |
|---|---|---|---|
| **Power** | Green | Solid | Device powered, internal regulator OK |
| | | Off | No power or regulator fault |
| **Status** | Blue | Blinking (1Hz) | Normal operation, connected to platform |
| | | Rapid blink | Firmware update in progress |
| | | Solid | Boot / initialization |
| | | Off | No network connection or sleeping |
| **Comms** | Yellow | Blink | Data transmission active |
| | | Off | Idle |

---

## 9. Mounting Instructions

### DIN Rail Mounting

1. Hook the top of the mounting bracket over the DIN rail.
2. Push the bottom of the device toward the rail until it clicks into place.
3. Ensure the device is securely seated and cannot move laterally.

### Wall Mounting

1. Use the provided wall-mount bracket.
2. Mark and drill holes at the specified spacing.
3. Secure the bracket with suitable screws for the surface material.
4. Attach the device to the bracket.

### Cable Management

- Leave a service loop of at least 100mm on each cable.
- Use cable ties to secure M12 cables and prevent strain on connectors.
- Ensure cables enter from below or the side to maintain IP rating.

---

## 10. Troubleshooting

| Symptom | Possible Cause | Solution |
|---|---|---|
| Device will not power on | No voltage on Pin 1 / Pin 2 | Check power supply with multimeter. Verify White/Brown connections. |
| Sensor reading erratic | Poor ground connection | Verify Yellow (Pin 4) is connected to sensor ground. |
| 4-20mA reading stuck at low value | Sensor not powered | Check Green (Pin 3) for Vout+. Verify sensor wiring. |
| RS485 communication errors | Bus not terminated / wrong topology | Add 120Ω termination at far end. Check for star wiring. |
| Relay not activating | Insufficient actuator power | Check Green/Yellow (Pins 3/4) for actuator supply. |
| Pulse counter not counting | Wrong pin used | Verify pulse signal is on Pink (Pin 6), not Pin 5. |
| Wiegand reader not detected | D0/D1 reversed | Swap Pink (Pin 6) and Grey (Pin 5). |
| Output 1 fires when Output 2 commanded | Wrong channel assignment | Verify firmware channel mapping matches physical wiring. |

---

## 11. Quick Reference

### Pin-to-Function Matrix

| Pin | Color | Inputs | Outputs | Comms |
|:---:|:---:|---|---|---|
| 1 | White | Power+ | Power | Power+ |
| 2 | Brown | GND | GND | GND |
| 3 | Green | Vout+ | Relay V+ | RS485 B |
| 4 | Yellow | Vout- | Relay GND | RS485 A |
| 5 | Grey | Analog In 4 | A1 | Digital In 2 / D1 |
| 6 | Pink | Analog In 3 | A2 | Digital In 1 / Pulse / D0 |
| 7 | Blue | Analog In 2 | A3 | SDI-12 Data |
| 8 | Red | Analog In 1 | A4 | GND |

### Channel Quick Lookup

**Analog Inputs**
- Ch 1 → Pin 8 (Red)
- Ch 2 → Pin 7 (Blue)
- Ch 3 → Pin 6 (Pink)
- Ch 4 → Pin 5 (Grey)

**Actuator Outputs**
- Out 1 → Pin 5 (Grey) — A1
- Out 2 → Pin 6 (Pink) — A2
- Out 3 → Pin 7 (Blue) — A3
- Out 4 → Pin 8 (Red) — A4

**Communications**
- RS485 B → Pin 3 (Green)
- RS485 A → Pin 4 (Yellow)
- Wiegand D0 → Pin 6 (Pink)
- Wiegand D1 → Pin 5 (Grey)
- SDI-12 Data → Pin 7 (Blue)
- Pulse In → Pin 6 (Pink)

### Wire Number Convention (Optional)

If using the NEO Wiring Tool to generate wire numbers, the default convention is:

| Function | Base Number | Example |
|---|---|---|
| Signal | 200 + channel | Ch 1 = 201, Ch 2 = 202 |
| Power | 100 + pin | Pin 1 = 101, Pin 3 = 103 |
| Ground | 100 + pin | Pin 2 = 102, Pin 4 = 104 |

---

## Document Control

| Version | Date | Author | Changes |
|:---:|:---|:---|:---|
| 1.0 | 2026-04-24 | [Your Name] | Initial release |

---

*For the latest version of this document and associated wiring tools, visit:*
**https://github.com/PartT1m3Cod3r/NEO_Wirering_Tool**

*For technical support, contact Aquamonix support.*
