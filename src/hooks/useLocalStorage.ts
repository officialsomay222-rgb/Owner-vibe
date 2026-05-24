import { useState, useEffect, useRef, useCallback } from "react";
import { Logger } from "../utils/logger";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const initialValueRef = useRef(initialValue);

  // Keep track of the latest state to avoid adding storedValue to useCallback deps
  // while still allowing functional updates.
  const stateRef = useRef<T>(initialValueRef.current);

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      const parsed = item ? JSON.parse(item) : initialValueRef.current;
      stateRef.current = parsed;
      return parsed;
    } catch (error) {
      Logger.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueRef.current;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Resolve the value immediately outside of the React state updater
      const valueToStore = value instanceof Function ? value(stateRef.current) : value;

      // Update our ref immediately so subsequent synchronous calls have the correct state
      stateRef.current = valueToStore;

      // Update React state
      setStoredValue(valueToStore);

      // Perform side effects
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
    } catch (error) {
      Logger.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (event: Event | StorageEvent) => {
      if (event instanceof StorageEvent) {
        if (event.key !== null && event.key !== key) return;
      } else if (event instanceof CustomEvent) {
        if (event.detail?.key && event.detail.key !== key) return;
      }

      try {
        const item = window.localStorage.getItem(key);
        const parsed = item ? JSON.parse(item) : initialValueRef.current;
        stateRef.current = parsed;
        setStoredValue(parsed);
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
  }, [key]);

  return [storedValue, setValue];
}
