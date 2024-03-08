import { ItemType, MoveMode, PhysicsConfig, PhysicsOptions, RunMoverOptions } from "./types";
export declare type PositionAndVelocity = {
    position: number;
    velocity: number;
};
declare type MainValueType = number;
export declare const moverState: <T_Name extends string, T_PhysicsNames extends string, T_InitialState extends {
    value?: MainValueType;
    valueGoal?: MainValueType;
    isMoving?: boolean;
    moveConfigName?: T_PhysicsNames;
    moveMode?: MoveMode;
    moveConfigs?: Record<T_PhysicsNames, PhysicsOptions>;
}>(newName: T_Name, initialState?: T_InitialState) => Record<T_Name, number> & Record<`${T_Name}Goal`, number> & Record<`${T_Name}IsMoving`, boolean> & Record<`${T_Name}MoveMode`, MoveMode> & (T_InitialState["moveConfigName"] extends undefined ? {} : Record<`${T_Name}MoveConfigName`, T_PhysicsNames>) & (T_InitialState["moveConfigs"] extends undefined ? {} : Record<`${T_Name}MoveConfigs`, Record<T_PhysicsNames, PhysicsOptions>>);
export declare function moverRefs<T_Name extends string>(newName: T_Name, config?: PhysicsConfig): Record<`${T_Name}MoverRefs`, {
    velocity: number;
    recentSpeeds: number[];
    stateNames: {
        value: T_Name;
        valueGoal: `${T_Name}Goal`;
        isMoving: `${T_Name}IsMoving`;
        moveMode: `${T_Name}MoveMode`;
        physicsConfigName: `${T_Name}MoveConfigName`;
        physicsConfigs: `${T_Name}MoveConfigs`;
    };
    physicsConfigs: import("./types").DefinedPhysicsConfig;
}>;
export declare function runMover1d<T_ItemType extends ItemType>({ frameDuration, type: itemType, id: itemId, mover: moverName, autoRerun, }: RunMoverOptions<T_ItemType>): void;
export {};
