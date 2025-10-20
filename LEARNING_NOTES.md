# Learning Notes: repond-movers Codebase

## Overview
**repond-movers** is a physics-based animation library that integrates with Repond state management to provide smooth, realistic animations using spring physics and friction-based sliding.

**Version**: 1.1.0
**Core Dependencies**: repond ^1.2.0, chootils ^0.3.9

---

## What Problem Does It Solve?
Applications need to animate entity properties (positions, rotations, etc.) with realistic physics behavior across potentially many entities in real-time. repond-movers provides frame-aware, physics-driven animation that integrates seamlessly with Repond's state management and effects system.

---

## Core Concepts

### 1. Movers (Main Abstraction)
A "mover" continuously moves a value toward a goal while applying physics. Four types exist:

- **1D**: Single scalar (rotation, opacity, progress)
- **2D**: 2D points (x, y) for screen positions
- **3D**: 3D points (x, y, z) for world positions
- **Multi**: Multiple named 1D values (blend shapes, character animations)

### 2. State vs Refs (Repond Concept)
- **State**: Serializable animation data (value, valueGoal, isMoving, moveMode)
- **Refs**: Non-serializable runtime data (velocity, recentSpeeds, physics configs)

### 3. Physics Modes
- **Spring**: Oscillating motion to target using spring force + damping
- **Slide**: Friction-based deceleration with exponential decay
- **Drag**: Reserved, not implemented
- **Push**: Reserved, not implemented

### 4. Physics Parameters
```typescript
{
  mass: number;        // Inertia (higher = slower response)
  stiffness: number;   // Force toward target (higher = tighter)
  damping: number;     // Resistance to oscillation
  stopSpeed: number;   // Threshold to stop moving
  friction: number;    // Slide mode: decay rate (0-1)
}
```

### 5. Generated State Properties
Each named mover creates:
- `{name}`: Current animated value
- `{name}Goal`: Target value
- `{name}IsMoving`: Boolean flag
- `{name}MoveMode`: "spring" | "slide" | "drag" | "push"
- `{name}MoveConfigName`: Optional physics config reference
- `{name}MoveConfigs`: Optional custom physics configurations

---

## File Structure

### [/src/index.ts](src/index.ts) - Main Entry Point
**Key Exports**:
- `initMovers(timeElapsedStatePath?)`: Configure optional time tracking
- `addMoverEffects(store, moverName, moverType)`: Create Repond effects for mover lifecycle
- `runMover(moverType, options)`: Direct API to run mover physics

**Two Execution Modes**:
1. Auto-rerun: Mover reschedules itself each frame
2. Effect-driven: External time state triggers updates

### [/src/mover1d.ts](src/mover1d.ts) - 1D Scalar Animation
Animates single numeric values. Uses 0.5ms physics substeps. Slide mode uses exponential decay formula.

**Physics**:
```
Spring: F = -stiffness * positionDiff - damping * velocity
Slide: v_new = v_old * decay^(dt), decay = (1-friction)
```

### [/src/mover2d.ts](src/mover2d.ts) - 2D Vector Animation
Animates 2D points using immutable point operations from chootils. Uses object pooling to reduce GC pressure.

**Key Optimization**: Pre-allocated temp objects reused across frames:
```typescript
const pool = {
  newVelocity: defaultPosition(),
  newPosition: defaultPosition(),
  // ... more
};
```

### [/src/mover3d.ts](src/mover3d.ts) - 3D Vector Animation
Similar to 2D but with 3D point operations. More sophisticated stopping logic using manhattan distance to prevent jitter near target.

**Known Issue** (line 172-174): recentSpeeds array not cleared properly when switching from 'push' to 'spring' mode.

### [/src/moverMulti.ts](src/moverMulti.ts) - Multi-Value Animation
Manages N named 1D animations in parallel. Each value has separate velocity/speed tracking. Stops when ALL animations finish.

**Use Case**: Blend shape weights, multiple character animations running simultaneously.

