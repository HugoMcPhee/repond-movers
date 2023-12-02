import { AllState, ItemType } from "repond";
import { ItemRefs, ItemState, MoverType, StateNameProperty } from "./types";
export { moverRefs, moverState } from "./mover1d";
export { mover2dRefs, mover2dState } from "./mover2d";
export { mover3dRefs, mover3dState } from "./mover3d";
export { moverMultiRefs } from "./moverMulti";
export { makeMoverStateMaker } from "./utils";
export declare function initMovers<T_PathItemType extends keyof AllState & string, T_PathItemName extends keyof AllState[T_PathItemType] & string, T_PathItemProperty extends keyof AllState[T_PathItemType][T_PathItemName] & string>(timeElapsedStatePath?: [T_PathItemType, T_PathItemName, T_PathItemProperty] | readonly [T_PathItemType, T_PathItemName, T_PathItemProperty]): void;
export declare function addMoverRules<T_ItemType extends ItemType>(store: T_ItemType & string, moverName: StateNameProperty<T_ItemType>, moverType?: MoverType): {
    [x: string]: {
        run({ itemName, itemState, itemRefs, }: {
            itemName: string;
            itemState: ItemState<T_ItemType>;
            itemRefs: ItemRefs<T_ItemType>;
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
export declare function runMover<T_ItemType extends ItemType>(moverType: MoverType, { frameDuration, store, name: itemId, mover: moverName, }: {
    onSlow?: () => any;
    name: string;
    store: T_ItemType;
    frameDuration?: number;
    mover: StateNameProperty<T_ItemType>;
}): void;
