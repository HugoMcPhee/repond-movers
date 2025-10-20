import { AllState, ItemType } from "repond";
import { MoverType, StateNameProperty, TimeKeyConfig, MoverEffectOptions } from "./types";
export { moverRefs, moverState } from "./mover1d";
export { mover2dRefs, mover2dState } from "./mover2d";
export { mover3dRefs, mover3dState } from "./mover3d";
export { moverMultiRefs } from "./moverMulti";
export { makeMoverStateMaker } from "./utils";
export declare function initMovers(timeConfig: TimeKeyConfig): void;
export declare function initMovers<T_PathItemType extends keyof AllState & string, T_PathItemName extends keyof AllState[T_PathItemType] & string, T_PathItemProperty extends keyof AllState[T_PathItemType][T_PathItemName] & string>(timeElapsedStatePath: [T_PathItemType, T_PathItemName, T_PathItemProperty] | readonly [T_PathItemType, T_PathItemName, T_PathItemProperty]): void;
export declare function addMoverEffects<T_ItemType extends ItemType, T_Name extends StateNameProperty<T_ItemType>>(store: T_ItemType, moverName: T_Name, moverType?: MoverType, options?: MoverEffectOptions): Record<`${T_Name}GoalChanged`, any> & Record<`${T_Name}StartedMoving`, any>;
export declare function runMover<T_ItemType extends ItemType>(moverType: MoverType, { frameDuration, store, id: itemId, mover: moverName, }: {
    onSlow?: () => any;
    id: string;
    store: T_ItemType;
    frameDuration?: number;
    mover: StateNameProperty<T_ItemType>;
}): void;