### [/src/types.ts](src/types.ts) - Type Definitions
- `MoverType`: "1d" | "2d" | "3d" | "multi"
- `MoveMode`: "spring" | "slide" | "drag" | "push"
- `PhysicsConfig`: Flexible physics parameter specification with smart conditional types

### [/src/consts.ts](src/consts.ts) - Constants
- `physicsTimestep = 0.5ms`: Internal physics simulation step
- `recentSpeedsAmount = 10`: Frames averaged for stopping detection
- Mode-specific default physics (different stopSpeed for 1D/2D/3D/Multi)

### [/src/utils.ts](src/utils.ts) - Utilities
- `normalizeDefinedPhysicsConfig`: Converts user physics config to normalized form
- `makeMoverStateMaker`: Factory for creating type-safe mover state makers
- `makeStateNames`: Generates derived property names

### [/src/meta.ts](src/meta.ts) - Global Configuration
Stores `timeElapsedStatePath` for optional effects-driven update mode.

---

## How It Works: Animation Flow

### Initialization
```
1. initMovers(timeElapsedStatePath?)
2. addMoverEffects(store, "positionMover", "3d")
   - Creates effects that watch for goal changes
   - Starts mover when isMoving becomes true
3. setState("sprite", { positionMoverGoal: { x: 100, y: 50 } })
   - Effects fire → positionMoverIsMoving = true → animation starts
```

### Runtime (Auto-rerun Mode)
```
Each frame:
1. runMover called with frameDuration
2. Physics simulation runs in 0.5ms substeps
3. Check stopping: averageSpeed < stopSpeed?
4. setState updates value to new position
5. onNextTick reschedules if still moving
```

### Runtime (Effect-Driven Mode)
```
1. Game loop updates timeState each frame
2. Repond detects change → triggers mover effect
3. Effect calls runMover with frameDuration
4. Physics same as auto-rerun
5. Mover waits for next time change (doesn't reschedule)
```

---

## Key Architectural Patterns

### 1. Physics Substep Simulation
Breaks frame time into fixed 0.5ms steps for frame-rate independence:
```typescript
while (timeRemaining >= physicsTimestep) {
  runPhysicsStep(...);
  timeRemaining -= physicsTimestep;
}
// Interpolate remaining fractional time
```

### 2. Object Pooling (2D/3D)
Pre-allocated temporary objects reduce GC pressure in tight loops.

### 3. Exponential Decay Sliding
Mathematically exact single-step solution for slide mode:
```typescript
v(t) = v0 * e^(-k*t), where k = -ln(1-friction)
```

### 4. Average Speed Tracking
Circular buffer of recent speeds for smoother stopping detection (avoids jitter).

### 5. Generic State/Refs Pattern
Uses Repond's type system for store-agnostic movers with full type safety.

### 6. State Normalization
Physics configs normalized to consistent internal format, supporting single config, multiple named configs, or undefined (uses defaults).

---

## Dependencies on External Libraries

### Repond (Core)
- State management: getState, setState, getRefs
- Effects: makeEffect, startNewEffect, stopEffect
- Timing: onNextTick
- Batching: whenSettingStates
- Type system: AllState, AllRefs

### Chootils (Utilities)
- Point operations: Point2D, Point3D + operations (add, subtract, multiply, interpolate, etc.)
- Array utilities: addToLimitedArray (circular buffer)
- Physics: getAverageSpeed, getVectorSpeed, speed/angle conversions
- Comparisons: pointIsZero, pointBasicallyZero

---

## Known Issues & TODOs

1. **mover1d.ts:136**: Consider setting new position based on current position like mover3d
2. **mover3d.ts:172-174**: FIXME - recentSpeeds array not cleared when moving from 'push' to 'spring', causing low average speeds
3. **index.ts:105**: TEMPORARY - recentSpeeds reset should be automatic for movers

---

