import { makeMover1dUtils } from "./mover1d";
import { makeMover2dUtils } from "./mover2d";
import { makeMover3dUtils } from "./mover3d";
import { makeMoverMultiUtils } from "./moverMulti";
export { moverState, moverRefs } from "./mover1d";
export { mover2dState, mover2dRefs } from "./mover2d";
export { mover3dState, mover3dRefs } from "./mover3d";
export { moverMultiRefs } from "./moverMulti";
export { makeMoverStateMaker } from "./utils";
export function makeMoverUtils(storeHelpers, timeElapsedStatePath) {
    const { getState, getPreviousState, getRefs, setState, startItemEffect, startEffect, stopEffect } = storeHelpers;
    const { runMover1d } = makeMover1dUtils(storeHelpers);
    const { runMover2d } = makeMover2dUtils(storeHelpers);
    const { runMover3d } = makeMover3dUtils(storeHelpers);
    const { runMoverMulti } = makeMoverMultiUtils(storeHelpers);
    const runMoverFunctionsByType = {
        "1d": runMover1d,
        "2d": runMover2d,
        "3d": runMover3d,
        multi: runMoverMulti,
    };
    function addMoverRules(store, moverName, moverType = "1d") {
        const isMovingKey = `${moverName}IsMoving`;
        const moveModePropKey = `${moverName}MoveMode`;
        const moverRefsKey = `${moverName}MoverRefs`;
        const runMoverFunction = runMoverFunctionsByType[moverType];
        // make something the same as runMover1d, but instead of doing a setState callback loop, make a temporary rule like the pattern below:
        // add a rule, that listens to the elapsed time state changing,
        // and each time, if isMoving is true, run the mover again
        // if it's false, remove the rule
        function startMoverMoveRule({ itemName }) {
            if (!timeElapsedStatePath)
                return;
            const timeStoreKey = timeElapsedStatePath[0];
            const timeNameKey = timeElapsedStatePath[1];
            const timePropKey = timeElapsedStatePath[2];
            const { nowPlaceName } = getState().global.main;
            const initialNowPlaceName = getState().global.main.nowPlaceName;
            const ruleName = "moverValueRule" + store + moverName + moverType + Math.random();
            startEffect({
                name: ruleName,
                run: () => {
                    var _a, _b;
                    const newTimeElapsed = getState()[timeStoreKey][timeNameKey][timePropKey];
                    const prevTimeElapsed = getPreviousState()[timeStoreKey][timeNameKey][timePropKey];
                    if (!((_b = (_a = getState()[store]) === null || _a === void 0 ? void 0 : _a[itemName]) === null || _b === void 0 ? void 0 : _b[isMovingKey])) {
                        stopEffect(ruleName);
                    }
                    else {
                        const timeDuration = newTimeElapsed - prevTimeElapsed;
                        runMoverFunction({
                            mover: moverName,
                            name: itemName,
                            type: store,
                            frameDuration: timeDuration,
                            autoRerun: false,
                        });
                    }
                },
                check: { type: [timeStoreKey], name: [timeNameKey], prop: [timePropKey] },
                step: "moverUpdates",
                atStepEnd: true,
            });
            return ruleName;
        }
        const valueGoalChangedRule = {
            run({ itemName, itemState, itemRefs, }) {
                setState({ [store]: { [itemName]: { [isMovingKey]: true } } });
                if (moverType === "3d") {
                    const moveMode = itemState[moveModePropKey];
                    // TEMPORARY : ideally this is automatic for movers? (when isMoving becoems true?)
                    // it was there for doll position, bu tput here so it works the same for now
                    if (moveMode === "spring")
                        itemRefs[moverRefsKey].recentSpeeds = [];
                }
            },
            check: { type: store, prop: moverName + "Goal" },
            step: "moversGoal",
            atStepEnd: true,
            _isPerItem: true,
        };
        const startedMovingRule = {
            run({ itemName }) {
                // runMoverFunction({ name: itemName, type: store, mover: moverName });
                if (timeElapsedStatePath) {
                    startMoverMoveRule({ itemName });
                }
                else {
                    runMoverFunction({ mover: moverName, name: itemName, type: store, autoRerun: true });
                }
            },
            check: { type: store, prop: isMovingKey, becomes: true },
            step: "moversStart",
            atStepEnd: true,
            _isPerItem: true,
        };
        return {
            [`${moverName}GoalChanged`]: valueGoalChangedRule,
            [`when${moverName}StartedMoving`]: startedMovingRule,
        };
    }
    function runMover(moverType, { frameDuration, store, name: itemId, mover: moverName, }) {
        const runMoverFunction = runMoverFunctionsByType[moverType];
        return runMoverFunction({
            frameDuration: frameDuration !== null && frameDuration !== void 0 ? frameDuration : 16.6667,
            type: store,
            name: itemId,
            mover: moverName,
        });
    }
    return {
        addMoverRules,
        runMover,
    };
}
