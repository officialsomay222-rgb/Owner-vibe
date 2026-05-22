import { useState, useEffect, useRef } from "react";
import { Logger } from "../utils/logger";

/**
 * ⚡ OPTIMIZATION: useLocalStorage performance fix
 *
 * 1. Wrapped initialValue in a useRef to prevent unnecessary re-attachments
 *    of event listeners when inline arrays/objects (like `[]`) are passed.
 * 2. Switched from a generic "local-storage" Event to a CustomEvent with a
 *    payload `{ detail: { key } }`.
 * 3. Added strict key filtering to both local and cross-tab storage events
 *    so components only re-parse JSON and re-render when THEIR specific key changes.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
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
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
    } catch (error) {
      Logger.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: Event | StorageEvent) => {
      // Handle cross-tab sync (StorageEvent)
      if (e instanceof StorageEvent) {
        // storageEvent.key is null when localStorage.clear() is called
        if (e.key !== null && e.key !== key) return;
      }
      // Handle local app sync (CustomEvent)
      else if (e instanceof CustomEvent) {
        if (e.detail?.key !== key) return;
      }

      try {
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
