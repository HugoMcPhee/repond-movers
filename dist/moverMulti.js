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
import { defaultOptions, 
// maximumFrameTime,
physicsTimestep, physicsTimestepInSeconds, recentSpeedsAmount, } from "./consts";
import { 
// makeMoverStateMaker,
makeStateNames, normalizeDefinedPhysicsConfig, } from "./utils";
export function moverMultiRefs(newName, animNames, config) {
    const _animRefs = {};
    forEach(animNames, (animName) => {
        _animRefs[animName] = {
            velocity: 0,
            recentSpeeds: [],
        };
    });
    const newRefs = {
        stateNames: makeStateNames(newName),
        physicsConfigs: normalizeDefinedPhysicsConfig(config, "multi"),
        animRefs: _animRefs,
        animNames,
    };
    return {
        [`${newName}MoverRefs`]: newRefs,
    };
}
export function makeMoverMultiUtils(conceptoFuncs) {
    const { getRefs, getState, setState } = conceptoFuncs;
    // ---------------------------
    const rerunOptions = {
        frameDuration: 16.6667,
        name: "",
        type: "",
        onSlow: undefined,
        mover: "",
        autoRerun: true,
    };
    function runMoverMulti({ frameDuration = 16.6667, type: itemType, name: itemId, mover: moverName, autoRerun, }) {
        var _a, _b, _c;
        // repeated for all movers Start
        const itemRefs = getRefs()[itemType][itemId];
        const itemState = getState()[itemType][itemId];
        const moverRefs = itemRefs[`${moverName}MoverRefs`];
        const keys = moverRefs.stateNames;
        const animNames = moverRefs.animNames;
        const animRefs = moverRefs.animRefs;
        // if any shouldStopMoving === false, then shouldKeepGoing = true
        let shouldKeepGoing = false;
        const nowStepStates = {};
        const newMoverState = {};
        const moveMode = (_a = itemState[keys.moveMode]) !== null && _a !== void 0 ? _a : defaultOptions.moveMode;
        const physicsConfigs = (_b = itemState[keys.physicsConfigs]) !== null && _b !== void 0 ? _b : moverRefs.physicsConfigs;
        const physicsOptions = (_c = physicsConfigs[itemState === null || itemState === void 0 ? void 0 : itemState[keys === null || keys === void 0 ? void 0 : keys.physicsConfigName]]) !== null && _c !== void 0 ? _c : physicsConfigs[defaultOptions.physicsConfigName];
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
                runPhysicsStep(nowStepState, targetPosition, moveMode, physicsOptions);
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
        setState({ [itemType]: { [itemId]: { [keys.value]: newMoverState } } }, autoRerun
            ? (nextFrameDuration) => {
                const newItemState = getState()[itemType][itemId];
                if (newItemState === null || newItemState === void 0 ? void 0 : newItemState[keys.isMoving]) {
                    rerunOptions.frameDuration = nextFrameDuration;
                    rerunOptions.name = itemId;
                    rerunOptions.type = itemType;
                    rerunOptions.mover = moverName;
                    runMoverMulti(rerunOptions);
                }
            }
            : undefined);
    }
    function runPhysicsStep(nowStepState, targetPosition, moveMode = "spring", physicsOptions) {
        const { stiffness, damping, mass, friction } = physicsOptions;
        let newVelocity = nowStepState.velocity;
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
    return {
        moverMultiRefs,
        runMoverMulti,
    };
}
