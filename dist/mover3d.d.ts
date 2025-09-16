import { Point3D, defaultPosition } from "chootils/dist/points3d";
import { AllRefs, AllState } from "repond";
import { MoveMode, PhysicsConfig, PhysicsOptions } from "./types";
export type PositionAndVelocity = {
    position: Point3D;
    velocity: Point3D;
};
type MainValueType = ReturnType<typeof defaultPosition>;
export declare const mover3dState: <T_Name extends string, T_PhysicsNames extends string, T_InitialState extends {
    value?: MainValueType;
    valueGoal?: MainValueType;
    isMoving?: boolean;
    moveConfigName?: T_PhysicsNames;
    moveMode?: MoveMode;
    moveConfigs?: Record<T_PhysicsNames, PhysicsOptions>;
}>(newName: T_Name, initialState?: T_InitialState) => Record<T_Name, MainValueType> & Record<`${T_Name}Goal`, MainValueType> & Record<`${T_Name}IsMoving`, boolean> & Record<`${T_Name}MoveMode`, MoveMode> & (T_InitialState["moveConfigName"] extends undefined ? {} : Record<`${T_Name}MoveConfigName`, T_PhysicsNames>) & (T_InitialState["moveConfigs"] extends undefined ? {} : Record<`${T_Name}MoveConfigs`, Record<T_PhysicsNames, PhysicsOptions>>);
export declare function mover3dRefs<T_Name extends string>(newName: T_Name, config?: PhysicsConfig): Record<`${T_Name}MoverRefs`, {
    velocity: Point3D;
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
type ItemType = keyof AllState & keyof AllRefs;
type ItemState<T_ItemType extends ItemType> = AllState[T_ItemType][keyof AllState[T_ItemType]];
type StateNameProperty<T_ItemType extends ItemType> = keyof ItemState<T_ItemType>;
type RunMoverOptions<T_ItemType extends ItemType> = {
    onSlow?: () => any;
    id: string;
    type: T_ItemType;
    frameDuration?: number;
    mover: StateNameProperty<T_ItemType> & string;
    autoRerun?: boolean;
};
export declare function runMover3d<T_ItemType extends ItemType>({ frameDuration, id: itemId, type: itemType, onSlow, mover: moverName, autoRerun, }: RunMoverOptions<T_ItemType>): void;
export declare function stepSlide3d(state: {
    position: Point3D;
    velocity: Point3D;
}, friction: number, dtSeconds: number): void;
export {};
