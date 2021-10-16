export { moverState, moverRefs } from "./mover";
export { mover2dState, mover2dRefs } from "./mover2d";
export { mover3dState, mover3dRefs } from "./mover3d";
export { moverMultiRefs } from "./moverMulti";
export { makeMoverStateMaker } from "./utils";
export declare function makeRunMovers<T_GetState extends () => any, T_GetRefs extends () => any, T_SetState extends (newState: Record<any, any> | ((state: any) => any), callback?: (nextFrameDuration: number) => any) => any>(conceptoFuncs: {
    getState: T_GetState;
    getRefs: T_GetRefs;
    setState: T_SetState;
}): {
    runMover: <T_ItemType extends keyof ReturnType<T_GetState> & keyof ReturnType<T_GetRefs>>({ frameDuration, type: itemType, name: itemId, mover: moverName, }: {
        onSlow?: () => any;
        name: string;
        type: T_ItemType;
        frameDuration?: number;
        mover: keyof ReturnType<T_GetState>[T_ItemType][keyof ReturnType<T_GetState>[T_ItemType]];
    }) => void;
    runMover2d: <T_ItemType_1 extends keyof ReturnType<T_GetState> & keyof ReturnType<T_GetRefs>>({ frameDuration, name: itemId, type: itemType, mover: moverName, onSlow, }: {
        onSlow?: () => any;
        name: string;
        type: T_ItemType_1;
        frameDuration?: number;
        mover: keyof ReturnType<T_GetState>[T_ItemType_1][keyof ReturnType<T_GetState>[T_ItemType_1]];
    }) => void;
    runMover3d: <T_ItemType_2 extends keyof ReturnType<T_GetState> & keyof ReturnType<T_GetRefs>>({ frameDuration, name: itemId, type: itemType, onSlow, mover: moverName, }: {
        onSlow?: () => any;
        name: string;
        type: T_ItemType_2;
        frameDuration?: number;
        mover: keyof ReturnType<T_GetState>[T_ItemType_2][keyof ReturnType<T_GetState>[T_ItemType_2]];
    }) => void;
    runMoverMulti: <T_ItemType_3 extends keyof ReturnType<T_GetState> & keyof ReturnType<T_GetRefs>>({ frameDuration, type: itemType, name: itemId, mover: moverName, }: {
        onSlow?: () => any;
        name: string;
        type: T_ItemType_3;
        frameDuration?: number;
        mover: keyof ReturnType<T_GetState>[T_ItemType_3][keyof ReturnType<T_GetState>[T_ItemType_3]];
    }) => void;
};
