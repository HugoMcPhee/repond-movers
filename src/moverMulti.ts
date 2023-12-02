// import { interpolateValues } from "chootils/dist/numbers";
import { addToLimitedArray } from "chootils/dist/arrays";
import { forEach } from "chootils/dist/loops";
import { getAverageSpeed } from "chootils/dist/speedAngleDistance";
/*
like mover 1d, but has a dynamic amount of movers


*/
/*
New options:
allow interpolating
refNames.averageSpeed
*/
import { AllRefs, AllState, getRefs, getState, setState } from "repond";
import {
  defaultOptions,
  // maximumFrameTime,
  physicsTimestep,
  physicsTimestepInSeconds,
  recentSpeedsAmount,
} from "./consts";
import { AnyMoverStateNames, ItemType, MoveMode, OnePhysicsConfig, PhysicsConfig, RunMoverOptions } from "./types";
import {
  // makeMoverStateMaker,
  makeStateNames,
  normalizeDefinedPhysicsConfig,
} from "./utils";

// moverState functions need to be made seperately for each moverMulti, so they have unique value types (with different property names)
// export const moverState = makeMoverStateMaker(() => 0);

type OneAnimRefs = {
  velocity: number;
  recentSpeeds: number[];
};

type Untyped_MoverRefs = {
  stateNames: AnyMoverStateNames;
  physicsConfigs: Record<string, OnePhysicsConfig>;
  animRefs: Record<string, OneAnimRefs>;
  animNames: string[];
};

export function moverMultiRefs<T_Name extends string, T_AnimNames extends readonly string[]>(
  newName: T_Name,
  animNames: T_AnimNames,
  config?: PhysicsConfig
) {
  type AnimName = T_AnimNames[number];

  const _animRefs = {} as any;

  forEach(animNames, (animName) => {
    _animRefs[animName] = {
      velocity: 0,
      recentSpeeds: [] as number[],
    };
  });

  const newRefs = {
    stateNames: makeStateNames(newName),
    physicsConfigs: normalizeDefinedPhysicsConfig(config, "multi"),
    animRefs: _animRefs as Record<AnimName, OneAnimRefs>,
    animNames,
  };

  return {
    [`${newName}MoverRefs`]: newRefs,
  } as Record<`${T_Name}MoverRefs`, typeof newRefs>;
}

const rerunOptions: RunMoverOptions<any> = {
  frameDuration: 16.6667,
  name: "",
  type: "",
  onSlow: undefined,
  mover: "",
  autoRerun: true,
};

