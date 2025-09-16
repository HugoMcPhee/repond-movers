import { addToLimitedArray } from "chootils/dist/arrays";
import { getAverageSpeed } from "chootils/dist/speedAngleDistance";
import { getRefs, getState, onNextTick, setState } from "repond";
import {
  defaultOptions,
  defaultPhysics,
  // maximumFrameTime,
  physicsTimestep,
  physicsTimestepInSeconds,
  recentSpeedsAmount,
} from "./consts";
import { AnyMoverStateNames, ItemType, MoveMode, PhysicsConfig, PhysicsOptions, RunMoverOptions } from "./types";
import { makeMoverStateMaker, makeStateNames, normalizeDefinedPhysicsConfig } from "./utils";

/*
New options:
allow interpolating
refNames.averageSpeed
*/

export type PositionAndVelocity = {
  position: number;
  velocity: number;
};

const DEFAULT_SPRING_STOP_SPEED = defaultPhysics("1d").stopSpeed;

type MainValueType = number;

// manually retyped because d.ts had some trouble with nested functions?
export const moverState = makeMoverStateMaker(() => 0) as <
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

export function moverRefs<T_Name extends string>(newName: T_Name, config?: PhysicsConfig) {
  const newRefs = {
    velocity: 0,
    recentSpeeds: [] as number[],
    stateNames: makeStateNames(newName),
    physicsConfigs: normalizeDefinedPhysicsConfig(config, "1d"),
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

export function runMover1d<T_ItemType extends ItemType>({
  frameDuration = 16.6667,
  type: itemType,
  id: itemId,
  mover: moverName,
  autoRerun,
}: // onSlow,
RunMoverOptions<T_ItemType>) {
  // repeated for all movers Start
  const itemRefs = getRefs(itemType, itemId) as any;
  const itemState = getState(itemType, itemId) as any;

  const moverRefs = itemRefs[`${moverName}MoverRefs`];
  const keys: AnyMoverStateNames = moverRefs.stateNames;

  const nowStepState = {
    position: itemState[keys.value],
    velocity: moverRefs.velocity,
  };
  const prevStepState = {
    position: nowStepState.position,
    velocity: nowStepState.velocity,
  };

  const moveMode: MoveMode = itemState[keys.moveMode] ?? defaultOptions.moveMode;

  const physicsConfigs = itemState[keys.physicsConfigs] ?? moverRefs.physicsConfigs;

  const physicsOptions =
    physicsConfigs[itemState?.[keys?.physicsConfigName]] ?? physicsConfigs[defaultOptions.physicsConfigName];

  const targetPosition = itemState[keys.valueGoal];
  let timeRemainingForPhysics = frameDuration;
  // repeated for all movers End

  prevStepState.position = nowStepState.position;
  prevStepState.velocity = nowStepState.velocity;

  const springStopSpeed = physicsOptions.stopSpeed ?? DEFAULT_SPRING_STOP_SPEED;

  if (moveMode === "slide") {
    const dtSec = Math.max(0, Math.min(frameDuration, 100)) / 1000;

    stepSlide1d(nowStepState, physicsOptions.friction, dtSec);
  } else {
    while (timeRemainingForPhysics >= physicsTimestep) {
      // prevStepState = currentStepState;
      // currentStepState = runPhysicsStep(
      run1dPhysicsStep(nowStepState, targetPosition, moveMode, physicsOptions);
      timeRemainingForPhysics -= physicsTimestep;
    }
  }

  while (timeRemainingForPhysics >= physicsTimestep) {
    // prevStepState = currentStepState;
    // currentStepState = runPhysicsStep(
    run1dPhysicsStep(nowStepState, targetPosition, moveMode, physicsOptions);
    timeRemainingForPhysics -= physicsTimestep;
  }

  // TODO maybe set the new position based on the current position like mover 3d
  let interpolatedPosition = nowStepState.position;

  // caused it to stop working on iPad ?
  // const remainingTimestepPercent = timeRemainingForPhysics / physicsTimestep;
  // interpolatedPosition = interpolateValues(
  //   currentStepState.position,
  //   prevStepState.position,
  //   remainingTimestepPercent
  // );

  const currentSpeed = Math.abs(nowStepState.velocity);
  addToLimitedArray(moverRefs.recentSpeeds, currentSpeed, recentSpeedsAmount);

  moverRefs.velocity = nowStepState.velocity;

  const hasEnoughSpeeds = moverRefs.recentSpeeds.length >= recentSpeedsAmount - 1;
  const averageSpeed = hasEnoughSpeeds ? getAverageSpeed(moverRefs.recentSpeeds) : Infinity;

  const isNearTarget = Math.abs(itemState[keys.value] - targetPosition) < 0.01;

  let isStillMoving = Math.abs(averageSpeed) > 0.003;
  let shouldStopMoving = !isStillMoving;
  if (moveMode === "spring") {
    let isStillMoving = Math.abs(averageSpeed) > springStopSpeed;
    shouldStopMoving = !isStillMoving && isNearTarget;
  }

  if (shouldStopMoving) {
    // console.log("should stop moving");

    setState(`${itemType}.${keys.isMoving}`, false, itemId);
  }

  setState(`${itemType}.${keys.value}`, interpolatedPosition, itemId);
  if (autoRerun) {
    onNextTick((nextFrameDuration) => {
      const newItemState = getState(itemType, itemId);
      if (newItemState?.[keys.isMoving]) {
        rerunOptions.frameDuration = nextFrameDuration;
        rerunOptions.id = itemId;
        rerunOptions.type = itemType;
        rerunOptions.mover = moverName;
        rerunOptions.autoRerun = autoRerun;

        runMover1d(rerunOptions);
      }
    });
  }
}

export function stepSlide1d(state: { position: number; velocity: number }, friction: number, dtSeconds: number) {
  // clamp for safety
  friction = Math.max(0, Math.min(0.9999, friction));

  // remaining fraction of velocity after 1 second
  const remainPerSecond = 1 - friction;

  // remaining fraction after dt seconds
  const decay = Math.pow(remainPerSecond, dtSeconds);

  const v0 = state.velocity;
  const v1 = v0 * decay;

  // exact displacement under exponential decay:
  // v(t) = v0 * e^(-k t), with k = -ln(remainPerSecond)
  const k = -Math.log(remainPerSecond);
  const dx = k > 1e-6 ? (v0 - v1) / k : v0 * dtSeconds; // fallback when k≈0

  state.position += dx;
  state.velocity = v1;
}

function run1dPhysicsStep(
  stepState: PositionAndVelocity,
  targetPosition: number,
  moveMode: MoveMode = "spring",
  physicsOptions: any
) {
  const { stiffness, damping, mass, friction } = physicsOptions;

  let newVelocity: number = stepState.velocity;

  switch (moveMode) {
    case "spring":
      {
        const positionDifference = stepState.position - targetPosition;
        const springForce = positionDifference * -stiffness;
        const dampingForce = stepState.velocity * damping;
        const force = springForce - dampingForce;
        const acceleration = force / mass;
        const accelerationWithTime = acceleration * physicsTimestep;

        newVelocity = stepState.velocity + accelerationWithTime;
      }
      break;
    case "slide":
      newVelocity = stepState.velocity * Math.pow(1 - friction, physicsTimestepInSeconds * 10);
      break;
    case "drag":
      break;
    case "push":
      break;
    default:
  }

  const amountMoved = newVelocity * physicsTimestepInSeconds;
  let newAmount = stepState.position + amountMoved;

  stepState.position = newAmount;
  stepState.velocity = newVelocity;
}

// }
