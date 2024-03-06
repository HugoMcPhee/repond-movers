import { AllState, ItemType, getPrevState, getState, setState, startNewEffect, stopNewEffect } from "repond";
import { meta } from "./meta";
import { runMover1d } from "./mover1d";
import { runMover2d } from "./mover2d";
import { runMover3d } from "./mover3d";
import { runMoverMulti } from "./moverMulti";
import { ItemRefs, ItemState, MoverType, StateNameProperty } from "./types";
export { moverRefs, moverState } from "./mover1d";
export { mover2dRefs, mover2dState } from "./mover2d";
export { mover3dRefs, mover3dState } from "./mover3d";
export { moverMultiRefs } from "./moverMulti";
export { makeMoverStateMaker } from "./utils";

export function initMovers<
  T_PathItemType extends keyof AllState & string,
  T_PathItemName extends keyof AllState[T_PathItemType] & string,
  T_PathItemProperty extends keyof AllState[T_PathItemType][T_PathItemName] & string
  // repond store helpers
>(
  timeElapsedStatePath?:
    | [T_PathItemType, T_PathItemName, T_PathItemProperty]
    | readonly [T_PathItemType, T_PathItemName, T_PathItemProperty]
) {
  meta.timeElapsedStatePath = timeElapsedStatePath as string[];
}
const runMoverFunctionsByType = {
  "1d": runMover1d,
  "2d": runMover2d,
  "3d": runMover3d,
  multi: runMoverMulti,
} as const;

export function addMoverRules<T_ItemType extends ItemType, T_Name extends StateNameProperty<T_ItemType>>(
  store: T_ItemType,
  moverName: T_Name,
  moverType: MoverType = "1d"
) {
  const isMovingKey = `${moverName}IsMoving`;
  const moveModePropKey = `${moverName}MoveMode`;
  const moverRefsKey = `${moverName}MoverRefs`;

  const runMoverFunction = runMoverFunctionsByType[moverType] as unknown as typeof runMover1d;

  // make something the same as runMover1d, but instead of doing a setState callback loop, make a temporary rule like the pattern below:

  // add a rule, that listens to the elapsed time state changing,
  // and each time, if isMoving is true, run the mover again
  // if it's false, remove the rule

  function startMoverMoveRule({ itemName }: { itemName: string }) {
    if (!meta.timeElapsedStatePath) return;

    const timeStoreKey = meta.timeElapsedStatePath[0];
    const timeNameKey = meta.timeElapsedStatePath[1];
    const timePropKey = meta.timeElapsedStatePath[2];

    const ruleName = "moverValueRule" + store + moverName + moverType + Math.random();
    startNewEffect({
      name: ruleName,
      run: () => {
        const newTimeElapsed = getState()[timeStoreKey][timeNameKey][timePropKey];
        const prevTimeElapsed = getPrevState()[timeStoreKey][timeNameKey][timePropKey];

        if (!getState()[store]?.[itemName]?.[isMovingKey]) {
          stopNewEffect(ruleName);
        } else {
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
      step: "moverUpdates", // NOTE may need to change this to run after elapsed time changes, but before other game logic
      atStepEnd: true,
    });
    return ruleName;
  }

  const valueGoalChangedRule = {
    run({
      itemName,
      itemState,
      itemRefs,
    }: {
      itemName: string;
      itemState: ItemState<T_ItemType>;
      itemRefs: ItemRefs<T_ItemType>;
    }) {
      setState({ [store]: { [itemName]: { [isMovingKey]: true } } });
      if (moverType === "3d") {
        const moveMode = itemState[moveModePropKey];
        // TEMPORARY : ideally this is automatic for movers? (when isMoving becoems true?)
        // it was there for doll position, but put here so it works the same for now
        if (moveMode === "spring") itemRefs[moverRefsKey].recentSpeeds = [];
      }
    },
    check: { type: store, prop: moverName + "Goal" },
    step: "moversGoal" as const,
    atStepEnd: true,
    _isPerItem: true,
  };

  const startedMovingRule = {
    run({ itemName }) {
      // runMoverFunction({ name: itemName, type: store, mover: moverName });
      if (meta.timeElapsedStatePath) {
        startMoverMoveRule({ itemName });
      } else {
        runMoverFunction({ mover: moverName, name: itemName, type: store, autoRerun: true });
      }
    },
    check: { type: store, prop: isMovingKey, becomes: true },
    step: "moversStart" as const,
    atStepEnd: true,
    _isPerItem: true,
  };

  return {
    [`${moverName}GoalChanged`]: valueGoalChangedRule,
    [`when${moverName}StartedMoving`]: startedMovingRule,
  } as Record<`${T_Name}GoalChanged`, any> & Record<`${T_Name}StartedMoving`, any>;
}

export function runMover<T_ItemType extends ItemType>(
  moverType: MoverType,
  {
    frameDuration,
    store,
    name: itemId,
    mover: moverName,
  }: {
    onSlow?: () => any;
    name: string;
    store: T_ItemType;
    frameDuration?: number;
    mover: StateNameProperty<T_ItemType>;
  }
) {
  const runMoverFunction = runMoverFunctionsByType[moverType] as unknown as typeof runMover1d;

  return runMoverFunction({
    frameDuration: frameDuration ?? 16.6667,
    type: store,
    name: itemId,
    mover: moverName,
  });
}

// }
