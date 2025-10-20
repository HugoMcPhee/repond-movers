import {
  AllState,
  ItemType,
  getPrevState,
  getRefs,
  getState,
  makeEffect,
  setState,
  startNewEffect,
  stopEffect,
} from "repond";
import { meta } from "./meta";
import { runMover1d } from "./mover1d";
import { runMover2d } from "./mover2d";
import { runMover3d } from "./mover3d";
import { runMoverMulti } from "./moverMulti";
import { ItemRefs, ItemState, MoverType, StateNameProperty, TimeKeyConfig, MoverEffectOptions } from "./types";
export { moverRefs, moverState } from "./mover1d";
export { mover2dRefs, mover2dState } from "./mover2d";
export { mover3dRefs, mover3dState } from "./mover3d";
export { moverMultiRefs } from "./moverMulti";
export { makeMoverStateMaker } from "./utils";

// Overload for new TimeKeyConfig (object with named time keys)
export function initMovers(timeConfig: TimeKeyConfig): void;

// Overload for backward compatibility (single time path array)
export function initMovers<
  T_PathItemType extends keyof AllState & string,
  T_PathItemName extends keyof AllState[T_PathItemType] & string,
  T_PathItemProperty extends keyof AllState[T_PathItemType][T_PathItemName] & string
>(
  timeElapsedStatePath:
    | [T_PathItemType, T_PathItemName, T_PathItemProperty]
    | readonly [T_PathItemType, T_PathItemName, T_PathItemProperty]
): void;

// Implementation
export function initMovers(timeConfig?: any) {
  if (Array.isArray(timeConfig)) {
    // Backward compatibility: treat array as "default" time key
    meta.timePaths = { default: timeConfig as [string, string, string] };
    meta.timeElapsedStatePath = timeConfig; // Keep deprecated field
  } else if (timeConfig) {
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
} as const;

export function addMoverEffects<T_ItemType extends ItemType, T_Name extends StateNameProperty<T_ItemType>>(
  store: T_ItemType,
  moverName: T_Name,
  moverType: MoverType = "1d",
  options?: MoverEffectOptions
) {
  const timeKey = options?.timeKey ?? "default";
  const moverKey = `${store}.${moverName}`;

  // Store the time key assignment for this mover
  meta.moverTimeKeys[moverKey] = timeKey;

  // Validate time key exists (only warn if explicitly set by user)
  if (options?.timeKey && !meta.timePaths[timeKey]) {
    console.warn(
      `[repond-movers] Time key "${timeKey}" not found in timePaths. ` +
        `Available keys: ${Object.keys(meta.timePaths).join(", ")}. ` +
        `Mover "${moverKey}" may not animate.`
    );
  }

  const isMovingKey = `${moverName}IsMoving`;
  const moveModePropKey = `${moverName}MoveMode`;
  const moverRefsKey = `${moverName}MoverRefs`;

  const runMoverFunction = runMoverFunctionsByType[moverType] as unknown as typeof runMover1d;

  // make something the same as runMover1d, but instead of doing a setState callback loop, make a temporary effect like the pattern below:

  // add an effect, that listens to the elapsed time state changing,
  // and each time, if isMoving is true, run the mover again
  // if it's false, remove the effect

  function startMoverMoveEffect({ itemId }: { itemId: string }) {
    const moverKey = `${store}.${moverName}`;
    const timeKey = meta.moverTimeKeys[moverKey] ?? "default";
    const timePath = meta.timePaths[timeKey];

    if (!timePath) {
      console.error(
        `[repond-movers] No time path found for time key "${timeKey}". ` +
          `Mover "${moverKey}" cannot animate.`
      );
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
        } else {
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

  const valueGoalChangedEffect = makeEffect(
    (itemId) => {
      const itemState = getState(store, itemId) as ItemState<T_ItemType>;
      const itemRefs = getRefs(store, itemId) as ItemRefs<T_ItemType>;

      setState(`${store}.${isMovingKey}`, true, itemId);
      if (moverType === "3d") {
        const moveMode = itemState[moveModePropKey];
        // TEMPORARY : ideally this is automatic for movers? (when isMoving becoems true?)
        // it was there for doll position, but put here so it works the same for now
        if (moveMode === "spring") itemRefs[moverRefsKey].recentSpeeds = [];
      }
    },
    { isPerItem: true, changes: [`${store}.${moverName}Goal`], step: "moversGoal" as const, atStepEnd: true }
  );

  const startedMovingEffect = makeEffect(
    (itemId) => {
      const newValue = getState(store, itemId)?.[isMovingKey];
      if (newValue !== true) return;

      const moverKey = `${store}.${moverName}`;
      const timeKey = meta.moverTimeKeys[moverKey] ?? "default";
      const timePath = meta.timePaths[timeKey];

      if (timePath) {
        // Use time-based effect if time path exists
        startMoverMoveEffect({ itemId: itemId });
      } else {
        // Fallback to auto-rerun mode (no time control)
        runMoverFunction({ mover: moverName, id: itemId, type: store, autoRerun: true });
      }
    },
    {
      changes: [`${store}.${isMovingKey}`],
      step: "moversStart" as const,
      atStepEnd: true,
      isPerItem: true,
    }
  );

  return {
    [`${moverName}GoalChanged`]: valueGoalChangedEffect,
    [`when${moverName}StartedMoving`]: startedMovingEffect,
  } as Record<`${T_Name}GoalChanged`, any> & Record<`${T_Name}StartedMoving`, any>;
}

export function runMover<T_ItemType extends ItemType>(
  moverType: MoverType,
  {
    frameDuration,
    store,
    id: itemId,
    mover: moverName,
  }: {
    onSlow?: () => any;
    id: string;
    store: T_ItemType;
    frameDuration?: number;
    mover: StateNameProperty<T_ItemType>;
  }
) {
  const runMoverFunction = runMoverFunctionsByType[moverType] as unknown as typeof runMover1d;

  return runMoverFunction({
    frameDuration: frameDuration ?? 16.6667,
    type: store,
    id: itemId,
    mover: moverName,
  });
}

// }
