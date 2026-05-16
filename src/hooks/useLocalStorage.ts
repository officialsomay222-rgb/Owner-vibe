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
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
    } catch (error) {
      Logger.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (event: Event | CustomEvent | StorageEvent) => {
      // ⚡ OPTIMIZATION: Ignore updates for other keys to prevent unnecessary re-renders
      if (event.type === 'local-storage') {
        const customEvent = event as CustomEvent;
        if (customEvent.detail && customEvent.detail.key !== key) {
          return;
        }
      } else if (event.type === 'storage') {
        const storageEvent = event as StorageEvent;
        if (storageEvent.key && storageEvent.key !== key) {
          return;
        }
      }

      try {
        const item = window.localStorage.getItem(key);
        // ⚡ OPTIMIZATION: Compare new value with storedValue to prevent unnecessary re-renders
        const newValue = item ? JSON.parse(item) : initialValue;
        setStoredValue((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(newValue)) {
                return prev;
            }
            return newValue;
        });
      } catch (error) {
        Logger.warn(`Error syncing localStorage key "${key}":`, error);
      }
    };

    window.addEventListener("local-storage", handleStorageChange as EventListener);
    window.addEventListener("storage", handleStorageChange as EventListener);
    return () => {
      window.removeEventListener("local-storage", handleStorageChange as EventListener);
      window.removeEventListener("storage", handleStorageChange as EventListener);
    };
  // ⚡ OPTIMIZATION: We remove initialValue from the dependency array because passing inline arrays/objects
  // like useLocalStorage('key', []) causes the effect to re-run on every render.
  }, [key]);

  return [storedValue, setValue];
}
