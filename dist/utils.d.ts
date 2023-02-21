import { DefinedPhysicsConfig, MoveMode, MoverMode, PhysicsConfig, PhysicsOptions } from "./types";
export declare function normalizeDefinedPhysicsConfig(theConfig: PhysicsConfig, mode: MoverMode): DefinedPhysicsConfig;
export declare type PropTypesByWord<T_ValueType extends any> = {
    Goal: T_ValueType;
    IsMoving: boolean;
    MoveMode: MoveMode;
};
export declare type NewProps<T_Name extends string, T_ValueType extends any> = {
    [K_PropName in keyof PropTypesByWord<T_ValueType> as `${T_Name}${K_PropName}`]: PropTypesByWord<T_ValueType>[K_PropName];
};
export declare function makeMoverStateMaker<T_ValueType>(getDefaultValue: () => T_ValueType): <T_Name extends string, T_PhysicsNames extends string, T_InitialState extends {
    value?: T_ValueType;
    valueGoal?: T_ValueType;
    isMoving?: boolean;
    moveConfigName?: T_PhysicsNames;
    moveMode?: MoveMode;
    moveConfigs?: Record<T_PhysicsNames, PhysicsOptions>;
}>(newName: T_Name, initialState?: T_InitialState) => Record<T_Name, T_ValueType> & NewProps<T_Name, T_ValueType> & (T_InitialState["moveConfigName"] extends undefined ? {} : Record<`${T_Name}MoveConfigName`, T_PhysicsNames>) & (T_InitialState["moveConfigs"] extends undefined ? {} : Record<`${T_Name}MoveConfigs`, Record<T_PhysicsNames, PhysicsOptions>>);
export declare function makeStateNames<T_Name extends string>(newName: T_Name): {
    value: T_Name;
    valueGoal: `${T_Name}Goal`;
    isMoving: `${T_Name}IsMoving`;
    moveMode: `${T_Name}MoveMode`;
    physicsConfigName: `${T_Name}MoveConfigName`;
    physicsConfigs: `${T_Name}MoveConfigs`;
};
