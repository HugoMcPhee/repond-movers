import { getPrevState, getState, setState, startNewEffect, stopNewEffect } from "repond";
import { meta } from "./meta";
import { runMover1d } from "./mover1d";
import { runMover2d } from "./mover2d";
import { runMover3d } from "./mover3d";
import { runMoverMulti } from "./moverMulti";
import { makeItemEffect } from "repond";
export { moverRefs, moverState } from "./mover1d";
export { mover2dRefs, mover2dState } from "./mover2d";
export { mover3dRefs, mover3dState } from "./mover3d";
export { moverMultiRefs } from "./moverMulti";
export { makeMoverStateMaker } from "./utils";
export function initMovers(timeElapsedStatePath) {
    meta.timeElapsedStatePath = timeElapsedStatePath;
}
const runMoverFunctionsByType = {
    "1d": runMover1d,
    "2d": runMover2d,
    "3d": runMover3d,
    multi: runMoverMulti,
};
export function addMoverEffects(store, moverName, moverType = "1d") {
    const isMovingKey = `${moverName}IsMoving`;
    const moveModePropKey = `${moverName}MoveMode`;
    const moverRefsKey = `${moverName}MoverRefs`;
    const runMoverFunction = runMoverFunctionsByType[moverType];
    // make something the same as runMover1d, but instead of doing a setState callback loop, make a temporary effect like the pattern below:
    // add an effect, that listens to the elapsed time state changing,
    // and each time, if isMoving is true, run the mover again
    // if it's false, remove the effect
    function startMoverMoveEffect({ itemId }) {
        if (!meta.timeElapsedStatePath)
            return;
        const timeStoreKey = meta.timeElapsedStatePath[0];
        const timeNameKey = meta.timeElapsedStatePath[1];
        const timePropKey = meta.timeElapsedStatePath[2];
        const effectId = "moverValueEffect" + store + moverName + moverType + Math.random();
        startNewEffect({
            id: effectId,
            run: () => {
                const newTimeElapsed = getState()[timeStoreKey][timeNameKey][timePropKey];
                const prevTimeElapsed = getPrevState()[timeStoreKey][timeNameKey][timePropKey];
                if (!getState()[store]?.[itemId]?.[isMovingKey]) {
                    stopNewEffect(effectId);
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
            check: { type: [timeStoreKey], id: [timeNameKey], prop: [timePropKey] },
            step: "moverUpdates",
            atStepEnd: true,
        });
        return effectId;
    }
    const valueGoalChangedEffect = makeItemEffect({
        run({ itemId, itemState, itemRefs, }) {
            setState({ [store]: { [itemId]: { [isMovingKey]: true } } });
            if (moverType === "3d") {
                const moveMode = itemState[moveModePropKey];
                // TEMPORARY : ideally this is automatic for movers? (when isMoving becoems true?)
                // it was there for doll position, but put here so it works the same for now
                if (moveMode === "spring")
                    itemRefs[moverRefsKey].recentSpeeds = [];
            }
        },
        check: { type: store, prop: (moverName + "Goal") },
        step: "moversGoal",
        atStepEnd: true,
    });
    const startedMovingEffect = makeItemEffect({
        run({ itemId }) {
            // runMoverFunction({ id: itemName, type: store, mover: moverName });
            if (meta.timeElapsedStatePath) {
                startMoverMoveEffect({ itemId: itemId });
            }
            else {
                runMoverFunction({ mover: moverName, id: itemId, type: store, autoRerun: true });
            }
        },
        check: { type: store, prop: isMovingKey, becomes: true },
        step: "moversStart",
        atStepEnd: true,
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
