import { getPrevState, getRefs, getState, makeEffect, setState, startNewEffect, stopEffect, } from "repond";
import { meta } from "./meta";
import { runMover1d } from "./mover1d";
import { runMover2d } from "./mover2d";
import { runMover3d } from "./mover3d";
import { runMoverMulti } from "./moverMulti";
export { moverRefs, moverState } from "./mover1d";
export { mover2dRefs, mover2dState } from "./mover2d";
export { mover3dRefs, mover3dState } from "./mover3d";
export { moverMultiRefs } from "./moverMulti";
export { makeMoverStateMaker } from "./utils";
// Implementation
export function initMovers(timeConfig) {
    if (Array.isArray(timeConfig)) {
        // Backward compatibility: treat array as "default" time key
        meta.timePaths = { default: timeConfig };
        meta.timeElapsedStatePath = timeConfig; // Keep deprecated field
    }
    else if (timeConfig) {
        // New behavior: store multiple time keys
        meta.timePaths = timeConfig;
        // Set deprecated field to "default" for backward compat
        meta.timeElapsedStatePath = timeConfig.default;
    }
}
const runMoverFunctionsByType = {
    "1d": runMover1d,
    "2d": runMover2d,
    "3d": runMover3d,
    multi: runMoverMulti,
};
export function addMoverEffects(store, moverName, moverType = "1d", options) {
    const timeKey = options?.timeKey ?? "default";
    const moverKey = `${store}.${moverName}`;
    // Store the time key assignment for this mover
    meta.moverTimeKeys[moverKey] = timeKey;
    // Validate time key exists (only warn if explicitly set by user)
    if (options?.timeKey && !meta.timePaths[timeKey]) {
        console.warn(`[repond-movers] Time key "${timeKey}" not found in timePaths. ` +
            `Available keys: ${Object.keys(meta.timePaths).join(", ")}. ` +
            `Mover "${moverKey}" may not animate.`);
    }
    const isMovingKey = `${moverName}IsMoving`;
    const moveModePropKey = `${moverName}MoveMode`;
    const moverRefsKey = `${moverName}MoverRefs`;
    const runMoverFunction = runMoverFunctionsByType[moverType];
    // make something the same as runMover1d, but instead of doing a setState callback loop, make a temporary effect like the pattern below:
    // add an effect, that listens to the elapsed time state changing,
    // and each time, if isMoving is true, run the mover again
    // if it's false, remove the effect
    function startMoverMoveEffect({ itemId }) {
        const moverKey = `${store}.${moverName}`;
        const timeKey = meta.moverTimeKeys[moverKey] ?? "default";
        const timePath = meta.timePaths[timeKey];
        if (!timePath) {
            console.error(`[repond-movers] No time path found for time key "${timeKey}". ` +
                `Mover "${moverKey}" cannot animate.`);
            return;
        }
        const [timeItemType, timeItemId, timeItemProp] = timePath;
        const effectId = "moverValueEffect" + store + moverName + moverType + Math.random();
        startNewEffect({
            id: effectId,
            run: () => {
                const newTimeElapsed = getState(timeItemType, timeItemId)[timeItemProp];
                const prevTimeElapsed = getPrevState(timeItemType, timeItemId)[timeItemProp];
                if (!getState(store, itemId)?.[isMovingKey]) {
                    stopEffect(effectId);
                }
                else {
                    const timeDuration = newTimeElapsed - prevTimeElapsed;
                    runMoverFunction({
                        mover: moverName,
                        id: itemId,
                        type: store,
                        frameDuration: timeDuration,
                        autoRerun: false,
                    });
                }
            },
            // check: { type: [timeStoreKey], id: [timeNameKey], prop: [timePropKey] },
            changes: [`${timeItemType}.${timeItemProp}`],
            itemIds: [timeItemId],
            step: "moverUpdates", // NOTE may need to change this to run after elapsed time changes, but before other game logic
            atStepEnd: true,
        });
        return effectId;
    }
    const valueGoalChangedEffect = makeEffect((itemId) => {
        const itemState = getState(store, itemId);
        const itemRefs = getRefs(store, itemId);
        setState(`${store}.${isMovingKey}`, true, itemId);
        if (moverType === "3d") {
            const moveMode = itemState[moveModePropKey];
            // TEMPORARY : ideally this is automatic for movers? (when isMoving becoems true?)
            // it was there for doll position, but put here so it works the same for now
            if (moveMode === "spring")
                itemRefs[moverRefsKey].recentSpeeds = [];
        }
    }, { isPerItem: true, changes: [`${store}.${moverName}Goal`], step: "moversGoal", atStepEnd: true });
    const startedMovingEffect = makeEffect((itemId) => {
        const newValue = getState(store, itemId)?.[isMovingKey];
        if (newValue !== true)
            return;
        const moverKey = `${store}.${moverName}`;
        const timeKey = meta.moverTimeKeys[moverKey] ?? "default";
        const timePath = meta.timePaths[timeKey];
        if (timePath) {
            // Use time-based effect if time path exists
            startMoverMoveEffect({ itemId: itemId });
        }
        else {
            // Fallback to auto-rerun mode (no time control)
            runMoverFunction({ mover: moverName, id: itemId, type: store, autoRerun: true });
        }
    }, {
        changes: [`${store}.${isMovingKey}`],
        step: "moversStart",
        atStepEnd: true,
        isPerItem: true,
    });
    return {
        [`${moverName}GoalChanged`]: valueGoalChangedEffect,
        [`when${moverName}StartedMoving`]: startedMovingEffect,
    };
}
export function runMover(moverType, { frameDuration, store, id: itemId, mover: moverName, }) {
    const runMoverFunction = runMoverFunctionsByType[moverType];
    return runMoverFunction({
        frameDuration: frameDuration ?? 16.6667,
        type: store,
        id: itemId,
        mover: moverName,
    });
}
// }
