import { useState, useEffect, useRef, useCallback } from "react";
import { Logger } from "../utils/logger";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Use a ref for initialValue to prevent unnecessary effect triggers
  // when inline objects/arrays are passed as initialValue.
  const initialValueRef = useRef<T>(initialValue);

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValueRef.current;
    } catch (error) {
      Logger.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  });

  // Keep a mutable ref of the latest state to avoid adding `storedValue`
  // as a dependency to `setValue`, preventing infinite render loops.
  const stateRef = useRef<T>(storedValue);
  stateRef.current = storedValue;

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? (value as Function)(stateRef.current) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      // Dispatch custom event with key detail to allow specific listener targeting
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
    } catch (error) {
      Logger.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      // Early return: only re-parse and re-render if the event matches our key
      if (e.type === 'storage') {
        const storageEvent = e as StorageEvent;
        // storageEvent.key is null when localStorage.clear() is called
        if (storageEvent.key !== null && storageEvent.key !== key) return;
      } else if (e.type === 'local-storage') {
        const customEvent = e as CustomEvent;
        if (customEvent.detail?.key && customEvent.detail.key !== key) return;
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
  }, [key]); // removed initialValue from dependencies

  return [storedValue, setValue];
}
