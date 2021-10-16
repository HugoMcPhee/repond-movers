// physics world options
export const maximumFrameTime = 250;
// run physics every physicsTimestep Milliseconds
export const physicsTimestep = 0.5;
export const physicsTimestepInSeconds = physicsTimestep * 0.001;
export const recentSpeedsAmount = 10;
export const defaultPhysics = () => ({
    // spring
    mass: 41.5,
    stiffness: 20,
    damping: 1,
    // slide
    friction: 0.16,
});
export const defaultOptions = {
    moveMode: "spring",
    physicsConfigName: "default",
};
