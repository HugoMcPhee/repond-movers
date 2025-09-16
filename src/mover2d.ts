import { addToLimitedArray } from "chootils/dist/arrays";
import {
  addPoints as addPointsImmutable,
  copyPoint,
  defaultPosition,
  interpolatePoints,
  Point2D,
  pointBasicallyZero,
  pointIsZero,
  subtractPointsSafer,
  updatePoint,
} from "chootils/dist/points2d";
import { addPoints, dividePoint, multiplyPoint, subtractPoints } from "chootils/dist/points2dInPlace";
import { getAverageSpeed } from "chootils/dist/speedAngleDistance";
import {
  getSpeedAndAngleFromVector,
  getVectorFromSpeedAndAngle,
  getVectorSpeed,
} from "chootils/dist/speedAngleDistance2d";
import { getRefs, getState, ItemType, onNextTick, setState, whenSettingStates } from "repond";
import {
  defaultOptions,
  defaultPhysics,
  physicsTimestep,
  physicsTimestepInSeconds,
  recentSpeedsAmount,
} from "./consts";
import { AnyMoverStateNames, MoveMode, PhysicsConfig, PhysicsOptions, RunMoverOptions } from "./types";
import { makeMoverStateMaker, makeStateNames, normalizeDefinedPhysicsConfig } from "./utils";

export type PositionAndVelocity = {
  position: Point2D;
  velocity: Point2D;
};

/*
New options:
allow interpolating
*/

const DEFAULT_SPRING_STOP_SPEED = defaultPhysics("2d").stopSpeed;

type MainValueType = ReturnType<typeof defaultPosition>;

export const mover2dState = makeMoverStateMaker(defaultPosition) as <
  T_Name extends string,
  T_PhysicsNames extends string,
  T_InitialState extends {
    value?: MainValueType; // T_ValueType
    valueGoal?: MainValueType; // T_ValueType
    isMoving?: boolean;
    moveConfigName?: T_PhysicsNames;
    moveMode?: MoveMode;
    moveConfigs?: Record<T_PhysicsNames, PhysicsOptions>;
  }
>(
  newName: T_Name,
  initialState?: T_InitialState
) => Record<T_Name, MainValueType> &
  Record<`${T_Name}Goal`, MainValueType> &
  Record<`${T_Name}IsMoving`, boolean> &
  Record<`${T_Name}MoveMode`, MoveMode> &
  (T_InitialState["moveConfigName"] extends undefined ? {} : Record<`${T_Name}MoveConfigName`, T_PhysicsNames>) &
  (T_InitialState["moveConfigs"] extends undefined
    ? {}
    : Record<`${T_Name}MoveConfigs`, Record<T_PhysicsNames, PhysicsOptions>>);

export function mover2dRefs<T_Name extends string>(newName: T_Name, config?: PhysicsConfig) {
  const newRefs = {
    velocity: defaultPosition(),
    recentSpeeds: [] as number[],
    averageSpeed: 0,
    canRunOnSlow: true,
    stateNames: makeStateNames(newName),
    physicsConfigs: normalizeDefinedPhysicsConfig(config, "2d"),
  };

  return {
    [`${newName}MoverRefs`]: newRefs,
  } as Record<`${T_Name}MoverRefs`, typeof newRefs>;
}

const rerunOptions: RunMoverOptions<any> = {
  frameDuration: 16.6667,
  id: "",
  type: "",
  onSlow: undefined,
  mover: "",
  autoRerun: true,
};

