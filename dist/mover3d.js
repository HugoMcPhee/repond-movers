import { addToLimitedArray } from "chootils/dist/arrays";
import { addPoints as addPointsImmutable, copyPoint, defaultPosition, interpolatePoints, pointIsZero, pointBasicallyZero, subtractPointsSafer, updatePoint, } from "chootils/dist/points3d";
import { addPoints, dividePoint, multiplyPoint, subtractPoints, } from "chootils/dist/points3dInPlace";
import { getAverageSpeed } from "chootils/dist/speedAngleDistance";
import { getSpeedAndAngleFromVector, getVectorFromSpeedAndAngle, getVectorSpeed, } from "chootils/dist/speedAngleDistance3d";
import { defaultOptions, defaultPhysics, physicsTimestep, physicsTimestepInSeconds, recentSpeedsAmount, } from "./consts";
import { makeMoverStateMaker, makeStateNames, normalizeDefinedPhysicsConfig, } from "./utils";
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
export function makeMover3dUtils(conceptoFuncs) {
    const { getRefs, getState, setState } = conceptoFuncs;
    // ---------------------------
    const rerunOptions = {
        frameDuration: 16.6667,
        name: "",
        type: "",
        onSlow: undefined,
        mover: "",
    };
    function runMover3d({ frameDuration = 16.6667, name: itemId, type: itemType, onSlow, mover: moverName, }) {
        var _a, _b, _c, _d;
        // repeated for all movers Start
        const itemRefs = getRefs()[itemType][itemId];
        const itemState = getState()[itemType][itemId];
        const moverRefs = itemRefs[`${moverName}MoverRefs`];
        const keys = moverRefs.stateNames;
        const currentStepState = {
            position: copyPoint(itemState[keys.value]),
            velocity: copyPoint(moverRefs.velocity),
        };
        const prevStepState = {
            position: copyPoint(currentStepState.position),
            velocity: copyPoint(currentStepState.velocity),
        };
        const moveMode = (_a = itemState[keys.moveMode]) !== null && _a !== void 0 ? _a : defaultOptions.moveMode;
        const physicsConfigs = (_b = itemState[keys.physicsConfigs]) !== null && _b !== void 0 ? _b : moverRefs.physicsConfigs;
        const physicsOptions = (_c = physicsConfigs[itemState === null || itemState === void 0 ? void 0 : itemState[keys === null || keys === void 0 ? void 0 : keys.physicsConfigName]]) !== null && _c !== void 0 ? _c : physicsConfigs[defaultOptions.physicsConfigName];
        const targetPosition = itemState[keys.valueGoal];
        let timeRemainingForPhysics = frameDuration;
        // repeated for all movers End
        const originalPositon = copyPoint(itemState[keys.value]);
        const springStopSpeed = (_d = physicsOptions.stopSpeed) !== null && _d !== void 0 ? _d : DEFAULT_SPRING_STOP_SPEED;
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
        // FIXME a problem happens when moving from "push" to "spring",
        // there are already recentSpeeds that might have a lot of 0's
        // so when the spring starts the average speed is very low, so it stops springing
        moverRefs.averageSpeed = averageSpeed;
        const isAutoMovementType = itemState[keys.moveMode] === "spring" ||
            itemState[keys.moveMode] === "slide";
        // NOTE was it needed to check the latest state here?
        // const isAutoMovementType = moveMode === "spring" || moveMode === "slide";
        let shouldKeepMoving = true;
        if (isAutoMovementType) {
            const targetPointDifference = subtractPointsSafer(newPosition, targetPosition);
            const isGoingFasterThanStopSpeed = averageSpeed > springStopSpeed;
            const quickDistance = Math.abs(targetPointDifference.x) +
                Math.abs(targetPointDifference.y) +
                Math.abs(targetPointDifference.z);
            const isQuiteClose = quickDistance < 0.15;
            if (isGoingFasterThanStopSpeed) {
                shouldKeepMoving = itemState[keys.isMoving];
            }
            else {
                shouldKeepMoving = itemState[keys.isMoving] && !isQuiteClose;
            }
        }
        if (!shouldKeepMoving)
            setState({ [itemType]: { [itemId]: { [keys.isMoving]: false } } });
        setState((state) => {
            const currentPosition = state[itemType][itemId][keys.value];
            const positionDifference = subtractPointsSafer(newPosition, originalPositon);
            const actualNewPosition = addPointsImmutable(currentPosition, positionDifference);
            // console.log("diff", Math.abs(positionDifference.x));
            // if (moveMode === "push" || moveMode === "slide") {
            // console.log("moveMode", moveMode);
            if (pointIsZero(positionDifference)) {
                return { [itemType]: { [itemId]: { [keys.isMoving]: false } } };
            }
            if (pointBasicallyZero(positionDifference)) {
                return { [itemType]: { [itemId]: { [keys.isMoving]: false } } };
            }
            // }
            // console.log(positionDifference, "positionDifference");
            return {
                [itemType]: { [itemId]: { [keys.value]: actualNewPosition } },
            };
        }, (nextFrameDuration) => {
            if (isAutoMovementType) {
                if (moverRefs.canRunOnSlow && averageSpeed < 150) {
                    moverRefs.canRunOnSlow = false;
                    onSlow === null || onSlow === void 0 ? void 0 : onSlow();
                }
            }
            if (itemState[keys.isMoving]) {
                rerunOptions.frameDuration = nextFrameDuration;
                rerunOptions.name = itemId;
                rerunOptions.type = itemType;
                rerunOptions.onSlow = onSlow;
                rerunOptions.mover = moverName;
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
        mover3dState,
        mover3dRefs,
        runMover3d,
    };
}
