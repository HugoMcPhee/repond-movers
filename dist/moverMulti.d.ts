import { ItemType, PhysicsConfig, RunMoverOptions } from "./types";
declare type OneAnimRefs = {
    velocity: number;
    recentSpeeds: number[];
};
export declare function moverMultiRefs<T_Name extends string, T_AnimNames extends readonly string[]>(newName: T_Name, animNames: T_AnimNames, config?: PhysicsConfig): Record<`${T_Name}MoverRefs`, {
    stateNames: {
        value: T_Name;
        valueGoal: `${T_Name}Goal`;
        isMoving: `${T_Name}IsMoving`;
        moveMode: `${T_Name}MoveMode`;
        physicsConfigName: `${T_Name}MoveConfigName`;
        physicsConfigs: `${T_Name}MoveConfigs`;
    };
    physicsConfigs: import("./types").DefinedPhysicsConfig;
    animRefs: Record<T_AnimNames[number], OneAnimRefs>;
    animNames: T_AnimNames;
}>;
export declare function runMoverMulti<T_ItemType extends ItemType>({ frameDuration, type: itemType, id: itemId, mover: moverName, autoRerun, }: RunMoverOptions<T_ItemType>): void;
export {};
