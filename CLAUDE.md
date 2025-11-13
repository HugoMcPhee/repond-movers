# CLAUDE.md - AI Agent Context for Repond-Movers

This document provides comprehensive context for AI agents (like Claude, ChatGPT, etc.) working with the repond-movers codebase.

---

## Project Overview

**repond-movers** is a physics-based animation library that extends Repond (a high-performance entity state management system) with smooth, realistic motion capabilities using spring physics and friction-based sliding.

**Version**: 1.2.0
**License**: MIT
**Dependencies**: repond ^1.2.0, chootils ^0.3.9

---

## Core Purpose

The library solves the problem of animating entity properties in real-time applications with:
- Realistic physics behavior (spring-mass-damper, exponential decay)
- Frame-rate independence (works smoothly at any FPS)
- Multiple dimensions (1D scalars, 2D/3D points, multiple named values)
- Declarative API (set goal, physics handles the rest)
- Time control (slow motion, pause via state)

**Target Use Cases:**
- Drag & drop with momentum
- 3D game character/camera movements
- Smooth UI transitions
- Character bone/blend shape animations
- Any scenario requiring smooth, physics-based value interpolation

---

## Architecture Overview

### File Structure

```
src/
├── index.ts          # Main entry point, exports, initialization
├── mover1d.ts        # 1D scalar animation
├── mover2d.ts        # 2D point animation (with object pooling)
├── mover3d.ts        # 3D point animation (with object pooling)
├── moverMulti.ts     # Multiple named 1D animations
├── types.ts          # TypeScript type definitions
├── consts.ts         # Constants and defaults
├── utils.ts          # Utility functions and factories
└── meta.ts           # Global configuration storage
```

### Core Abstractions

#### 1. Movers
A mover is an animated value that continuously moves toward a goal using physics:
- **1D**: Single number (rotation, opacity, etc.)
- **2D**: {x, y} point (screen positions)
- **3D**: {x, y, z} point (world positions)
- **Multi**: {name1: value1, name2: value2, ...} (blend shapes, bone animations)

#### 2. State vs Refs (Repond Concept)
- **State**: Serializable data (value, goal, isMoving, moveMode)
- **Refs**: Non-serializable runtime data (velocity, recentSpeeds, physics configs)

#### 3. Physics Modes
- **Spring**: Oscillates toward target with mass/stiffness/damping
- **Slide**: Exponential velocity decay with friction
- **Drag**: *(Reserved)* Manual input with velocity tracking
- **Push**: *(Reserved)* Constant-speed directional movement

#### 4. Execution Modes
- **Auto-rerun**: Mover reschedules itself via onNextTick
- **Effect-driven**: External time state triggers updates (enables slow-mo/pause)

---

## Key Implementation Details

### Physics Simulation

**Fixed Substeps**: All movers break frame time into 0.5ms physics substeps for frame-rate independence.

```typescript
while (timeRemaining >= 0.5) {
  runPhysicsStep(); // Apply forces, update position/velocity
  timeRemaining -= 0.5;
}
// Interpolate remaining fractional time
```

**Spring Physics** (1D/2D/3D):
```
Force = -stiffness × positionDiff - damping × velocity
Velocity += (Force / mass) × dt
Position += Velocity × dt
```

**Slide Physics** (Exponential Decay):
```
velocity(t) = velocity₀ × e^(-k×t)
where k = -ln(1 - friction)
```

### Stopping Detection

Movers track average speed over recent 10 frames. Animation stops when:
- Average speed < stopSpeed threshold
- Value is near target

This prevents jitter and false stops during oscillation.

### Object Pooling (2D/3D Only)

Pre-allocated temporary objects are reused across frames to reduce GC pressure:
```typescript
const pool = {
  newVelocity: defaultPosition(),
  newPosition: defaultPosition(),
  // ... more temp objects
};
```

**Why only 2D/3D?** 1D stores scalar numbers, but 2D/3D store objects with x/y/z properties. Pooling avoids creating/destroying many objects per frame.

---

## API Reference

### Initialization

```typescript
import { initMovers } from "repond-movers";

// Optional: Enable time control for slow-mo/pause
initMovers(["game", "ticker", "elapsed"]);
// Movers will watch game.ticker.elapsed for frame time updates
```

### Creating Movers

