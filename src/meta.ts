import { getRefs, getState } from "repond";

type GetState = typeof getState;
type GetRefs = typeof getRefs;

// type ItemType = keyof ReturnType<GetState> & keyof ReturnType<GetRefs>;
// type ItemState<T_ItemType extends ItemType> = ReturnType<GetState>[T_ItemType][keyof ReturnType<GetState>[T_ItemType]];

export const meta = {
  timeElapsedStatePath: undefined as string[] | undefined,
};
