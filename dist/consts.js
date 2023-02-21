// physics world options
export const maximumFrameTime = 250;
// run physics every physicsTimestep Milliseconds
export const physicsTimestep = 0.5;
export const physicsTimestepInSeconds = physicsTimestep * 0.001;
export const recentSpeedsAmount = 10;
const defaultStopSpeedByMode = {
    "1d": 0.01,
    "2d": 1,
    "3d": 0.5,
    multi: 1,
};
export const defaultPhysics = (mode) => ({
    // spring
    mass: 41.5,
    stiffness: 20,
    damping: 1,
    stopSpeed: defaultStopSpeedByMode[mode],
    // slide
    friction: 0.16,
});
export const defaultOptions = {
    moveMode: "spring",
    physicsConfigName: "default",
};