**1D Mover:**
```typescript
import { moverState, moverRefs } from "repond-movers";

const store = {
  newState: () => ({
    ...moverState("rotation", { moveMode: "spring" }),
  }),
  newRefs: () => ({
    ...moverRefs("rotation", { stiffness: 20, damping: 8 }),
  }),
};
```

This creates state properties:
- `rotation`: Current value
- `rotationGoal`: Target value
- `rotationIsMoving`: Boolean
- `rotationMoveMode`: "spring" | "slide" | "drag" | "push"
- `rotationMoveConfigName?`: Optional named config
- `rotationMoveConfigs?`: Optional custom configs

**2D Mover:**
```typescript
import { mover2dState, mover2dRefs } from "repond-movers";

mover2dState("position", { moveMode: "spring" })
mover2dRefs("position", { mass: 50, stiffness: 15, damping: 9 })
```

**3D Mover:**
```typescript
import { mover3dState, mover3dRefs } from "repond-movers";

mover3dState("position", { moveMode: "spring" })
mover3dRefs("position", { mass: 50, stiffness: 12, damping: 8 })
```

**Multi Mover:**
```typescript
import { moverMultiRefs } from "repond-movers";

// State defined manually (moverMulti doesn't have state maker)
newState: () => ({
  blendShapes: { smile: 0, blink: 0, speak: 0 },
  blendShapesGoal: { smile: 0, blink: 0, speak: 0 },
  blendShapesIsMoving: false,
  blendShapesMoveMode: "spring" as const,
})

// Refs
moverMultiRefs("blendShapes", ["smile", "blink", "speak"], { stiffness: 25, damping: 10 })
```

### Adding Effects

```typescript
import { addMoverEffects } from "repond-movers";

// Creates Repond effects that:
// 1. Watch for goal changes → set isMoving=true
// 2. Start animation when isMoving becomes true
// 3. Stop effects when animation completes
addMoverEffects("sprite", "position", "2d");
```

### Using Movers

```typescript
import { setState } from "repond";

// Set goal to start animation
setState("sprite", { positionGoal: { x: 100, y: 50 } }, "sprite1");

// Change physics mode mid-animation (velocity preserved)
setState("sprite", { positionMoveMode: "slide" }, "sprite1");

// Switch physics config (if multiple defined)
setState("sprite", { positionMoveConfigName: "bouncy" }, "sprite1");
```

### Direct Control (Advanced)

```typescript
import { runMover } from "repond-movers";

// Manually run mover for one frame
runMover("2d", {
  itemType: "sprite",
  itemId: "sprite1",
  name: "position",
  frameDuration: 16.667, // ms
});
```

---

## Physics Parameter Tuning

### Default Values by Dimension

| Dimension | stopSpeed | Rationale |
|-----------|-----------|-----------|
| 1D | 0.01 | Small threshold for precise scalar values |
| 2D | 1.0 | Larger for screen-space pixel distances |
| 3D | 0.5 | Medium for world-space units |
| Multi | 1.0 | Same as 2D |

### Recommended Presets

**Smooth, natural movement:**
```typescript
{ mass: 50, stiffness: 12, damping: 9 }
```

**Bouncy, playful:**
```typescript
{ mass: 30, stiffness: 25, damping: 5 }
```

**Snappy, responsive:**
```typescript
{ mass: 20, stiffness: 30, damping: 12 }
```

**Sliding with momentum:**
```typescript
{ friction: 0.15 } // Lower = slides further
```

### Physics Parameters Explained

- **mass**: Inertia. Higher = slower to accelerate/decelerate
- **stiffness**: Spring force toward target. Higher = tighter spring
- **damping**: Resistance to oscillation. Higher = less bouncy
- **friction**: Slide mode decay rate (0-1). Higher = more friction
- **stopSpeed**: Threshold below which animation stops

---

## Common Patterns

### Multiple Physics Configs

```typescript
newRefs: () => ({
  ...moverRefs("position", {
    smooth: { mass: 50, stiffness: 12, damping: 9 },
    bouncy: { mass: 30, stiffness: 25, damping: 5 },
    snappy: { mass: 20, stiffness: 30, damping: 12 },
  }),
})

// Switch dynamically
setState("sprite", { positionMoveConfigName: "bouncy" });
```

### Time Control (Slow Motion/Pause)

