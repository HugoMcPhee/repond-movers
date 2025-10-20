import { AllState, AllRefs } from "repond";
export type MoverType = "1d" | "2d" | "3d" | "multi";
export type ItemType = keyof AllState & keyof AllRefs;
export type ItemState<T_ItemType extends ItemType> = AllState[T_ItemType][keyof AllState[T_ItemType]];
export type ItemRefs<T_ItemType extends ItemType> = AllRefs[T_ItemType][keyof AllRefs[T_ItemType]];
export type StateNameProperty<T_ItemType extends ItemType> = keyof ItemState<T_ItemType> & string;
export type MoveMode = "spring" | "slide" | "drag" | "push";
export type PhysicsOptions = {
    mass: number;
    stiffness: number;
    damping: number;
    friction: number;
};
export type MoverMode = "1d" | "2d" | "3d" | "multi";
export type OnePhysicsConfig = {
    mass: number;
    stiffness: number;
    damping: number;
    stopSpeed: number;
    friction: number;
};
export type TempStateNameProperty = string;
type OnePhysicsConfigOptions = Partial<OnePhysicsConfig> & ({
    mass: number;
} | {
    stiffness: number;
} | {
    damping: number;
} | {
    friction: number;
});
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
    physicsConfigName?: any;
    moveMode?: any;
    physicsConfigs?: any;
};
export type RunMoverOptions<T_ItemType extends ItemType> = {
    onSlow?: () => any;
    id: string;
    type: T_ItemType;
    frameDuration?: number;
    mover: StateNameProperty<T_ItemType> & string;
    autoRerun?: boolean;
};
export type TimeKeyConfig = Record<string, readonly [string, string, string]>;
export type MoverEffectOptions = {
    timeKey?: string;
};
export {};
