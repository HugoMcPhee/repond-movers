// concepto-movers

import { AllState, AllRefs } from "repond";

export type MoverType = "1d" | "2d" | "3d" | "multi";
export type ItemType = keyof AllState & keyof AllRefs;
export type ItemState<T_ItemType extends ItemType> = AllState[T_ItemType][keyof AllState[T_ItemType]];
export type ItemRefs<T_ItemType extends ItemType> = AllRefs[T_ItemType][keyof AllRefs[T_ItemType]];
export type StateNameProperty<T_ItemType extends ItemType> = keyof ItemState<T_ItemType> & string;

// might use manual instead of dragging
export type MoveMode = "spring" | "slide" | "drag" | "push";
export type PhysicsOptions = {
  // spring
  mass: number;
  stiffness: number;
  damping: number; // slide
  friction: number;
};

export type MoverMode = "1d" | "2d" | "3d" | "multi";

export type OnePhysicsConfig = {
  mass: number;
  stiffness: number;
  damping: number;
  stopSpeed: number; // spring
  friction: number; // sliding
};

export type TempStateNameProperty = string;

type OnePhysicsConfigOptions = Partial<OnePhysicsConfig> &
  ({ mass: number } | { stiffness: number } | { damping: number } | { friction: number });

type MultipleConfigsOption = Record<string, OnePhysicsConfigOptions> & {
  mass?: undefined;
  stiffness?: undefined;
  damping?: undefined;
  stopSpeed?: undefined;
  friction?: undefined;
};

export type PhysicsConfig = undefined | OnePhysicsConfigOptions | MultipleConfigsOption;

export type DefinedPhysicsConfig = Record<string, OnePhysicsConfig>;

export type AnyMoverStateNames = {
  value: any;
  valueGoal: any;
  isMoving: any;
  physicsConfigName?: any; // NOTE optional?
  moveMode?: any;
  physicsConfigs?: any;
};

// export type RunMoverOptions<T_ItemType extends ItemType> = {
//   onSlow?: () => any;
//   id: string;
//   type: T_ItemType;
//   frameDuration?: number;
//   mover: StateNameProperty<T_ItemType>;
// };

// ----------------------------------------------------------------------

// type StateNameProperty<T_ItemType extends ItemType> =
//   keyof ItemState<T_ItemType>;

// export type AnyMoverStateNames<T_ItemType extends ItemType> = {
//   value: StateNameProperty<T_ItemType>;
//   valueGoal: StateNameProperty<T_ItemType>;
//   isMoving: StateNameProperty<T_ItemType>;
//   physicsConfigName?: StateNameProperty<T_ItemType>; // NOTE optional?
//   moveMode?: StateNameProperty<T_ItemType>;
//   physicsConfigs?: StateNameProperty<T_ItemType>;
// };

export type RunMoverOptions<T_ItemType extends ItemType> = {
  onSlow?: () => any;
  id: string;
  type: T_ItemType;
  frameDuration?: number;
  mover: StateNameProperty<T_ItemType> & string;
  autoRerun?: boolean; // if it should automatically start the next frame, otherwise it will run when elapsedTime changes
};

// Time key configuration for initMovers
export type TimeKeyConfig = Record<string, readonly [string, string, string]>;

// Options for addMoverEffects
export type MoverEffectOptions = {
  timeKey?: string;
};