```typescript
// Setup
initMovers(["game", "ticker", "elapsed"]);

// Normal time
setState("ticker", { elapsed: Date.now() }, "game");

// Slow motion (half speed)
setState("ticker", { elapsed: prevTime + (frameDelta * 0.5) }, "game");

// Pause (stop updating elapsed)
// Don't call setState for elapsed
```

### Drag & Drop with Momentum

```typescript
// Spring mode while dragging (follows mouse)
setState("item", { positionMoveMode: "spring" });

// Slide mode on release (momentum)
setState("item", { positionMoveMode: "slide" });
// Velocity preserved, item slides to stop
```

---

## Known Issues & TODOs

### [mover1d.ts:136](src/mover1d.ts#L136)
**TODO**: Consider setting new position based on current position like mover3d does.
- **Impact**: Unclear, possibly affects interpolation accuracy
- **Priority**: Low - hasn't caused issues in practice

### [mover3d.ts:172-174](src/mover3d.ts#L172-L174)
**FIXME**: recentSpeeds array not cleared when switching from 'push' to 'spring' mode.
- **Impact**: Low average speed calculation at mode change
- **Priority**: Low - push mode not implemented, stopped/slowed logic not used recently

### [index.ts:105](src/index.ts#L105)
**TEMPORARY**: recentSpeeds reset should be automatic for movers.
- **Current**: Manual clearing for 3D spring mode
- **Desired**: Automatic detection and clearing

---

## Design Decisions & Rationale

### Why 0.5ms substep?
Chosen by trial and error for performance. Works well but may have room for improvement.

### Why separate execution modes?
- **Auto-rerun**: Simpler for standard real-time animations
- **Effect-driven**: Enables time control (slow-mo, pause) via state changes

### Why object pooling only in 2D/3D?
Memory preservation, not speed. 1D stores scalars, but 2D/3D store objects. Pooling avoids creating/destroying objects every frame.

### Why average 10 frames for stopping?
Trial and error from drag-and-drop projects. Prevents incorrect "stop" triggers when spring oscillates past zero (negative and back to positive).

### Why different stopSpeed defaults?
Based on typical use cases:
- 1D: Precise scalar values (0.01)
- 2D: Screen pixel distances (1.0)
- 3D: World space units (0.5)

### Why is interpolation inconsistent?
Originally present in all movers, removed in some for performance. Effectiveness unclear, may be revisited.

### Why batching only in 2D/3D?
Likely oversight during optimization. 1D didn't get the same treatment.

---

## Type System Integration

Repond-movers uses Repond's type system for full type safety:

```typescript
// Extend Repond types
declare module "repond/declarations" {
  interface CustomRepondTypes {
    ItemTypeDefs: {
      sprite: typeof spriteStore;
    };
  }
}

// Get full autocomplete
setState("sprite", { positionGoal: { x: 100, y: 50 } }); // ✓ Type-safe
```

Key types:
- `MoverType`: "1d" | "2d" | "3d" | "multi"
- `MoveMode`: "spring" | "slide" | "drag" | "push"
- `PhysicsConfig`: Flexible physics parameter object
- `OnePhysicsConfig`: Complete physics settings for one mode

---

## Testing & Debugging

### Checking if mover is working

```typescript
// Check state
const sprite = getState("sprite", "sprite1");
console.log(sprite.positionIsMoving); // true while animating
console.log(sprite.position); // Current position
console.log(sprite.positionGoal); // Target position

// Check refs
const refs = getRefs("sprite", "sprite1");
console.log(refs.velocity); // Current velocity
console.log(refs.recentSpeeds); // Speed history (max 10)
```

### Common Issues

**Animation not starting:**
- Check that `addMoverEffects` was called
- Verify goal is different from current value
- Ensure itemId exists (addItem was called)

**Animation stopping too early/late:**
- Adjust `stopSpeed` in physics config
- Check `recentSpeeds` array in refs for speed history

**Jittery motion:**
- Increase damping (reduces oscillation)
- Decrease stiffness (softer spring)
- Check stopSpeed isn't too high

**Animation doesn't respect time changes:**
- Verify `initMovers` was called with correct path
- Check that time state is being updated each frame
- Ensure path matches actual state structure

---

## Performance Characteristics

- **Time Complexity**: O(1) per mover per frame (fixed substeps)
- **Space Complexity**: O(1) per mover (fixed-size refs)
- **GC Pressure**: Low (object pooling in 2D/3D)
- **Physics Fidelity**: High (0.5ms substeps)
- **Scalability**: Handles hundreds to thousands of movers

