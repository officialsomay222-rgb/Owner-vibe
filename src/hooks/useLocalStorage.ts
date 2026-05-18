import { useState, useEffect, useRef } from "react";
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

  const initialValueRef = useRef(initialValue);
  // Keep the ref updated in case the initialValue changes dynamically
  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    const handleStorageChange = (event: Event | StorageEvent) => {
      // For local CustomEvents, filter by key
      if (event.type === 'local-storage' && (event as CustomEvent).detail?.key !== key) {
        return;
      }

      // For StorageEvents (cross-tab), filter by key, BUT allow event.key === null
      // which happens when localStorage.clear() is called.
      if (event.type === 'storage') {
        const storageEvent = event as StorageEvent;
        if (storageEvent.key !== key && storageEvent.key !== null) {
          return;
        }
      }

      try {
        const item = window.localStorage.getItem(key);
        const newValue = item ? JSON.parse(item) : initialValueRef.current;

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

    window.addEventListener("local-storage", handleStorageChange as EventListener);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("local-storage", handleStorageChange as EventListener);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}
