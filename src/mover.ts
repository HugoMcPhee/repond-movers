import { addToLimitedArray } from "shutils/dist/arrays";
import { getAverageSpeed } from "shutils/dist/speedAngleDistance";
import {
  defaultOptions,
  // maximumFrameTime,
  physicsTimestep,
  physicsTimestepInSeconds,
  recentSpeedsAmount,
} from "./consts";
import { AnyMoverStateNames, MoveMode, PhysicsConfig } from "./types";
import {
  makeMoverStateMaker,
  makeStateNames,
  normalizeDefinedPhysicsConfig,
} from "./utils";

/*
New options:
allow interpolating
refNames.averageSpeed
*/

export type PositionAndVelocity = {
  position: number;
  velocity: number;
};

export const moverState = makeMoverStateMaker(() => 0);

export function moverRefs<T_Name extends string>(
  newName: T_Name,
  config?: PhysicsConfig
) {
  const newRefs = {
    velocity: 0,
    recentSpeeds: [] as number[],
    stateNames: makeStateNames(newName),
    physicsConfigs: normalizeDefinedPhysicsConfig(config),
  };

  return {
    [`${newName}MoverRefs`]: newRefs,
  } as Record<`${T_Name}MoverRefs`, typeof newRefs>;
}

export function makeMover1dUtils<
  T_GetState extends () => any,
  T_GetRefs extends () => any,
  T_SetState extends (
    newState: Record<any, any> | ((state: any) => any),
    callback?: (nextFrameDuration: number) => any
  ) => any
>(conceptoFuncs: {
  getState: T_GetState;
  getRefs: T_GetRefs;
  setState: T_SetState;
}) {
  const { getRefs, getState, setState } = conceptoFuncs;

  // ---------------------------
  // types
  type GetState = typeof getState;
  type GetRefs = typeof getRefs;
  type ItemType = keyof ReturnType<GetState> & keyof ReturnType<GetRefs>;
  type ItemState<T_ItemType extends ItemType> =
    ReturnType<GetState>[T_ItemType][keyof ReturnType<GetState>[T_ItemType]];

  type StateNameProperty<T_ItemType extends ItemType> =
    keyof ItemState<T_ItemType>;
  type RunMoverOptions<T_ItemType extends ItemType> = {
    onSlow?: () => any;
    name: string;
    type: T_ItemType;
    frameDuration?: number;
    mover: StateNameProperty<T_ItemType>;
  };
  // ---------------------------

  function runMover<T_ItemType extends ItemType>({
    frameDuration = 16.6667,
    type: itemType,
    name: itemId,
    mover: moverName,
  }: // onSlow,
  RunMoverOptions<T_ItemType>) {
    // repeated for all movers Start
    const itemRefs = (getRefs() as any)[itemType][itemId] as any;
    const itemState = (getState() as any)[itemType][itemId] as any;

    const moverRefs = itemRefs[`${moverName}MoverRefs`];
    const keys: AnyMoverStateNames = moverRefs.stateNames;

    const currentStepState = {
      position: itemState[keys.value],
      velocity: moverRefs.velocity,
    };
    const prevStepState = {
      position: currentStepState.position,
      velocity: currentStepState.velocity,
    };

    const moveMode: MoveMode =
      itemState[keys.moveMode] ?? defaultOptions.moveMode;

    const physicsConfigs =
      itemState[keys.physicsConfigs] ?? moverRefs.physicsConfigs;

    const physicsOptions =
      physicsConfigs[itemState?.[keys?.physicsConfigName]] ??
      physicsConfigs[defaultOptions.physicsConfigName];

    const targetPosition = itemState[keys.valueGoal];
    let timeRemainingForPhysics = frameDuration;
    // repeated for all movers End

    prevStepState.position = currentStepState.position;
    prevStepState.velocity = currentStepState.velocity;

    while (timeRemainingForPhysics >= physicsTimestep) {
      // prevStepState = currentStepState;
      // currentStepState = runPhysicsStep(
      runPhysicsStep(
        currentStepState,
        targetPosition,
        moveMode,
        physicsOptions
      );
      timeRemainingForPhysics -= physicsTimestep;
    }

    // TODO maybe set the new position based on the current position like mover 3d
    let interpolatedPosition = currentStepState.position;

    // caused it to stop working on iPad ?
    // const remainingTimestepPercent = timeRemainingForPhysics / physicsTimestep;
    // interpolatedPosition = interpolateValues(
    //   currentStepState.position,
    //   prevStepState.position,
    //   remainingTimestepPercent
    // );

    const currentSpeed = Math.abs(currentStepState.velocity);
    addToLimitedArray(moverRefs.recentSpeeds, currentSpeed, recentSpeedsAmount);

    moverRefs.velocity = currentStepState.velocity;

    const hasEnoughSpeeds =
      moverRefs.recentSpeeds.length >= recentSpeedsAmount - 1;
    const averageSpeed = hasEnoughSpeeds
      ? getAverageSpeed(moverRefs.recentSpeeds)
      : Infinity;

    const isNearTarget =
      Math.abs(itemState[keys.value] - targetPosition) < 0.01;
    let isStillMoving = Math.abs(averageSpeed) > 0.003;
    let shouldStopMoving = !isStillMoving;
    if (moveMode === "spring") {
      let isStillMoving = Math.abs(averageSpeed) > 0.01;
      shouldStopMoving = !isStillMoving && isNearTarget;
    }

    if (shouldStopMoving) {
      setState({
        [itemType]: { [itemId]: { [keys.isMoving]: false } },
      });
    }

    setState(
      { [itemType]: { [itemId]: { [keys.value]: interpolatedPosition } } },
      (nextFrameDuration) => {
        const newItemState = (getState() as any)[itemType][itemId];
        if (newItemState?.[keys.isMoving]) {
          runMover({
            frameDuration: nextFrameDuration,
            name: itemId,
            type: itemType,
            mover: moverName,
          });
        }
      }
    );
  }

  function runPhysicsStep(
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
        newVelocity =
          stepState.velocity *
          Math.pow(1 - friction, physicsTimestepInSeconds * 10);
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

  return {
    moverState,
    moverRefs,
    runMover,
  };
}
