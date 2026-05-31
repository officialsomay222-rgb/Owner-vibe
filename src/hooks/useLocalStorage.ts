import { useState, useEffect, useRef } from "react";
import { Logger } from "../utils/logger";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // ⚡ OPTIMIZATION: Wrap initialValue in a useRef to prevent unnecessary useEffect dependency triggers
  // when inline objects/arrays (e.g., `[]`) are passed as initialValue.
  const initialValueRef = useRef(initialValue);

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValueRef.current;
    } catch (error) {
      Logger.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      // ⚡ OPTIMIZATION: Dispatch CustomEvent with the key payload to allow targeted updates
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
    } catch (error) {
      Logger.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (event: Event | StorageEvent) => {
      try {
        // ⚡ OPTIMIZATION: Filter out events for unrelated keys to avoid parsing and rendering
        // Handle standard StorageEvent (cross-tab)
        if ('key' in event) {
          // If key is null, localStorage was cleared, so we shouldn't return
          if (event.key !== null && event.key !== key) return;
        }
        // Handle CustomEvent (same-tab)
        else if ('detail' in event) {
          if ((event as CustomEvent).detail?.key !== key) return;
        }

        const item = window.localStorage.getItem(key);
        setStoredValue(item ? JSON.parse(item) : initialValueRef.current);
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
  }, [key]);

  return [storedValue, setValue];
}