## Usage Example
```typescript
import { addItem } from "repond";
import { initMovers, addMoverEffects, moverState, moverRefs } from "repond-movers";

// 1. Setup
initMovers(["game", "ticker", "elapsed"]);

// 2. Create store
const spriteStore = {
  newState: () => ({
    ...moverState("position", { moveMode: "spring" }),
  }),
  newRefs: () => ({
    ...moverRefs("position", { mass: 50, stiffness: 15 }),
  }),
};

// 3. Add effects
addMoverEffects("sprite", "position", "2d");

// 4. Use
addItem("sprite", "sprite1");
setState("sprite", { positionGoal: { x: 100, y: 50 } }, "sprite1");
// Animation happens automatically!
```

---

## Performance Characteristics
- **Time Complexity**: O(1) per mover per frame
- **Space Complexity**: O(1) per mover
- **GC Pressure**: Low (object pooling in 2D/3D)
- **Physics Fidelity**: High (0.5ms substeps)

---

## Design Decisions & Clarifications

### Execution Modes
**Q: Why separate execution modes?**
**A:** Effect-driven mode enables time control - you can slow down or pause time by controlling the elapsed time state. Auto-rerun mode is simpler for standard real-time animations.

### Physics Substep (0.5ms)
**Q: Why 0.5ms?**
**A:** Chosen by trial and error for performance. Works well but may have room for improvement.

### Multi Mover Usage
**Q: When to use moverMulti?**
**A:** Perfect for character bone animation speeds or blend shapes. Example: `{ running: 0.5, walking: 0, waving: 1 }` - allows reacting to a single state change to know when to apply any bone animation changes. More efficient than watching multiple separate 1D movers.

### Reserved Modes
**Q: What are Drag/Push modes?**
**A:**
- **Drag**: Intended for manual dragging (mouse/touch) while recording velocity, so switching from drag to slide creates natural momentum continuation
- **Push**: Intended for constant-speed movement while holding a direction button (like WASD movement)

### Object Pooling Strategy
**Q: Why only in 2D/3D?**
**A:** Memory preservation, not speed. 1D stores a single number, but 2D/3D store objects with x/y/z properties. Pooling avoids creating/destroying many objects every frame.

### canRunOnSlow Flag
**Q: What does this optimize?**
**A:** Allows running callbacks when mover slows down significantly (alternative to only running on complete stop). Original use: when "throwing" a drag-and-drop item, it would shrink as if falling back onto the page when nearly finished sliding. Not used recently.

### Batching with whenSettingStates
**Q: Why batch in 2D/3D but not 1D?**
**A:** Likely an oversight - optimization was done for 2D/3D movers but not applied to 1D.

### Interpolation Differences
**Q: Why interpolate in some but not all?**
**A:** Originally present in all movers, but removed in some cases to improve memory and performance. The effectiveness of this optimization is unclear.

### Spring Physics Parameters
**Q: How do mass/stiffness/damping interact? What are good defaults?**
**A:** This is an open question - would be valuable to align with standard spring system conventions for portability. Current defaults work but may not be optimal or standard.

### Stopping Detection (10 frames)
**Q: Why average 10 frames?**
**A:** Trial and error from early drag-and-drop with momentum projects. Avoids incorrect "stop" triggers when spring oscillates past zero (negative and back to positive).

### Dynamic Physics Switching
**Q: Smooth or jarring when moveConfigName changes?**
**A:** Should be smooth as velocity is maintained while physics config changes (not fully confirmed).

### Effect Lifecycle
**Q: Who manages stopEffect?**
**A:** Usually started once declaratively for movers. In rare cases (e.g., inside React components needing temporary movers), effects can be manually started and stopped.

### Known Issues Priority
**Q: Why not fix recentSpeeds bug?**
**A:** Low priority - stopped/slowed logic hasn't been critical in recent projects (moved from sliding drag-and-drop to 3D games and web animations).

### 1D Position Setting TODO
**Q: Impact of not setting position based on current?**
**A:** Uncertain - possibly less risky for numbers than objects? Updated to fix critical issues in 2D/3D game movements, but not needed for 1D yet.
