import { defaultPhysics } from "./consts";
export function normalizeDefinedPhysicsConfig(theConfig) {
    if (theConfig === undefined) {
        return { default: { ...defaultPhysics() } };
    }
    if (typeof theConfig === "string") {
        return undefined;
    }
    if (theConfig.damping !== undefined ||
        theConfig.friction !== undefined ||
        theConfig.mass !== undefined ||
        theConfig.stiffness !== undefined) {
        // is a single config
        return { default: { ...defaultPhysics(), ...theConfig } };
    }
    else {
        const normalizedMultiConfig = {};
        const multiConfigKeys = Object.keys(theConfig);
        multiConfigKeys.forEach((loopedKey) => {
            normalizedMultiConfig[loopedKey] = {
                ...defaultPhysics(),
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
        var _a, _b, _c, _d;
        const newStateProps = {};
        newStateProps[newName] = (_a = initialState === null || initialState === void 0 ? void 0 : initialState.value) !== null && _a !== void 0 ? _a : getDefaultValue();
        newStateProps[`${newName}Goal`] =
            (_b = initialState === null || initialState === void 0 ? void 0 : initialState.valueGoal) !== null && _b !== void 0 ? _b : getDefaultValue();
        newStateProps[`${newName}IsMoving`] = (_c = initialState === null || initialState === void 0 ? void 0 : initialState.isMoving) !== null && _c !== void 0 ? _c : false;
        newStateProps[`${newName}MoveMode`] =
            (_d = initialState === null || initialState === void 0 ? void 0 : initialState.moveMode) !== null && _d !== void 0 ? _d : "spring";
        if (initialState === null || initialState === void 0 ? void 0 : initialState.moveConfigName) {
            newStateProps[`${newName}MoveConfigName`] = initialState === null || initialState === void 0 ? void 0 : initialState.moveConfigName;
        }
        // NOTE moveConfigs are usually in refs now? so might not be used
        if (initialState === null || initialState === void 0 ? void 0 : initialState.moveConfigs) {
            newStateProps[`${newName}MoveConfigs`] = initialState === null || initialState === void 0 ? void 0 : initialState.moveConfigs;
        }
        return newStateProps;
    };
}
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
