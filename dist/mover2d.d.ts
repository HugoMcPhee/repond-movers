import { defaultPosition, Point2D } from "chootils/dist/points2d";
import { ItemType } from "repond";
import { MoveMode, PhysicsConfig, PhysicsOptions, RunMoverOptions } from "./types";
export type PositionAndVelocity = {
    position: Point2D;
    velocity: Point2D;
};
type MainValueType = ReturnType<typeof defaultPosition>;
export declare const mover2dState: <T_Name extends string, T_PhysicsNames extends string, T_InitialState extends {
    value?: MainValueType;
    valueGoal?: MainValueType;
    isMoving?: boolean;
    moveConfigName?: T_PhysicsNames;
    moveMode?: MoveMode;
    moveConfigs?: Record<T_PhysicsNames, PhysicsOptions>;
}>(newName: T_Name, initialState?: T_InitialState) => Record<T_Name, MainValueType> & Record<`${T_Name}Goal`, MainValueType> & Record<`${T_Name}IsMoving`, boolean> & Record<`${T_Name}MoveMode`, MoveMode> & (T_InitialState["moveConfigName"] extends undefined ? {} : Record<`${T_Name}MoveConfigName`, T_PhysicsNames>) & (T_InitialState["moveConfigs"] extends undefined ? {} : Record<`${T_Name}MoveConfigs`, Record<T_PhysicsNames, PhysicsOptions>>);
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
export declare function runMover2d<T_ItemType extends ItemType>({ frameDuration, id: itemId, type: itemType, mover: moverName, autoRerun, onSlow, }: RunMoverOptions<T_ItemType>): void;
export {};