export function runMover2d<T_ItemType extends ItemType>({
  frameDuration = 16.6667,
  id: itemId,
  type: itemType,
  mover: moverName,
  autoRerun,
  onSlow,
}: RunMoverOptions<T_ItemType>) {
  // repeated for all movers Start
  const itemRefs = getRefs(itemType, itemId) as any;
  const itemState = getState(itemType, itemId);
  const moverRefs = itemRefs[`${moverName}MoverRefs`];
  const keys: AnyMoverStateNames = moverRefs.stateNames;

  const nowStepState = {
    position: copyPoint(itemState[keys.value]),
    // velocity: copyPoint(moverRefs.velocity),
    velocity: moverRefs.velocity,
  };
  const prevStepState = {
    position: copyPoint(nowStepState.position),
    velocity: copyPoint(nowStepState.velocity),
  };
  const moveMode: MoveMode = itemState[keys.moveMode] ?? defaultOptions.moveMode;

  const physicsConfigs = itemState[keys.physicsConfigs] ?? moverRefs.physicsConfigs;

  const physicsOptions =
    physicsConfigs[itemState?.[keys?.physicsConfigName]] ?? physicsConfigs[defaultOptions.physicsConfigName];

  const targetPosition = itemState[keys.valueGoal];
  // let prevStepState = currentStepState;
  let timeRemainingForPhysics = frameDuration;
  // repeated for all movers End

  // TODO could use a ref for this value, and copy into it
  const originalPositon = copyPoint(itemState[keys.value]);

  const springStopSpeed = physicsOptions.stopSpeed ?? DEFAULT_SPRING_STOP_SPEED;

  if (moveMode === "slide") {
    // one exact step for this frame (clamped like 1d)
    const dtSec = Math.max(0, Math.min(frameDuration, 100)) / 1000;
    stepSlide2d(nowStepState, physicsOptions.friction, dtSec);
  } else {
    while (timeRemainingForPhysics >= physicsTimestep) {
      updatePoint(prevStepState.position, nowStepState.position);
      updatePoint(prevStepState.velocity, nowStepState.velocity);
      run2dPhysicsStep(nowStepState, moveMode, physicsOptions, targetPosition);
      timeRemainingForPhysics -= physicsTimestep;
    }
  }

  // can just use the current position if interpolating isn't needed
  const newPosition =
    moveMode === "slide"
      ? nowStepState.position // no interpolation needed for the exact step
      : interpolatePoints(nowStepState.position, prevStepState.position, timeRemainingForPhysics / physicsTimestep);

  moverRefs.velocity = nowStepState.velocity;

  // Check shouldKeepMoving
  // note could move this to inside the setState to get latest state and use actualNewPosition
  const currentSpeed = getVectorSpeed(moverRefs.velocity);
  addToLimitedArray(moverRefs.recentSpeeds, currentSpeed, recentSpeedsAmount);

  const hasEnoughSpeeds = moverRefs.recentSpeeds.length >= recentSpeedsAmount - 1;

  const averageSpeed = hasEnoughSpeeds ? getAverageSpeed(moverRefs.recentSpeeds) : Infinity;

  moverRefs.averageSpeed = averageSpeed;

  const isAutoMovementType = itemState[keys.moveMode] === "spring" || itemState[keys.moveMode] === "slide";

  let shouldKeepMoving = true;
  if (isAutoMovementType) shouldKeepMoving = itemState[keys.isMoving] && averageSpeed > springStopSpeed;
  // console.log(itemState[keys.isMoving], averageSpeed, springStopSpeed);

  if (!shouldKeepMoving) {
    // console.log("shouldKeepMoving", shouldKeepMoving);

    setState(`${itemType}.${keys.isMoving}`, false, itemId);
  }

  whenSettingStates(() => {
    const currentPosition = getState(itemType, itemId)[keys.value];
    const positionDifference = subtractPointsSafer(newPosition, originalPositon);

    if (pointIsZero(positionDifference) || pointBasicallyZero(positionDifference)) {
      setState(`${itemType}.${keys.isMoving}`, false, itemId);
    }

    const actualNewPosition = addPointsImmutable(currentPosition, positionDifference);

    setState(`${itemType}.${keys.value}`, actualNewPosition, itemId);
  });
  onNextTick((nextFrameDuration) => {
    const newItemState = getState(itemType, itemId);

    // NOTE possibly move this so the onNextTick isn't needed
    if (isAutoMovementType) {
      if (moverRefs.canRunOnSlow && averageSpeed < 150) {
        moverRefs.canRunOnSlow = false;
        onSlow?.();
      }
    }
    if (!autoRerun) return;
    if (newItemState[keys.isMoving]) {
      // NOTE
      // the next frame mover always runs at the very start of the next frame
      // could add a fow option to movers to react to a frame tick on specific frame

      rerunOptions.frameDuration = nextFrameDuration;
      rerunOptions.id = itemId;
      rerunOptions.type = itemType;
      rerunOptions.onSlow = onSlow;
      rerunOptions.mover = moverName;
      rerunOptions.autoRerun = autoRerun;

      runMover2d(rerunOptions);
    }
  });
}

