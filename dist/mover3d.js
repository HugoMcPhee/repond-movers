import { addToLimitedArray } from "chootils/dist/arrays";
import { addPoints as addPointsImmutable, copyPoint, defaultPosition, interpolatePoints, pointBasicallyZero, pointIsZero, subtractPointsSafer, updatePoint, } from "chootils/dist/points3d";
import { addPoints, dividePoint, multiplyPoint, subtractPoints } from "chootils/dist/points3dInPlace";
import { getAverageSpeed } from "chootils/dist/speedAngleDistance";
import { getSpeedAndAngleFromVector, getVectorFromSpeedAndAngle, getVectorSpeed, } from "chootils/dist/speedAngleDistance3d";
import { getRefs, getState, onNextTick, setState, whenSettingStates } from "repond";
import { defaultOptions, defaultPhysics, physicsTimestep, physicsTimestepInSeconds, recentSpeedsAmount, } from "./consts";
import { makeMoverStateMaker, makeStateNames, normalizeDefinedPhysicsConfig } from "./utils";
const DEFAULT_SPRING_STOP_SPEED = defaultPhysics("3d").stopSpeed;
export const mover3dState = makeMoverStateMaker(defaultPosition);
export function mover3dRefs(newName, config) {
    const newRefs = {
        velocity: defaultPosition(),
        recentSpeeds: [],
        averageSpeed: 0,
        canRunOnSlow: true,
        stateNames: makeStateNames(newName),
        physicsConfigs: normalizeDefinedPhysicsConfig(config, "3d"),
    };
    return {
        [`${newName}MoverRefs`]: newRefs,
    };
}
// ---------------------------
const rerunOptions = {
    frameDuration: 16.6667,
    id: "",
    type: "",
    onSlow: undefined,
    mover: "",
    autoRerun: true,
};
export function runMover3d({ frameDuration = 16.6667, id: itemId, type: itemType, onSlow, mover: moverName, autoRerun, }) {
    // repeated for all movers Start
    const itemRefs = getRefs(itemType, itemId);
    const itemState = getState(itemType, itemId);
    const moverRefs = itemRefs[`${moverName}MoverRefs`];
    const keys = moverRefs.stateNames;
    const nowStepState = {
        position: copyPoint(itemState[keys.value]),
        velocity: copyPoint(moverRefs.velocity),
    };
    const prevStepState = {
        position: copyPoint(nowStepState.position),
        velocity: copyPoint(nowStepState.velocity),
    };
    const moveMode = itemState[keys.moveMode] ?? defaultOptions.moveMode;
    const physicsConfigs = itemState[keys.physicsConfigs] ?? moverRefs.physicsConfigs;
    const physicsOptions = physicsConfigs[itemState?.[keys?.physicsConfigName]] ?? physicsConfigs[defaultOptions.physicsConfigName];
    const targetPosition = itemState[keys.valueGoal];
    let timeRemainingForPhysics = frameDuration;
    // repeated for all movers End
    const originalPositon = copyPoint(itemState[keys.value]);
    const springStopSpeed = physicsOptions.stopSpeed ?? DEFAULT_SPRING_STOP_SPEED;
    while (timeRemainingForPhysics >= physicsTimestep) {
        // prevStepState = currentStepState;
        updatePoint(prevStepState.position, nowStepState.position);
        updatePoint(prevStepState.velocity, nowStepState.velocity);
        // currentStepState = runPhysicsStep({
        run3dPhysicsStep(nowStepState, moveMode, physicsOptions, targetPosition);
        timeRemainingForPhysics -= physicsTimestep;
    }
    // can just use the current position if interpolating isn't needed
    const newPosition = interpolatePoints(nowStepState.position, prevStepState.position, timeRemainingForPhysics / physicsTimestep // remainingTimestepPercent
    );
    moverRefs.velocity = nowStepState.velocity;
    // Check shouldKeepMoving
    // note could move this to inside the setState to get latest state and use actualNewPosition
    const currentSpeed = getVectorSpeed(moverRefs.velocity);
    addToLimitedArray(moverRefs.recentSpeeds, currentSpeed, recentSpeedsAmount);
    const hasEnoughSpeeds = moverRefs.recentSpeeds.length >= recentSpeedsAmount - 1;
    const averageSpeed = hasEnoughSpeeds ? getAverageSpeed(moverRefs.recentSpeeds) : Infinity;
    // FIXME a problem happens when moving from "push" to "spring",
    // there are already recentSpeeds that might have a lot of 0's
    // so when the spring starts the average speed is very low, so it stops springing
    moverRefs.averageSpeed = averageSpeed;
    const isAutoMovementType = itemState[keys.moveMode] === "spring" || itemState[keys.moveMode] === "slide";
    // NOTE was it needed to check the latest state here?
    // const isAutoMovementType = moveMode === "spring" || moveMode === "slide";
    let shouldKeepMoving = true;
    if (isAutoMovementType) {
        const targetPointDifference = subtractPointsSafer(newPosition, targetPosition);
        const isGoingFasterThanStopSpeed = averageSpeed > springStopSpeed;
        const quickDistance = Math.abs(targetPointDifference.x) + Math.abs(targetPointDifference.y) + Math.abs(targetPointDifference.z);
        const isQuiteClose = quickDistance < 0.15;
        if (isGoingFasterThanStopSpeed) {
            shouldKeepMoving = itemState[keys.isMoving];
        }
        else {
            shouldKeepMoving = itemState[keys.isMoving] && !isQuiteClose;
        }
    }
    if (!shouldKeepMoving)
        setState(`${itemType}.${keys.isMoving}`, false, itemId);
    whenSettingStates(() => {
        const currentPosition = getState(itemType, itemId)[keys.value];
        const positionDifference = subtractPointsSafer(newPosition, originalPositon);
        const actualNewPosition = addPointsImmutable(currentPosition, positionDifference);
        if (pointIsZero(positionDifference) || pointBasicallyZero(positionDifference)) {
            setState(`${itemType}.${keys.isMoving}`, false, itemId);
        }
        setState(`${itemType}.${keys.value}`, actualNewPosition, itemId);
    });
    onNextTick((nextFrameDuration) => {
        if (isAutoMovementType) {
            if (moverRefs.canRunOnSlow && averageSpeed < 150) {
                moverRefs.canRunOnSlow = false;
                onSlow?.();
            }
        }
        if (!autoRerun)
            return;
        if (itemState[keys.isMoving]) {
            rerunOptions.frameDuration = nextFrameDuration;
            rerunOptions.id = itemId;
            rerunOptions.type = itemType;
            rerunOptions.onSlow = onSlow;
            rerunOptions.mover = moverName;
            rerunOptions.autoRerun = autoRerun;
            runMover3d(rerunOptions);
        }
    });
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
function run3dPhysicsStep(stepState, moveMode, physicsOptions, targetPosition) {
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
// return {
//   mover3dState,
//   mover3dRefs,
//   runMover3d,
// };
// }
