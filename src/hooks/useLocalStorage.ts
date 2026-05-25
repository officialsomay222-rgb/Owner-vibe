import { useState, useEffect, useRef, useCallback } from "react";
import { Logger } from "../utils/logger";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Wrap initialValue in a ref to prevent unnecessary useEffect triggers
  // when inline arrays/objects are passed (e.g., useLocalStorage('key', []))
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

  // Mutable stateRef synced with current state to prevent stale closures
  // and infinite dependency loops in callbacks without adding state itself to dependencies
  const stateRef = useRef(storedValue);
  // Sync on every render just in case it updates elsewhere
  stateRef.current = storedValue;

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(stateRef.current) : value;
      setStoredValue(valueToStore);
      stateRef.current = valueToStore;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      // Dispatch custom event with detail.key payload
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
    } catch (error) {
      Logger.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (event: Event | StorageEvent) => {
      // Handle cross-tab StorageEvent
      if (event instanceof StorageEvent) {
        // null key happens when localStorage.clear() is called
        if (event.key !== null && event.key !== key) return;
      }
      // Handle same-tab CustomEvent
      else {
        const customEvent = event as CustomEvent;
        // Only re-parse and re-render when the specific key changes
        if (customEvent.detail && customEvent.detail.key !== key) return;
      }

      try {
        const item = window.localStorage.getItem(key);
        const newValue = item ? JSON.parse(item) : initialValueRef.current;
        setStoredValue(newValue);
        stateRef.current = newValue;
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
  }, [key]);

  return [storedValue, setValue];
}
