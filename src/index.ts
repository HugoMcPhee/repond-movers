import { getPreviousState, getRefs, getState, setState, startEffect, stopEffect } from "repond";
import { makeMover1dUtils } from "./mover1d";
import { makeMover2dUtils } from "./mover2d";
import { makeMover3dUtils } from "./mover3d";
import { makeMoverMultiUtils } from "./moverMulti";
export { moverRefs, moverState } from "./mover1d";
export { mover2dRefs, mover2dState } from "./mover2d";
export { mover3dRefs, mover3dState } from "./mover3d";
export { moverMultiRefs } from "./moverMulti";
export { makeMoverStateMaker } from "./utils";

type MoverType = "1d" | "2d" | "3d" | "multi";

type GetState = typeof getState;
type GetRefs = typeof getRefs;

export function makeMoverUtils<
  T_PathItemType extends keyof ReturnType<GetState> & string,
  T_PathItemName extends keyof ReturnType<GetState>[T_PathItemType] & string,
  T_PathItemProperty extends keyof ReturnType<GetState>[T_PathItemType][T_PathItemName] & string
  // repond store helpers
>(
  timeElapsedStatePath?:
    | [T_PathItemType, T_PathItemName, T_PathItemProperty]
    | readonly [T_PathItemType, T_PathItemName, T_PathItemProperty]
) {
  // ---------------------------
  // types

  type ItemType = keyof ReturnType<GetState> & keyof ReturnType<GetRefs>;
  type ItemState<T_ItemType extends ItemType> =
    ReturnType<GetState>[T_ItemType][keyof ReturnType<GetState>[T_ItemType]];
  type ItemRefs<T_ItemType extends ItemType> = ReturnType<GetRefs>[T_ItemType][keyof ReturnType<GetRefs>[T_ItemType]];

  type StateNameProperty<T_ItemType extends ItemType> = keyof ItemState<T_ItemType> & string;

  const { runMover1d } = makeMover1dUtils();
  const { runMover2d } = makeMover2dUtils();
  const { runMover3d } = makeMover3dUtils();
  const { runMoverMulti } = makeMoverMultiUtils();

  const runMoverFunctionsByType = {
    "1d": runMover1d,
    "2d": runMover2d,
    "3d": runMover3d,
    multi: runMoverMulti,
  } as const;

  function addMoverRules<T_ItemType extends ItemType>(
    store: T_ItemType & string,
    moverName: StateNameProperty<T_ItemType>,
    moverType: MoverType = "1d"
  ) {
    const isMovingKey = `${moverName}IsMoving`;
    const moveModePropKey = `${moverName}MoveMode`;
    const moverRefsKey = `${moverName}MoverRefs`;

    const runMoverFunction = runMoverFunctionsByType[moverType];

    // make something the same as runMover1d, but instead of doing a setState callback loop, make a temporary rule like the pattern below:

    // add a rule, that listens to the elapsed time state changing,
    // and each time, if isMoving is true, run the mover again
    // if it's false, remove the rule

    function startMoverMoveRule({ itemName }: { itemName: string }) {
      if (!timeElapsedStatePath) return;

      const timeStoreKey = timeElapsedStatePath[0];
      const timeNameKey = timeElapsedStatePath[1];
      const timePropKey = timeElapsedStatePath[2];

      const { nowPlaceName } = getState().global.main;

      const initialNowPlaceName = getState().global.main.nowPlaceName;

      const ruleName = "moverValueRule" + store + moverName + moverType + Math.random();
      startEffect({
        name: ruleName,
        run: () => {
          const newTimeElapsed = getState()[timeStoreKey][timeNameKey][timePropKey];
          const prevTimeElapsed = getPreviousState()[timeStoreKey][timeNameKey][timePropKey];

          if (!getState()[store]?.[itemName]?.[isMovingKey]) {
            stopEffect(ruleName);
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
          // it was there for doll position, bu tput here so it works the same for now
          if (moveMode === "spring") itemRefs[moverRefsKey].recentSpeeds = [];
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
        } else {
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

  function runMover<T_ItemType extends ItemType>(
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
    const runMoverFunction = runMoverFunctionsByType[moverType];

    return runMoverFunction({
      frameDuration: frameDuration ?? 16.6667,
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
