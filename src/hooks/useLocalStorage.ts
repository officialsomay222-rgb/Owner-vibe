import { useState, useEffect } from "react";
import { Logger } from "../utils/logger";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      Logger.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // ⚡ Bolt Optimization: Only update state if the value has actually changed
      if (JSON.stringify(storedValue) !== JSON.stringify(valueToStore)) {
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // ⚡ Bolt Optimization: Emit a CustomEvent with a specific key payload
        window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
      }
    } catch (error) {
      Logger.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: Event | CustomEvent) => {
      // ⚡ Bolt Optimization: Only process events for this specific key
      if ('detail' in e && e.detail?.key && e.detail.key !== key) {
        return;
      }
      if (e.type === 'storage' && (e as StorageEvent).key && (e as StorageEvent).key !== key) {
        return;
      }

      try {
        const item = window.localStorage.getItem(key);
        const newValue = item ? JSON.parse(item) : initialValue;

        // ⚡ Bolt Optimization: Deep equality check to prevent unnecessary re-renders
        setStoredValue(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newValue)) {
            return newValue;
          }
          return prev;
        });
      } catch (error) {
        Logger.warn(`Error syncing localStorage key "${key}":`, error);
      }
    };

    window.addEventListener("local-storage", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("local-storage", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
    // ⚡ Bolt Optimization: Removed initialValue from dependencies to prevent infinite re-renders when inline arrays/objects are passed
  }, [key]);

  return [storedValue, setValue];
}
