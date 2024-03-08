import { AllState, AllRefs } from "repond";
export declare type MoverType = "1d" | "2d" | "3d" | "multi";
export declare type ItemType = keyof AllState & keyof AllRefs;
export declare type ItemState<T_ItemType extends ItemType> = AllState[T_ItemType][keyof AllState[T_ItemType]];
export declare type ItemRefs<T_ItemType extends ItemType> = AllRefs[T_ItemType][keyof AllRefs[T_ItemType]];
export declare type StateNameProperty<T_ItemType extends ItemType> = keyof ItemState<T_ItemType> & string;
export declare type MoveMode = "spring" | "slide" | "drag" | "push";
export declare type PhysicsOptions = {
    mass: number;
    stiffness: number;
    damping: number;
    friction: number;
};
export declare type MoverMode = "1d" | "2d" | "3d" | "multi";
export declare type OnePhysicsConfig = {
    mass: number;
    stiffness: number;
    damping: number;
    stopSpeed: number;
    friction: number;
};
export declare type TempStateNameProperty = string;
declare type OnePhysicsConfigOptions = Partial<OnePhysicsConfig> & ({
    mass: number;
} | {
    stiffness: number;
} | {
    damping: number;
} | {
    friction: number;
});
declare type MultipleConfigsOption = Record<string, OnePhysicsConfigOptions> & {
    mass?: undefined;
    stiffness?: undefined;
    damping?: undefined;
    stopSpeed?: undefined;
    friction?: undefined;
};
export declare type PhysicsConfig = undefined | OnePhysicsConfigOptions | MultipleConfigsOption;
export declare type DefinedPhysicsConfig = Record<string, OnePhysicsConfig>;
export declare type AnyMoverStateNames = {
    value: any;
    valueGoal: any;
    isMoving: any;
    physicsConfigName?: any;
    moveMode?: any;
    physicsConfigs?: any;
};
export declare type RunMoverOptions<T_ItemType extends ItemType> = {
    onSlow?: () => any;
    id: string;
    type: T_ItemType;
    frameDuration?: number;
    mover: StateNameProperty<T_ItemType> & string;
    autoRerun?: boolean;
};
export {};
