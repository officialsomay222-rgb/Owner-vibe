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
    const handleStorageChange = (e: Event) => {
      // Custom event from same window
      if (e.type === 'local-storage') {
        const customEvent = e as CustomEvent;
        if (customEvent.detail?.key && customEvent.detail.key !== key) {
          return; // Ignore if not our key
        }
      }

      // Standard storage event from other tabs
      if (e.type === 'storage') {
        const storageEvent = e as StorageEvent;
        if (storageEvent.key && storageEvent.key !== key) {
          return; // Ignore if not our key
        }
      }

      try {
        const item = window.localStorage.getItem(key);
        const newValue = item ? JSON.parse(item) : initialValue;

        // Deep equality check to prevent re-renders for identical objects
        setStoredValue(prev => {
          if (JSON.stringify(prev) === JSON.stringify(newValue)) {
            return prev;
          }
          return newValue;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue];
}
