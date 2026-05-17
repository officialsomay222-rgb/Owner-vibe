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

      // Deep equality check to prevent unnecessary state updates
      const newValueStr = JSON.stringify(valueToStore);
      if (JSON.stringify(storedValue) !== newValueStr) {
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, newValueStr);
        // Dispatch CustomEvent with key detail to allow listeners to filter
        window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
      }
    } catch (error) {
      Logger.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: Event | CustomEvent) => {
      try {
        // Only process the event if it's a native storage event or our custom event for this specific key
        if (e.type === "local-storage" && 'detail' in e && e.detail && e.detail.key !== key) {
           return;
        }

        const item = window.localStorage.getItem(key);
        const parsedItem = item ? JSON.parse(item) : initialValue;

        // Use functional state update with deep equality check
        setStoredValue((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(parsedItem)) {
                return parsedItem;
            }
            return prev;
        });
      } catch (error) {
        Logger.warn(`Error syncing localStorage key "${key}":`, error);
      }
    };

    window.addEventListener("local-storage", handleStorageChange as EventListener);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("local-storage", handleStorageChange as EventListener);
      window.removeEventListener("storage", handleStorageChange);
    };
    // initialValue omitted from deps to avoid re-binding listeners endlessly
    // when components pass inline objects/arrays (e.g. useLocalStorage('key', []))
  }, [key]);

  return [storedValue, setValue];
}