**Note**: Only processes movers that are currently moving (isMoving=true).

---

## Implementation Differences Between Mover Types

### Position Update Strategy

**CRITICAL DIFFERENCE**: Movers use different strategies for updating position:

**1D & Multi**: Direct value assignment
```typescript
setState(`${itemType}.${keys.value}`, newPosition, itemId);
```

**2D & 3D**: Additive delta calculation
```typescript
whenSettingStates(() => {
  const currentPosition = getState(itemType, itemId)[keys.value];
  const positionDifference = subtractPointsSafer(newPosition, originalPosition);
  const actualNewPosition = addPointsImmutable(currentPosition, positionDifference);
  setState(`${itemType}.${keys.value}`, actualNewPosition, itemId);
});
```

**Why This Matters**: The additive approach in 2D/3D allows **multiple concurrent movers** to affect the same property (their deltas are summed). In 1D/Multi, concurrent movers would overwrite each other.

### Stopping Detection Logic

Each mover type has **different** stopping logic:

| Mover Type | Stopping Criteria |
|------------|------------------|
| **1D** | Average speed < stopSpeed |
| **2D** | Average speed < stopSpeed AND no zero-movement detected |
| **3D** | Average speed < stopSpeed AND manhattan distance < 0.15 OR zero-movement detected |
| **Multi** | ALL individual animations: average speed < stopSpeed AND near target |

### Interpolation Status

| Mover Type | Interpolation | Notes |
|------------|---------------|-------|
| **1D** | ❌ Disabled | Commented out due to iPad issues (line 132-145) |
| **2D** | ✅ Enabled for spring<br>❌ Disabled for slide | Slide uses exact single-step calculation |
| **3D** | ✅ Enabled for spring<br>❌ Disabled for slide | Slide uses exact single-step calculation |
| **Multi** | ❌ No interpolation | Uses direct position after substeps |

### Batching Optimization

| Mover Type | Uses whenSettingStates | Purpose |
|------------|------------------------|---------|
| **1D** | ❌ No | Likely oversight |
| **2D** | ✅ Yes | Batches state updates, enables additive deltas |
| **3D** | ✅ Yes | Batches state updates, enables additive deltas |
| **Multi** | ❌ No | Directly sets all values |

---

## Undocumented Refs Properties

### All Movers
- `stateNames`: Generated property names (e.g., `{ value: "position", valueGoal: "positionGoal", ... }`)
- `physicsConfigs`: Normalized physics configurations
- `recentSpeeds`: Array of recent frame speeds (max 10) for stopping detection

### 1D & Multi Only
- `velocity`: Single number

### 2D & 3D Only
- `velocity`: Point2D/Point3D object
- `averageSpeed`: Current calculated average speed (useful for debugging/inspection)
- `canRunOnSlow`: Boolean flag for onSlow callback (resets each animation)

### Multi Only
- `animRefs`: Record of per-animation refs `{ [animName]: { velocity, recentSpeeds } }`
- `animNames`: Array of animation names

---

## Hardcoded Thresholds & Magic Numbers

These values are **not configurable** via physics config:

| Constant | Value | Location | Purpose |
|----------|-------|----------|---------|
| **onSlow threshold** | `150` | mover2d.ts:193, mover3d.ts:214 | Triggers onSlow callback when average speed drops below |
| **3D close distance** | `0.15` | mover3d.ts:190 | Manhattan distance threshold for "close enough to target" |
| **1D/Multi near target** | `0.01` | mover1d.ts:155, moverMulti.ts:146 | Absolute distance threshold for "near target" |
| **Slide min speed** | `0.003` | mover1d.ts:157, moverMulti.ts:147 | Minimum speed before stopping in slide mode |
| **Recent speeds count** | `10` | consts.ts:9 | Number of frames averaged for stopping detection |
| **Frame time clamp** | `100ms` | mover1d:117, mover2d:134, mover3d:144 | Maximum frame time for slide mode calculation |

---

## onSlow Callback (Partially Implemented)

**Status**: Working in 2D/3D movers only (not in 1D/Multi)

**How to use**:
```typescript
runMover("2d", {
  itemType: "sprite",
  itemId: "sprite1",
  name: "position",
  frameDuration: 16.667,
  onSlow: () => {
    console.log("Mover slowed down significantly!");
    // e.g., trigger visual effect when drag-and-drop item nearly stops
  }
});
```

