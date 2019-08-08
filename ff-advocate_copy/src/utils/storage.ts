import { AsyncStorageStatic } from "@react-native-community/async-storage";

/**
 * Tries to remove an item from async storage, but doesn't fail if the item doesn't exist.
 */
export const tryRemoveStorageItem = async (
  storage: AsyncStorageStatic,
  key: string
) => {
  try {
    await storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};
