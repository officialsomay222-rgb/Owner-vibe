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
      // ⚡ OPTIMIZATION: Dispatch the specific key to prevent unrelated hooks from re-rendering
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
    } catch (error) {
      Logger.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      try {
        // ⚡ OPTIMIZATION: Ignore events meant for other localStorage keys
        if (e.type === "local-storage" && (e as CustomEvent).detail?.key !== key) {
          return;
        }
        if (e.type === "storage" && (e as StorageEvent).key !== key && (e as StorageEvent).key !== null) {
          return;
        }

        const item = window.localStorage.getItem(key);
        const newValue = item ? JSON.parse(item) : initialValue;

        // ⚡ OPTIMIZATION: Deep equality check to prevent unnecessary re-renders when data hasn't mutated
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue];
}
