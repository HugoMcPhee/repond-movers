import { defaultPosition, Point2D } from "chootils/dist/points2d";
import { MoveMode, PhysicsConfig, PhysicsOptions } from "./types";
export declare type PositionAndVelocity = {
    position: Point2D;
    velocity: Point2D;
};
declare type MainValueType = ReturnType<typeof defaultPosition>;
export declare const mover2dState: <T_Name extends string, T_PhysicsNames extends string, T_InitialState extends {
    value?: MainValueType;
    valueGoal?: MainValueType;
    isMoving?: boolean;
    moveConfigName?: T_PhysicsNames;
    moveMode?: MoveMode;
    moveConfigs?: Record<T_PhysicsNames, PhysicsOptions>;
}>(newName: T_Name, initialState?: T_InitialState) => Record<T_Name, Point2D> & Record<`${T_Name}Goal`, Point2D> & Record<`${T_Name}IsMoving`, boolean> & Record<`${T_Name}MoveMode`, MoveMode> & (T_InitialState["moveConfigName"] extends undefined ? {} : Record<`${T_Name}MoveConfigName`, T_PhysicsNames>) & (T_InitialState["moveConfigs"] extends undefined ? {} : Record<`${T_Name}MoveConfigs`, Record<T_PhysicsNames, PhysicsOptions>>);
export declare function mover2dRefs<T_Name extends string>(newName: T_Name, config?: PhysicsConfig): Record<`${T_Name}MoverRefs`, {
    velocity: Point2D;
    recentSpeeds: number[];
    averageSpeed: number;
    canRunOnSlow: boolean;
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
export declare function makeMover2dUtils<T_GetState extends () => any, T_GetRefs extends () => any, T_SetState extends (newState: Record<any, any> | ((state: any) => any), callback?: (nextFrameDuration: number) => any) => any>(conceptoFuncs: {
    getState: T_GetState;
    getRefs: T_GetRefs;
    setState: T_SetState;
}): {
    mover2dState: <T_Name extends string, T_PhysicsNames extends string, T_InitialState extends {
        value?: Point2D;
        valueGoal?: Point2D;
        isMoving?: boolean;
        moveConfigName?: T_PhysicsNames;
        moveMode?: MoveMode;
        moveConfigs?: Record<T_PhysicsNames, PhysicsOptions>;
    }>(newName: T_Name, initialState?: T_InitialState) => Record<T_Name, Point2D> & Record<`${T_Name}Goal`, Point2D> & Record<`${T_Name}IsMoving`, boolean> & Record<`${T_Name}MoveMode`, MoveMode> & (T_InitialState["moveConfigName"] extends undefined ? {} : Record<`${T_Name}MoveConfigName`, T_PhysicsNames>) & (T_InitialState["moveConfigs"] extends undefined ? {} : Record<`${T_Name}MoveConfigs`, Record<T_PhysicsNames, PhysicsOptions>>);
    mover2dRefs: typeof mover2dRefs;
    runMover2d: <T_ItemType extends keyof ReturnType<T_GetState> & keyof ReturnType<T_GetRefs>>({ frameDuration, name: itemId, type: itemType, mover: moverName, onSlow, }: {
        onSlow?: () => any;
        name: string;
        type: T_ItemType;
        frameDuration?: number;
        mover: keyof ReturnType<T_GetState>[T_ItemType][keyof ReturnType<T_GetState>[T_ItemType]];
    }) => void;
};
export {};
