export { moverState, moverRefs } from "./mover1d";
export { mover2dState, mover2dRefs } from "./mover2d";
export { mover3dState, mover3dRefs } from "./mover3d";
export { moverMultiRefs } from "./moverMulti";
export { makeMoverStateMaker } from "./utils";
declare type MoverType = "1d" | "2d" | "3d" | "multi";
export declare function makeMoverUtils<T_GetState extends () => any, T_GetPreviousState extends () => any, T_GetRefs extends () => any, T_SetState extends (newState: Record<any, any> | ((state: any) => any), callback?: (nextFrameDuration: number) => any) => any, T_StartItemEffect extends (options: {
    name: string;
    run: (options: {
        newValue: any;
        previousValue: any;
    }) => any;
    check: {
        type: string;
        prop: string;
    };
    step: string;
    atStepEnd: boolean;
}) => any, T_StartEffect extends (options: {
    name: string;
    run: (options: {
        newValue: any;
        previousValue: any;
    }) => any;
    check: {
        type: string[];
        name: string[];
        prop: string[];
    };
    step: string;
    atStepEnd: boolean;
}) => any, T_StopEffect extends (name: string) => any, T_PathItemType extends keyof ReturnType<T_GetState> & string, T_PathItemName extends keyof ReturnType<T_GetState>[T_PathItemType] & string, T_PathItemProperty extends keyof ReturnType<T_GetState>[T_PathItemType][T_PathItemName] & string>(storeHelpers: {
    getState: T_GetState;
    getPreviousState: T_GetPreviousState;
    getRefs: T_GetRefs;
    setState: T_SetState;
    startItemEffect: T_StartItemEffect;
    startEffect: T_StartEffect;
    stopEffect: T_StopEffect;
}, timeElapsedStatePath?: [T_PathItemType, T_PathItemName, T_PathItemProperty] | readonly [T_PathItemType, T_PathItemName, T_PathItemProperty]): {
    addMoverRules: <T_ItemType extends keyof ReturnType<T_GetState> & keyof ReturnType<T_GetRefs>>(store: T_ItemType & string, moverName: keyof ReturnType<T_GetState>[T_ItemType][keyof ReturnType<T_GetState>[T_ItemType]] & string, moverType?: MoverType) => {
        [x: string]: {
            run({ itemName, itemState, itemRefs, }: {
                itemName: string;
                itemState: ReturnType<T_GetState>[T_ItemType][keyof ReturnType<T_GetState>[T_ItemType]];
                itemRefs: ReturnType<T_GetRefs>[T_ItemType][keyof ReturnType<T_GetRefs>[T_ItemType]];
            }): void;
            check: {
                type: T_ItemType & string;
                prop: string;
            };
            step: string;
            atStepEnd: boolean;
            _isPerItem: boolean;
        };
    };
    runMover: <T_ItemType_1 extends keyof ReturnType<T_GetState> & keyof ReturnType<T_GetRefs>>(moverType: MoverType, { frameDuration, store, name: itemId, mover: moverName, }: {
        onSlow?: () => any;
        name: string;
        store: T_ItemType_1;
        frameDuration?: number;
        mover: keyof ReturnType<T_GetState>[T_ItemType_1][keyof ReturnType<T_GetState>[T_ItemType_1]] & string;
    }) => void;
};
