import { PhysicsConfig } from "./types";
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
export declare function makeMoverMultiUtils<T_GetState extends () => any, T_GetRefs extends () => any, T_SetState extends (newState: Record<any, any> | ((state: any) => any), callback?: (nextFrameDuration: number) => any) => any>(conceptoFuncs: {
    getState: T_GetState;
    getRefs: T_GetRefs;
    setState: T_SetState;
}): {
    moverMultiRefs: typeof moverMultiRefs;
    runMoverMulti: <T_ItemType extends keyof ReturnType<T_GetState> & keyof ReturnType<T_GetRefs>>({ frameDuration, type: itemType, name: itemId, mover: moverName, autoRerun, }: {
        onSlow?: () => any;
        name: string;
        type: T_ItemType;
        frameDuration?: number;
        mover: keyof ReturnType<T_GetState>[T_ItemType][keyof ReturnType<T_GetState>[T_ItemType]] & string;
        autoRerun?: boolean;
    }) => void;
};
export {};
