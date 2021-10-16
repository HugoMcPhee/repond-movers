import { addToLimitedArray } from "shutils/dist/arrays";
import { addPoints as addPointsImmutable, copyPoint, defaultPosition, interpolatePoints, subtractPointsSafer, updatePoint, } from "shutils/dist/points2d";
import { addPoints, dividePoint, multiplyPoint, subtractPoints, } from "shutils/dist/points2dInPlace";
import { getAverageSpeed } from "shutils/dist/speedAngleDistance";
import { getSpeedAndAngleFromVector, getVectorFromSpeedAndAngle, getVectorSpeed, } from "shutils/dist/speedAngleDistance2d";
import { defaultOptions, physicsTimestep, physicsTimestepInSeconds, recentSpeedsAmount, } from "./consts";
import { makeMoverStateMaker, makeStateNames, normalizeDefinedPhysicsConfig, } from "./utils";
/*
New options:
allow interpolating
*/
const SPRING_STOP_SPEED = 1;
export const mover2dState = makeMoverStateMaker(defaultPosition);
export function mover2dRefs(newName, config) {
    const newRefs = {
        velocity: defaultPosition(),
        recentSpeeds: [],
        averageSpeed: 0,
        canRunOnSlow: true,
        stateNames: makeStateNames(newName),
        physicsConfigs: normalizeDefinedPhysicsConfig(config),
    };
    return {
        [`${newName}MoverRefs`]: newRefs,
    };
}
export function makeMover2dUtils(conceptoFuncs) {
    const { getRefs, getState, setState } = conceptoFuncs;
    // ---------------------------
    function runMover2d({ frameDuration = 16.6667, name: itemId, type: itemType, mover: moverName, onSlow, }) {
        var _a, _b, _c;
        // repeated for all movers Start
        const itemRefs = getRefs()[itemType][itemId];
        const itemState = getState()[itemType][itemId];
        const moverRefs = itemRefs[`${moverName}MoverRefs`];
        const keys = moverRefs.stateNames;
        const currentStepState = {
            position: copyPoint(itemState[keys.value]),
            // velocity: copyPoint(moverRefs.velocity),
            velocity: moverRefs.velocity,
        };
        const prevStepState = {
            position: copyPoint(currentStepState.position),
            velocity: copyPoint(currentStepState.velocity),
        };
        const moveMode = (_a = itemState[keys.moveMode]) !== null && _a !== void 0 ? _a : defaultOptions.moveMode;
        const physicsConfigs = (_b = itemState[keys.physicsConfigs]) !== null && _b !== void 0 ? _b : moverRefs.physicsConfigs;
        const physicsOptions = (_c = physicsConfigs[itemState === null || itemState === void 0 ? void 0 : itemState[keys === null || keys === void 0 ? void 0 : keys.physicsConfigName]]) !== null && _c !== void 0 ? _c : physicsConfigs[defaultOptions.physicsConfigName];
        const targetPosition = itemState[keys.valueGoal];
        // let prevStepState = currentStepState;
        let timeRemainingForPhysics = frameDuration;
        // repeated for all movers End
        const originalPositon = copyPoint(itemState[keys.value]);
        while (timeRemainingForPhysics >= physicsTimestep) {
            // prevStepState = currentStepState;
            updatePoint(prevStepState.position, currentStepState.position);
            updatePoint(prevStepState.velocity, currentStepState.velocity);
            // currentStepState = runPhysicsStep({
            runPhysicsStep(currentStepState, moveMode, physicsOptions, targetPosition);
            timeRemainingForPhysics -= physicsTimestep;
        }
        // can just use the current position if interpolating isn't needed
        const newPosition = interpolatePoints(currentStepState.position, prevStepState.position, timeRemainingForPhysics / physicsTimestep // remainingTimestepPercent
        );
        moverRefs.velocity = currentStepState.velocity;
        // Check shouldKeepMoving
        // note could move this to inside the setState to get latest state and use actualNewPosition
        const currentSpeed = getVectorSpeed(moverRefs.velocity);
        addToLimitedArray(moverRefs.recentSpeeds, currentSpeed, recentSpeedsAmount);
        const hasEnoughSpeeds = moverRefs.recentSpeeds.length >= recentSpeedsAmount - 1;
        const averageSpeed = hasEnoughSpeeds
            ? getAverageSpeed(moverRefs.recentSpeeds)
            : Infinity;
        moverRefs.averageSpeed = averageSpeed;
        const isAutoMovementType = itemState[keys.moveMode] === "spring" ||
            itemState[keys.moveMode] === "slide";
        let shouldKeepMoving = true;
        if (isAutoMovementType)
            shouldKeepMoving =
                itemState[keys.isMoving] && averageSpeed > SPRING_STOP_SPEED;
        if (!shouldKeepMoving)
            setState({ [itemType]: { [itemId]: { [keys.isMoving]: false } } });
        setState((state) => {
            const currentPosition = state[itemType][itemId][keys.value];
            const positionDifference = subtractPointsSafer(newPosition, originalPositon);
            const actualNewPosition = addPointsImmutable(currentPosition, positionDifference);
            return {
                [itemType]: { [itemId]: { [keys.value]: actualNewPosition } },
            };
        }, (nextFrameDuration) => {
            const newItemState = getState()[itemType][itemId];
            if (isAutoMovementType) {
                if (moverRefs.canRunOnSlow && averageSpeed < 150) {
                    moverRefs.canRunOnSlow = false;
                    onSlow === null || onSlow === void 0 ? void 0 : onSlow();
                }
            }
            if (newItemState[keys.isMoving]) {
                // NOTE
                // the next frame mover always runs at the very start of the next frame
                // could add a fow option to movers to react to a frame tick on specific frame
                runMover2d({
                    frameDuration: nextFrameDuration,
                    name: itemId,
                    type: itemType,
                    onSlow,
                    mover: moverName,
                });
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
    function runPhysicsStep(stepState, moveMode, physicsOptions, targetPosition) {
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
    return {
        mover2dState,
        mover2dRefs,
        runMover2d,
    };
}