// Exact per-frame slide step (no physics sub-steps)
export function stepSlide2d(state: { position: Point2D; velocity: Point2D }, friction: number, dtSeconds: number) {
  // clamp for safety (same bounds as 1d)
  friction = Math.max(0, Math.min(0.9999, friction));

  const remainPerSecond = 1 - friction;
  const decay = Math.pow(remainPerSecond, dtSeconds);

  // v1 = v0 * decay  (keep originals in temporaries)
  const v0 = copyPoint(state.velocity);
  const v1 = copyPoint(state.velocity);
  multiplyPoint(v1, decay);

  // exact displacement under exponential decay
  const k = -Math.log(remainPerSecond);

  // dx = (v0 - v1) / k   (vector form)
  let dx = subtractPointsSafer(v0, v1);
  if (k > 1e-6) {
    dividePoint(dx, k);
  } else {
    // near-zero friction → linear fallback
    dx = v0;
    multiplyPoint(dx, dtSeconds);
  }

  // apply
  addPoints(state.position, dx); // mutate position in-place
  updatePoint(state.velocity, v1); // keep object identity
}

// runPhysicsStepObjectPool
const pool = {
  // new both start out as the original value , and get updated in place
  newVelocity: defaultPosition(),
  newPosition: defaultPosition(),
  //
  positionCopy: defaultPosition(),
  velocityCopy: defaultPosition(),
  velocityCopyB: defaultPosition(),
  amountMoved: defaultPosition(),
};

function run2dPhysicsStep(
  stepState: PositionAndVelocity,
  moveMode: MoveMode,
  physicsOptions: PhysicsOptions,
  targetPosition: Point2D
) {
  const { mass, stiffness, damping, friction } = physicsOptions;

  updatePoint(pool.newVelocity, stepState.velocity);
  updatePoint(pool.newPosition, stepState.position);

  switch (moveMode) {
    case "spring":
      {
        // so we dont edit the original object directly
        updatePoint(pool.positionCopy, stepState.position);
        updatePoint(pool.velocityCopy, stepState.velocity);
        updatePoint(pool.velocityCopyB, stepState.velocity);

        const positionDifference = subtractPoints(pool.positionCopy, targetPosition);
        const springForce = multiplyPoint(positionDifference, -stiffness);
        const dampingForce = multiplyPoint(pool.velocityCopy, damping);
        const force = subtractPoints(springForce, dampingForce);
        const acceleration = dividePoint(force, mass);
        const accelerationWithTime = multiplyPoint(acceleration, physicsTimestep);

        addPoints(pool.newVelocity, accelerationWithTime);
      }
      break;
    case "slide":
      {
        const { speed, angle } = getSpeedAndAngleFromVector(stepState.velocity);
        const newSpeed = Math.max(speed * Math.pow(1 - friction, physicsTimestepInSeconds * 10), 0);

        pool.newVelocity = getVectorFromSpeedAndAngle(newSpeed, angle);
      }
      break;
    case "drag":
      break;
    case "push":
      break;
    default:
  }

  updatePoint(pool.amountMoved, pool.newVelocity);
  multiplyPoint(pool.amountMoved, physicsTimestepInSeconds);
  addPoints(pool.newPosition, pool.amountMoved);

  updatePoint(stepState.position, pool.newPosition);
  updatePoint(stepState.velocity, pool.newVelocity);
}

// export {
// mover2dState,
// mover2dRefs,
// runMover2d,
// };
// }
