# Repond-Movers

**Physics-based animation library for Repond**

Smooth, realistic animations using spring physics and friction-based sliding - built to integrate seamlessly with Repond's state management and effects system.

[![npm version](https://img.shields.io/npm/v/repond-movers.svg)](https://www.npmjs.com/package/repond-movers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Why Repond-Movers?

Repond-movers provides frame-aware, physics-driven animations that feel natural and responsive:

- **Realistic physics**: Spring oscillation and friction-based sliding
- **Frame-rate independent**: Smooth animations at any FPS
- **Multiple dimensions**: 1D scalars, 2D points, 3D positions, or multiple named values
- **Declarative API**: Set a goal and let physics handle the rest
- **Time control**: Slow down, speed up, or pause animations via state
- **Type-safe**: Full TypeScript support with Repond's type system

**Perfect for:**

- Drag & drop with momentum and spring-back
- 3D game character movements
- Smooth UI transitions and animations
- Camera movements and easing
- Character bone/blend shape animations

---

## Quick Start

### Installation

```bash
npm install repond-movers repond chootils
```

### Basic Example

```typescript
import { addItem, setState } from "repond";
import { initMovers, addMoverEffects, moverState, moverRefs } from "repond-movers";

// 1. Setup (optional: enable time control)
initMovers(["game", "ticker", "elapsed"]);

// 2. Create store with mover
const spriteStore = {
  newState: () => ({
    ...moverState("position", { moveMode: "spring" }),
  }),
  newRefs: () => ({
    ...moverRefs("position", { mass: 50, stiffness: 15, damping: 9 }),
  }),
};

// 3. Add mover effects
addMoverEffects("sprite", "position", "2d");

// 4. Use it!
addItem("sprite", "sprite1");
setState("sprite", { positionGoal: { x: 100, y: 50 } }, "sprite1");
// Position smoothly animates to (100, 50) with spring physics!
```

---

## Core Concepts

### 1. Movers

A "mover" continuously animates a value toward a goal using physics. Four types available:

| Type | Dimensions | Use Case |
|------|-----------|----------|
| **1D** | Single scalar | Rotation, opacity, progress bars |
| **2D** | x, y coordinates | Screen positions, 2D game movement |
| **3D** | x, y, z coordinates | 3D world positions, camera movement |
| **Multi** | Multiple named 1D values | Character bone animations, blend shapes |

### 2. Physics Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Spring** | Oscillates toward target with damping | Natural movements, bouncy animations |
| **Slide** | Friction-based deceleration | Momentum after drag, sliding panels |
| **Drag** | *(Reserved)* Manual dragging with velocity tracking | Drag & drop interactions |
| **Push** | *(Reserved)* Constant-speed movement | WASD-style movement |

### 3. Generated State Properties

When you create a mover named `"position"`, you get these state properties:

- `position`: Current animated value
- `positionGoal`: Target value to animate toward
- `positionIsMoving`: Boolean flag (true while animating)
- `positionMoveMode`: Current physics mode ("spring" | "slide")
- `positionMoveConfigName`: *(Optional)* Named physics config to use
- `positionMoveConfigs`: *(Optional)* Custom physics configurations

### 4. Physics Parameters

```typescript
{
  mass: number;        // Inertia (higher = slower response)
  stiffness: number;   // Spring force toward target (higher = tighter)
  damping: number;     // Resistance to oscillation
  stopSpeed: number;   // Threshold to stop animation
  friction: number;    // Slide mode: decay rate (0-1, higher = more friction)
}
```

---

## Usage Examples

### 1D Mover: Rotate an Element

```typescript
import { moverState, moverRefs, addMoverEffects } from "repond-movers";

const rotatingStore = {
  newState: () => ({
    ...moverState("rotation", { moveMode: "spring" }),
  }),
  newRefs: () => ({
    ...moverRefs("rotation", { stiffness: 20, damping: 8 }),
    element: null as HTMLElement | null,
  }),
};

addMoverEffects("rotating", "rotation", "1d");

// Animate rotation
setState("rotating", { rotationGoal: Math.PI }, "element1");
```

### 2D Mover: Drag & Drop with Momentum

```typescript
const draggableStore = {
  newState: () => ({
    ...moverState("position", { moveMode: "slide" }),
    isDragging: false,
  }),
  newRefs: () => ({
    ...moverRefs("position", { friction: 0.15 }),
  }),
};

addMoverEffects("draggable", "position", "2d");

// On drag end: item slides with momentum
function onDragEnd(itemId: string, velocity: { x: number; y: number }) {
  setState("draggable", {
    positionMoveMode: "slide",
    isDragging: false
  }, itemId);
  // Velocity is maintained in refs, item slides to a stop
}
```

### 3D Mover: Character Movement

```typescript
const characterStore = {
  newState: () => ({
    ...mover3dState("position", { moveMode: "spring" }),
  }),
  newRefs: () => ({
    ...mover3dRefs("position", { mass: 50, stiffness: 12, damping: 8 }),
    mesh: null as THREE.Mesh | null,
  }),
};

addMoverEffects("character", "position", "3d");

// Move character in 3D space
setState("character", {
  positionGoal: { x: 10, y: 0, z: -5 }
}, "hero");
```

### Multi Mover: Character Blend Shapes

```typescript
const characterStore = {
  newState: () => ({
    blendShapes: { smile: 0, blink: 0, speak: 0 },
    blendShapesGoal: { smile: 0, blink: 0, speak: 0 },
    blendShapesIsMoving: false,
    blendShapesMoveMode: "spring" as const,
  }),
  newRefs: () => ({
    ...moverMultiRefs("blendShapes", { stiffness: 25, damping: 10 }),
  }),
};

addMoverEffects("character", "blendShapes", "multi");

// Animate multiple blend shapes simultaneously
setState("character", {
  blendShapesGoal: { smile: 0.8, blink: 1.0, speak: 0.3 }
}, "hero");
```

---

## Advanced Features

### Multiple Physics Configs

Switch between different physics configurations dynamically:

```typescript
const spriteStore = {
  newState: () => ({
    ...moverState("position", {
      moveMode: "spring",
      moveConfigName: "smooth" // Start with "smooth" config
    }),
  }),
  newRefs: () => ({
    ...moverRefs("position", {
      smooth: { mass: 50, stiffness: 12, damping: 9 },
      bouncy: { mass: 30, stiffness: 25, damping: 5 },
      snappy: { mass: 20, stiffness: 30, damping: 12 },
    }),
  }),
};

// Switch to bouncy physics mid-animation
setState("sprite", { positionMoveConfigName: "bouncy" }, "sprite1");
```

### Time Control (Slow Motion, Pause)

Enable time control to slow down or pause all animations:

```typescript
// 1. Setup with time tracking
initMovers(["game", "ticker", "elapsed"]);

// 2. Your game loop updates elapsed time each frame
const tickerStore = {
  newState: () => ({
    elapsed: 0, // Time in milliseconds
  }),
  newRefs: () => ({}),
};

// 3. Update elapsed time each frame
setState("ticker", { elapsed: Date.now() }, "game");

// 4. Slow down time (half speed)
const slowMotionFactor = 0.5;
setState("ticker", { elapsed: previousTime + (frameDelta * slowMotionFactor) }, "game");

// 5. Pause time (freeze animations)
// Simply stop updating the elapsed time state
```

### Direct Mover Control

For advanced use cases, run movers directly without effects:

```typescript
import { runMover } from "repond-movers";

// Manual control of a 2D mover
runMover("2d", {
  itemType: "sprite",
  itemId: "sprite1",
  name: "position",
  frameDuration: 16.667, // milliseconds (60fps)
});
```

---

## API Reference

### Initialization

```typescript
// Optional: Enable time-based animation control
initMovers(timeElapsedStatePath?: [itemType, itemId, propertyName]);
```

### Creating Movers

```typescript
// 1D Mover
import { moverState, moverRefs } from "repond-movers";

moverState(name: string, initialState?: Partial<MoverState>)
moverRefs(name: string, config?: PhysicsConfig)

// 2D Mover
import { mover2dState, mover2dRefs } from "repond-movers";

mover2dState(name: string, initialState?: Partial<Mover2dState>)
mover2dRefs(name: string, config?: PhysicsConfig)

// 3D Mover
import { mover3dState, mover3dRefs } from "repond-movers";

mover3dState(name: string, initialState?: Partial<Mover3dState>)
mover3dRefs(name: string, config?: PhysicsConfig)

// Multi Mover
import { moverMultiRefs } from "repond-movers";

moverMultiRefs(name: string, config?: PhysicsConfig)
```

### Adding Effects

```typescript
addMoverEffects(
  itemType: string,
  moverName: string,
  moverType: "1d" | "2d" | "3d" | "multi"
)
```

### Running Movers Directly

```typescript
runMover(
  moverType: "1d" | "2d" | "3d" | "multi",
  options: {
    itemType: string;
    itemId: string;
    name: string;
    frameDuration: number;
  }
)
```

---

## How It Works

### Frame-Rate Independence

Movers use fixed 0.5ms physics substeps internally, regardless of actual frame rate:

```
Frame (16.6ms at 60fps):
  ├─ Physics substep 0.5ms
  ├─ Physics substep 0.5ms
  ├─ ... (33 substeps)
  └─ Interpolate remaining time
```

This ensures smooth, consistent animations whether running at 30fps, 60fps, or 144fps.

### Spring Physics

Spring mode uses spring-mass-damper system:

```
Force = -stiffness × distance - damping × velocity
Position += velocity × dt
Velocity += (Force / mass) × dt
```

### Slide Physics

Slide mode uses exponential velocity decay:

```
velocity(t) = velocity₀ × e^(-k×t)
where k = -ln(1 - friction)
```

### Stopping Detection

Movers track average speed over recent frames (default: 10 frames). Animation stops when:
- Average speed < stopSpeed threshold
- Value is near target

This prevents jitter and false stops during spring oscillation.

---

## Performance

- **Time Complexity**: O(1) per mover per frame (fixed substeps)
- **Space Complexity**: O(1) per mover (fixed-size refs)
- **GC Pressure**: Low (object pooling in 2D/3D movers)
- **Physics Fidelity**: High (0.5ms substeps provide smooth curves)

Movers are designed for real-time applications with hundreds or thousands of animated entities.

---

## TypeScript Support

Repond-movers inherits full type safety from Repond:

```typescript
// Define your stores
declare module "repond/declarations" {
  interface CustomRepondTypes {
    ItemTypeDefs: {
      sprite: typeof spriteStore;
      character: typeof characterStore;
    };
  }
}

// Get full autocomplete
setState("sprite", { positionGoal: { x: 100, y: 50 } }); // ✓ Type-safe!
```

---

## Tips & Best Practices

### Choosing Physics Parameters

**For smooth, natural movement:**
```typescript
{ mass: 50, stiffness: 12, damping: 9 }
```

**For bouncy, playful animation:**
```typescript
{ mass: 30, stiffness: 25, damping: 5 }
```

**For snappy, responsive movement:**
```typescript
{ mass: 20, stiffness: 30, damping: 12 }
```

**For sliding with momentum:**
```typescript
{ friction: 0.15 } // Lower = slides further
```

### When to Use Each Mover Type

- **1D**: Single values (rotation, scale, opacity, scroll position)
- **2D**: Screen-space positions, UI elements, 2D games
- **3D**: World-space positions, 3D cameras, 3D game objects
- **Multi**: When you need to react to multiple related animations as a group

### Avoiding Common Issues

**Don't read state immediately after setting goal:**
```typescript
// ❌ Won't work - animation runs in effects
setState("sprite", { positionGoal: { x: 100 } });
console.log(getState("sprite").position); // Still at old position

// ✅ Use effects to respond to position changes
makeEffect((id) => {
  console.log(getState("sprite", id).position); // Updated!
}, { changes: ["sprite.position"] });
```

**Switch modes smoothly:**
```typescript
// Velocity is preserved when changing modes/configs
setState("sprite", {
  positionMoveMode: "slide" // Switches from spring to slide, keeps velocity
});
```

---

## Documentation

- [REPOND_README.md](REPOND_README.md) - Learn about Repond state management
- [CLAUDE.md](CLAUDE.md) - AI agent context and comprehensive reference
- [LEARNING_NOTES.md](LEARNING_NOTES.md) - Detailed codebase exploration notes

---

## License

MIT

---

## Acknowledgments

Built for real-time applications where smooth, realistic animations matter.

Depends on:
- [Repond](https://github.com/HugoMcPhee/repond) - High-performance entity state management
- [Chootils](https://github.com/HugoMcPhee/chootils) - Utilities for point operations and physics
