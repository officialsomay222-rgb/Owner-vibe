import { useState, useEffect, useRef } from "react";
import { Logger } from "../utils/logger";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Use useRef for initialValue to prevent unnecessary re-renders when inline objects/arrays are passed
  const initialValueRef = useRef(initialValue);
  // Update ref to ensure we always have the latest fallback without triggering useEffect
  initialValueRef.current = initialValue;

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
      // Dispatch a CustomEvent with the key to prevent unnecessary global re-renders
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
    } catch (error) {
      Logger.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      // Check if the event was triggered by this specific key
      // Native storage events return key = null on localStorage.clear()
      if (e.type === 'storage') {
         const evt = e as StorageEvent;
         if (evt.key !== null && evt.key !== key) return;
      }
      if (e.type === 'local-storage' && (e as CustomEvent).detail?.key !== key) return;

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
  }, [key]); // Removed initialValue from dependencies to prevent infinite re-attachment

  return [storedValue, setValue];
}
