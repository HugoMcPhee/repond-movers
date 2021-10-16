import { makeMover1dUtils } from "./mover";
import { makeMover2dUtils } from "./mover2d";
import { makeMover3dUtils } from "./mover3d";
import { makeMoverMultiUtils } from "./moverMulti";
export { moverState, moverRefs } from "./mover";
export { mover2dState, mover2dRefs } from "./mover2d";
export { mover3dState, mover3dRefs } from "./mover3d";
export { moverMultiRefs } from "./moverMulti";
export { makeMoverStateMaker } from "./utils";
export function makeRunMovers(conceptoFuncs) {
    const { runMover } = makeMover1dUtils(conceptoFuncs);
    const { runMover2d } = makeMover2dUtils(conceptoFuncs);
    const { runMover3d } = makeMover3dUtils(conceptoFuncs);
    const { runMoverMulti } = makeMoverMultiUtils(conceptoFuncs);
    return {
        runMover,
        runMover2d,
        runMover3d,
        runMoverMulti,
    };
}
