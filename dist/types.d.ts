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
export {};
