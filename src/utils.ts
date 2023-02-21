import { defaultPhysics } from "./consts";
import {
  DefinedPhysicsConfig,
  MoveMode,
  MoverMode,
  PhysicsConfig,
  PhysicsOptions,
} from "./types";

export function normalizeDefinedPhysicsConfig(
  theConfig: PhysicsConfig,
  mode: MoverMode
) {
  if (theConfig === undefined) {
    return { default: { ...defaultPhysics(mode) } };
  }
  if (typeof theConfig === "string") {
    return undefined;
  }

  if (
    theConfig.damping !== undefined ||
    theConfig.friction !== undefined ||
    theConfig.mass !== undefined ||
    theConfig.stiffness !== undefined ||
    theConfig.stopSpeed !== undefined
  ) {
    // is a single config
    return { default: { ...defaultPhysics(mode), ...theConfig } };
  } else {
    const normalizedMultiConfig: DefinedPhysicsConfig = {};

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

export type PropTypesByWord<T_ValueType extends any> = {
  Goal: T_ValueType;
  IsMoving: boolean;
  MoveMode: MoveMode;
};

export type NewProps<T_Name extends string, T_ValueType extends any> = {
  [K_PropName in keyof PropTypesByWord<T_ValueType> as `${T_Name}${K_PropName}`]: PropTypesByWord<T_ValueType>[K_PropName];
};

// could make util makeMakerMoverState, that takes a initialValue function (and they type and initial values can be got from that)
export function makeMoverStateMaker<T_ValueType>(
  getDefaultValue: () => T_ValueType
) {
  type MoverInitialState<
    T_ValueType extends any,
    T_MoveConfigName extends string
  > = {
    value?: T_ValueType;
    valueGoal?: T_ValueType;
    isMoving?: boolean;
    moveConfigName?: T_MoveConfigName; // ideally this is inferred
    moveMode?: MoveMode;
    moveConfigs?: Record<T_MoveConfigName, PhysicsOptions>;
  };

  return function moverState<
    T_Name extends string,
    T_PhysicsNames extends string,
    T_InitialState extends MoverInitialState<T_ValueType, T_PhysicsNames>
  >(newName: T_Name, initialState?: T_InitialState) {
    type MoveConfigNameProp = T_InitialState["moveConfigName"] extends undefined
      ? {}
      : Record<`${T_Name}MoveConfigName`, T_PhysicsNames>;

    type MoveConfigsProp = T_InitialState["moveConfigs"] extends undefined
      ? {}
      : Record<`${T_Name}MoveConfigs`, Record<T_PhysicsNames, PhysicsOptions>>;

    type NewPropsAndValue = Record<T_Name, T_ValueType> &
      NewProps<T_Name, T_ValueType> &
      MoveConfigNameProp &
      MoveConfigsProp;

    const newStateProps = {} as Record<any, any>;

    newStateProps[newName] = initialState?.value ?? getDefaultValue();
    newStateProps[`${newName}Goal`] =
      initialState?.valueGoal ?? getDefaultValue();
    newStateProps[`${newName}IsMoving`] = initialState?.isMoving ?? false;
    newStateProps[`${newName}MoveMode`] =
      initialState?.moveMode ?? ("spring" as MoveMode);

    if (initialState?.moveConfigName) {
      newStateProps[`${newName}MoveConfigName`] = initialState?.moveConfigName;
    }
    // NOTE moveConfigs are usually in refs now? so might not be used
    if (initialState?.moveConfigs) {
      newStateProps[`${newName}MoveConfigs`] = initialState?.moveConfigs;
    }

    return newStateProps as NewPropsAndValue;
  };
}

export function makeStateNames<T_Name extends string>(newName: T_Name) {
  return {
    value: newName as T_Name,
    valueGoal: `${newName}Goal` as `${T_Name}Goal`,
    isMoving: `${newName}IsMoving` as `${T_Name}IsMoving`,
    moveMode: `${newName}MoveMode` as `${T_Name}MoveMode`,
    physicsConfigName: `${newName}MoveConfigName` as
      | `${T_Name}MoveConfigName`
      | undefined,
    physicsConfigs: `${newName}MoveConfigs` as
      | `${T_Name}MoveConfigs`
      | undefined,
  };
}