**Behavior**:
- Only triggers when `averageSpeed < 150`
- Triggers **once per animation** (canRunOnSlow flag prevents re-triggering)
- Only works in **auto-rerun mode** (not effect-driven mode)
- **NOT available** via `addMoverEffects` API (must use `runMover` directly)

**Original Use Case**: Drag-and-drop items that visually "shrink" or "settle" as they slow down before stopping.

---

## Future Considerations

### Unimplemented Features

**Drag Mode**: Manual input with velocity tracking
- Intended for mouse/touch dragging
- Velocity recorded for smooth slide transition
- No current timeline for implementation

**Push Mode**: Constant-speed directional movement
- Intended for button-held movement (WASD)
- Maintains constant velocity while active
- No current timeline for implementation

### Potential Improvements

1. **Spring parameter standardization**: Align with industry standards (React Spring, Framer Motion, etc.) for portability
2. **Automatic recentSpeeds clearing**: Remove manual workarounds
3. **Consistent interpolation**: Decide on interpolation strategy across all mover types
4. **Batching for 1D**: Apply whenSettingStates optimization to 1D movers
5. **onSlow callbacks**: Fully implement and document slow-motion callbacks

---

## Dependencies

### Repond (Core Dependency)
State management with effects system. Key APIs used:
- `getState`, `getPrevState`, `setState`, `getRefs`
- `makeEffect`, `startNewEffect`, `stopEffect`
- `onNextTick`, `whenSettingStates`
- Type system: `AllState`, `AllRefs`, `ItemType`

### Chootils (Utility Library)
Point operations and physics helpers. Key functions:
- Point operations: `Point2D`, `Point3D`, add, subtract, multiply, interpolate, copy, updatePoint
- Physics: `getAverageSpeed`, `getVectorSpeed`, speed/angle conversions
- Arrays: `addToLimitedArray` (circular buffer)
- Comparisons: `pointIsZero`, `pointBasicallyZero`

---

## Working with This Codebase

### When Adding Features

1. **Maintain frame-rate independence**: Use substep simulation
2. **Consider object pooling**: For new vector types, reuse objects
3. **Preserve velocity**: When changing modes/configs
4. **Update all mover types**: Keep 1D/2D/3D/Multi in sync
5. **Test at different frame rates**: 30fps, 60fps, 144fps

### When Fixing Bugs

1. **Check all mover types**: Bug may exist in multiple files
2. **Consider velocity state**: Often the root cause
3. **Test mode switching**: Bugs often appear during transitions
4. **Verify stopping logic**: recentSpeeds may be involved

### Code Style

- **Immutable point operations**: Use chootils functions, not direct mutation
- **Type safety**: Leverage Repond's type system
- **Performance**: Avoid allocations in hot loops (use pooling)
- **Comments**: Explain "why", not "what"

---

## Quick Reference

### Imports

```typescript
// Main API
import { initMovers, addMoverEffects, runMover } from "repond-movers";

// 1D
import { moverState, moverRefs } from "repond-movers";

// 2D
import { mover2dState, mover2dRefs } from "repond-movers";

// 3D
import { mover3dState, mover3dRefs } from "repond-movers";

// Multi
import { moverMultiRefs } from "repond-movers";

// Utils
import { makeMoverStateMaker } from "repond-movers";
```

### Typical Setup Flow

```typescript
// 1. Init (optional time control)
initMovers(["game", "ticker", "elapsed"]);

// 2. Define store
const store = {
  newState: () => ({ ...moverState("prop") }),
  newRefs: () => ({ ...moverRefs("prop", { stiffness: 15 }) }),
};

// 3. Add effects
addMoverEffects("itemType", "prop", "1d");

// 4. Use
addItem("itemType", "item1");
setState("itemType", { propGoal: 100 }, "item1");
```

---

## Additional Resources

- **README.md**: User-facing documentation with examples
- **REPOND_README.md**: Comprehensive Repond documentation
- **LEARNING_NOTES.md**: Detailed codebase exploration notes
- **Source code**: Heavily commented, especially in [src/index.ts](src/index.ts)

---

## Contact & Contributing

For questions, issues, or contributions, please refer to the repository's issue tracker and contribution guidelines.

This library is actively used in production for 3D games and web animations.
