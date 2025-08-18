import { useState, useEffect, useCallback } from 'react';
import { UseLocalStorageReturn } from '@/types';

/**
 * Custom hook for managing localStorage with React state
 * @param key - The localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Object containing value, setValue, and removeValue functions
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [key]);

  return {
    value: storedValue,
    setValue,
    removeValue,
  };
}

/**
 * Hook for managing sessionStorage with React state
 * @param key - The sessionStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Object containing value, setValue, and removeValue functions
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): UseLocalStorageReturn<T> {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return {
    value: storedValue,
    setValue,
    removeValue,
  };
}

/**
 * Hook for managing multiple localStorage keys as a single object
 * @param keys - Array of localStorage keys
 * @param initialValues - Object with initial values for each key
 * @returns Object containing values, setValues, and removeValues functions
 */
export function useMultipleLocalStorage<T extends Record<string, any>>(
  keys: (keyof T)[],
  initialValues: T
) {
  const [values, setValues] = useState<T>(() => {
    const result = {} as T;
    
    keys.forEach(key => {
      try {
        if (typeof window === 'undefined') {
          result[key] = initialValues[key];
          return;
        }
        
        const item = window.localStorage.getItem(key as string);
        result[key] = item ? JSON.parse(item) : initialValues[key];
      } catch (error) {
        console.warn(`Error reading localStorage key "${String(key)}":`, error);
        result[key] = initialValues[key];
      }
    });
    
    return result;
  });

  const setMultipleValues = useCallback(
    (newValues: Partial<T>) => {
      setValues(prev => {
        const updated = { ...prev, ...newValues };
        
        // Update localStorage for changed keys
        Object.entries(newValues).forEach(([key, value]) => {
          try {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(key, JSON.stringify(value));
            }
          } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
          }
        });
        
        return updated;
      });
    },
    []
  );

  const removeMultipleValues = useCallback(
    (keysToRemove: (keyof T)[]) => {
      setValues(prev => {
        const updated = { ...prev };
        
        keysToRemove.forEach(key => {
          updated[key] = initialValues[key];
          
          try {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(key as string);
            }
          } catch (error) {
            console.warn(`Error removing localStorage key "${String(key)}":`, error);
          }
        });
        
        return updated;
      });
    },
    [initialValues]
  );

  const removeAllValues = useCallback(() => {
    removeMultipleValues(keys);
  }, [keys, removeMultipleValues]);

  return {
    values,
    setValues: setMultipleValues,
    removeValues: removeMultipleValues,
    removeAllValues,
  };
}

/**
 * Hook for managing localStorage with expiration
 * @param key - The localStorage key
 * @param initialValue - Initial value if key doesn't exist or is expired
 * @param ttl - Time to live in milliseconds
 * @returns Object containing value, setValue, removeValue, and isExpired functions
 */
export function useLocalStorageWithExpiry<T>(
  key: string,
  initialValue: T,
  ttl: number
) {
  const [value, setValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }
      
      const { value: storedValue, expiry } = JSON.parse(item);
      
      if (Date.now() > expiry) {
        window.localStorage.removeItem(key);
        return initialValue;
      }
      
      return storedValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValueWithExpiry = useCallback(
    (newValue: T | ((val: T) => T)) => {
      try {
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
        const expiry = Date.now() + ttl;
        
        setValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            key,
            JSON.stringify({ value: valueToStore, expiry })
          );
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, ttl, value]
  );

  const removeValue = useCallback(() => {
    try {
      setValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  const isExpired = useCallback(() => {
    try {
      if (typeof window === 'undefined') {
        return false;
      }
      
      const item = window.localStorage.getItem(key);
      if (!item) {
        return true;
      }
      
      const { expiry } = JSON.parse(item);
      return Date.now() > expiry;
    } catch (error) {
      console.warn(`Error checking expiry for localStorage key "${key}":`, error);
      return true;
    }
  }, [key]);

  return {
    value,
    setValue: setValueWithExpiry,
    removeValue,
    isExpired,
  };
}