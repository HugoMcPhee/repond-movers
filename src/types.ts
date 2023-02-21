// concepto-movers

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
  (
    | { mass: number }
    | { stiffness: number }
    | { damping: number }
    | { friction: number }
  );

type MultipleConfigsOption = Record<string, OnePhysicsConfigOptions> & {
  mass?: undefined;
  stiffness?: undefined;
  damping?: undefined;
  stopSpeed?: undefined;
  friction?: undefined;
};

export type PhysicsConfig =
  | undefined
  | OnePhysicsConfigOptions
  | MultipleConfigsOption;

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
//   name: string;
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