export function runMoverMulti<T_ItemType extends ItemType>({
  frameDuration = 16.6667,
  type: itemType,
  name: itemId,
  mover: moverName,
  autoRerun,
}: // onSlow,
RunMoverOptions<T_ItemType>) {
  // repeated for all movers Start
  const itemRefs = (getRefs() as any)[itemType][itemId] as any;
  const itemState = (getState() as any)[itemType][itemId] as any;

  const moverRefs = itemRefs[`${moverName}MoverRefs`] as Untyped_MoverRefs;
  const keys: AnyMoverStateNames = moverRefs.stateNames;

  const animNames = moverRefs.animNames;
  const animRefs = moverRefs.animRefs;

  // if any shouldStopMoving === false, then shouldKeepGoing = true
  let shouldKeepGoing = false;

  const nowStepStates = {} as Record<string, { position: number; velocity: number }>;
  const newMoverState = {} as Record<string, number>;

  const moveMode: MoveMode = itemState[keys.moveMode] ?? defaultOptions.moveMode;

  const physicsConfigs = itemState[keys.physicsConfigs] ?? moverRefs.physicsConfigs;

  const physicsOptions =
    physicsConfigs[itemState?.[keys?.physicsConfigName]] ?? physicsConfigs[defaultOptions.physicsConfigName];

  forEach(animNames, (animName) => {
    nowStepStates[animName] = {
      position: itemState[keys.value][animName],
      velocity: animRefs[animName].velocity,
    };

    let nowStepState = nowStepStates[animName];

    const targetPosition = itemState[keys.valueGoal][animName];
    // let prevStepState = nowStepState;
    let timeRemainingForPhysics = frameDuration;
    // repeated for all movers End

    while (timeRemainingForPhysics >= physicsTimestep) {
      // prevStepState = nowStepState;
      // nowStepState = runPhysicsStep(
      runMultiPhysicsStep(nowStepState, targetPosition, moveMode, physicsOptions);
      timeRemainingForPhysics -= physicsTimestep;
    }

    // TODO maybe set the new position based on the current position like mover 3d
    // let interpolatedPosition = nowStepState.position;

    newMoverState[animName] = nowStepState.position;

    const currentSpeed = Math.abs(nowStepState.velocity);
    addToLimitedArray(animRefs[animName].recentSpeeds, currentSpeed, recentSpeedsAmount);

    animRefs[animName].velocity = nowStepState.velocity;

    const hasEnoughSpeeds = animRefs[animName].recentSpeeds.length >= recentSpeedsAmount - 1;
    const averageSpeed = hasEnoughSpeeds ? getAverageSpeed(animRefs[animName].recentSpeeds) : Infinity;

    const isNearTarget = Math.abs(itemState[keys.value][animName] - targetPosition) < 0.01;
    let isStillMoving = Math.abs(averageSpeed) > 0.003;
    let shouldStopMoving = !isStillMoving;
    if (moveMode === "spring") {
      let isStillMoving = Math.abs(averageSpeed) > 0.01;
      shouldStopMoving = !isStillMoving && isNearTarget;
    }

    if (!shouldStopMoving) {
      // if one anim is still moving, keep running the multi mover
      shouldKeepGoing = true;
    }
  });

  // if shouldStopMoving for each anim is true

  if (!shouldKeepGoing) {
    setState({
      [itemType]: { [itemId]: { [keys.isMoving]: false } },
    });
  }

  setState(
    { [itemType]: { [itemId]: { [keys.value]: newMoverState } } },
    autoRerun
      ? (nextFrameDuration) => {
          const newItemState = (getState() as any)[itemType][itemId];
          if (newItemState?.[keys.isMoving]) {
            rerunOptions.frameDuration = nextFrameDuration;
            rerunOptions.name = itemId;
            rerunOptions.type = itemType;
            rerunOptions.mover = moverName;

            runMoverMulti(rerunOptions);
          }
        }
      : undefined
  );
}

function runMultiPhysicsStep(
  nowStepState: { position: number; velocity: number },
  targetPosition: number,
  moveMode: MoveMode = "spring",
  physicsOptions: any
) {
  const { stiffness, damping, mass, friction } = physicsOptions;

  let newVelocity: number = nowStepState.velocity;

  switch (moveMode) {
    case "spring":
      {
        const positionDifference = nowStepState.position - targetPosition;
        const springForce = positionDifference * -stiffness;
        const dampingForce = nowStepState.velocity * damping;
        const force = springForce - dampingForce;
        const acceleration = force / mass;
        const accelerationWithTime = acceleration * physicsTimestep;

        newVelocity = nowStepState.velocity + accelerationWithTime;
      }
      break;
    case "slide":
      newVelocity = nowStepState.velocity * Math.pow(1 - friction, physicsTimestepInSeconds * 10);
      break;
    case "drag":
      break;
    case "push":
      break;
    default:
  }

  const amountMoved = newVelocity * physicsTimestepInSeconds;
  let newAmount = nowStepState.position + amountMoved;

  nowStepState.position = newAmount;
  nowStepState.velocity = newVelocity;

  // return { position: newAmount, velocity: newVelocity };
}

// return {
//   moverMultiRefs,
//   runMoverMulti,
// };
// }
