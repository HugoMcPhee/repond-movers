export const meta = {
  // Map of time key names to their state paths [storeName, itemId, propertyName]
  timePaths: {} as Record<string, [string, string, string]>,

  // Map of mover identifiers to their assigned time keys
  // Key format: "storeName.moverName"
  moverTimeKeys: {} as Record<string, string>,

  // DEPRECATED: Keep for backward compatibility
  timeElapsedStatePath: undefined as string[] | undefined,
};
