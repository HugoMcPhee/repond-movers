import { OnePhysicsConfig, MoveMode, MoverMode } from "./types";
export declare const maximumFrameTime = 250;
export declare const physicsTimestep = 0.5;
export declare const physicsTimestepInSeconds: number;
export declare const recentSpeedsAmount = 10;
export declare const defaultPhysics: (mode: MoverMode) => OnePhysicsConfig;
export declare const defaultOptions: {
    moveMode: MoveMode;
    physicsConfigName: string;
};
