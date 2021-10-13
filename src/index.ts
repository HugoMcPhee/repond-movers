import { makeMover1dUtils } from "./mover";
import { makeMover2dUtils } from "./mover2d";
import { makeMover3dUtils } from "./mover3d";
import { makeMoverMultiUtils } from "./moverMulti";
export { moverState, moverRefs } from "./mover";
export { mover2dState, mover2dRefs } from "./mover2d";
export { mover3dState, mover3dRefs } from "./mover3d";
export { moverMultiRefs } from "./moverMulti";
export { makeMoverStateMaker } from "./utils";

export function makeRunMovers<
  T_GetState extends () => any,
  T_GetRefs extends () => any,
  T_SetState extends (
    newState: Record<any, any> | ((state: any) => any),
    callback?: (nextFrameDuration: number) => any
  ) => any
>(conceptoFuncs: {
  getState: T_GetState;
  getRefs: T_GetRefs;
  setState: T_SetState;
}) {
  const { runMover } = makeMover1dUtils<T_GetState, T_GetRefs, T_SetState>(
    conceptoFuncs
  );
  const { runMover2d } = makeMover2dUtils<T_GetState, T_GetRefs, T_SetState>(
    conceptoFuncs
  );
  const { runMover3d } = makeMover3dUtils<T_GetState, T_GetRefs, T_SetState>(
    conceptoFuncs
  );

  const { runMoverMulti } = makeMoverMultiUtils<
    T_GetState,
    T_GetRefs,
    T_SetState
  >(conceptoFuncs);

  return {
    runMover,
    runMover2d,
    runMover3d,
    runMoverMulti,
  };
}
