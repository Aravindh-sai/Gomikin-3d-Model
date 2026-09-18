# Gomikin 3D Management Demo

A web-based interactive 3D prototype for the **Gomikin Smart Waste Processing System**. 

Built entirely with Vanilla JavaScript, Three.js, and Vite, this prototype serves as a management demonstration tool. It visualizes the internal architecture, mechanical components, and process flows of the Gomikin smart bin without requiring heavy CAD software or backend dependencies.

## Features

- **Full 3D Architecture**: Lightweight, procedurally generated Three.js geometry representing all 30+ physical components (Housing, Input Section, Cutting Mechanisms, Decomposition Chambers, Sensors, etc.).
- **Interactive Cutaway**: Instantly toggle the main exterior shell to reveal internal processing mechanics.
- **Dynamic Animations**: Delta-time driven animations for continuous mechanisms (shredder blades, agitator, exhaust fans) and transitions (sorting flap, storage doors, leachate tray).
- **Process Orcherstration**: Automated state-machine driven demonstrations for:
  - **Organic Processing**: From feeding and shredding to storage and thermophilic decomposition.
  - **Inorganic Sorting**: From classification scanning to physical segregation.
  - **Leachate Flow**: Visualizing liquid drainage from multiple chambers into a central collection tray.
- **Presentation Polish**: Features a dark industrial studio lighting setup and smooth cinematic camera presets.

## Requirements

- Node.js (v18+ recommended)

## Installation & Setup

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Run the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   Navigate to the local URL provided (usually \`http://localhost:5173\`) in your web browser.

3. **Build for production:**
   \`\`\`bash
   npm run build
   \`\`\`
   Compiled static assets will be output to the \`dist/\` directory, ready to be hosted on any standard web server.

## Usage

Use the floating UI dashboard on the left side of the screen to interact with the prototype:

- **CAMERA VIEWS**: Smoothly transition between predefined camera angles (Exterior, Cutaway, Top Processing, Bottom Output).
- **SYSTEM VIEW**: Manually toggle the cutaway shell or perform an emergency reset of all animations.
- **PROCESS DEMOS**: Trigger full end-to-end automated sequences for Organic, Inorganic, and Leachate processing.
- **MECHANISMS**: Manually toggle individual hardware components on and off to observe their specific animations.
- The **OLED STATUS** and **SYSTEM STATUS** indicators will automatically sync with the active state of the 3D model.

## Technology Stack

- **Three.js**: 3D rendering, geometry, materials, and lighting.
- **Vite**: Next-generation frontend tooling and bundling.
- **Vanilla JS & CSS**: No heavy UI frameworks (React/Vue/Tailwind) used; keeps the prototype lightning-fast and universally compatible.
