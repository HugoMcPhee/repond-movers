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
import { getRefs, getState, setState } from "repond";
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
const rerunOptions = {
    frameDuration: 16.6667,
    id: "",
    type: "",
    onSlow: undefined,
    mover: "",
    autoRerun: true,
};
export function runMoverMulti({ frameDuration = 16.6667, type: itemType, id: itemId, mover: moverName, autoRerun, }) {
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
    const moveMode = itemState[keys.moveMode] ?? defaultOptions.moveMode;
    const physicsConfigs = itemState[keys.physicsConfigs] ?? moverRefs.physicsConfigs;
    const physicsOptions = physicsConfigs[itemState?.[keys?.physicsConfigName]] ?? physicsConfigs[defaultOptions.physicsConfigName];
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
    setState({ [itemType]: { [itemId]: { [keys.value]: newMoverState } } }, autoRerun
        ? (nextFrameDuration) => {
            const newItemState = getState()[itemType][itemId];
            if (newItemState?.[keys.isMoving]) {
                rerunOptions.frameDuration = nextFrameDuration;
                rerunOptions.id = itemId;
                rerunOptions.type = itemType;
                rerunOptions.mover = moverName;
                runMoverMulti(rerunOptions);
            }
        }
        : undefined);
}
function runMultiPhysicsStep(nowStepState, targetPosition, moveMode = "spring", physicsOptions) {
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
// return {
//   moverMultiRefs,
//   runMoverMulti,
// };
// }
