import { defaultPhysics } from "./consts";
export function normalizeDefinedPhysicsConfig(theConfig, mode) {
    if (theConfig === undefined) {
        return { default: { ...defaultPhysics(mode) } };
    }
    if (typeof theConfig === "string") {
        return undefined;
    }
    if (theConfig.damping !== undefined ||
        theConfig.friction !== undefined ||
        theConfig.mass !== undefined ||
        theConfig.stiffness !== undefined ||
        theConfig.stopSpeed !== undefined) {
        // is a single config
        return { default: { ...defaultPhysics(mode), ...theConfig } };
    }
    else {
        const normalizedMultiConfig = {};
        const multiConfigKeys = Object.keys(theConfig);
        multiConfigKeys.forEach((loopedKey) => {
            normalizedMultiConfig[loopedKey] = {
                ...defaultPhysics(mode),
                ...theConfig[loopedKey],
            };
        });
        return normalizedMultiConfig;
    }
    //   return { default: defaultPhysics() };
}
// could make util makeMakerMoverState, that takes a initialValue function (and they type and initial values can be got from that)
export function makeMoverStateMaker(getDefaultValue) {
    return function moverState(newName, initialState) {
        const newStateProps = {};
        newStateProps[newName] = initialState?.value ?? getDefaultValue();
        newStateProps[`${newName}Goal`] = initialState?.valueGoal ?? getDefaultValue();
        newStateProps[`${newName}IsMoving`] = initialState?.isMoving ?? false;
        newStateProps[`${newName}MoveMode`] = initialState?.moveMode ?? "spring";
        if (initialState?.moveConfigName) {
            newStateProps[`${newName}MoveConfigName`] = initialState?.moveConfigName;
        }
        // NOTE moveConfigs are usually in refs now? so might not be used
        if (initialState?.moveConfigs) {
            newStateProps[`${newName}MoveConfigs`] = initialState?.moveConfigs;
        }
        return newStateProps;
    };
}
// makes the item state prop names for a mover
export function makeStateNames(newName) {
    return {
        value: newName,
        valueGoal: `${newName}Goal`,
        isMoving: `${newName}IsMoving`,
        moveMode: `${newName}MoveMode`,
        physicsConfigName: `${newName}MoveConfigName`,
        physicsConfigs: `${newName}MoveConfigs`,
    };
}
