import { useState, useCallback, useRef, useEffect } from 'react';
import { UseAsyncReturn } from '@/types';

/**
 * Custom hook for handling async operations with loading, error, and data states
 * @param asyncFunction - The async function to execute
 * @param immediate - Whether to execute the function immediately on mount
 * @returns Object containing data, loading, error states and execute function
 */
export function useAsync<T = any, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate = false
): UseAsyncReturn<T> & { execute: (...args: Args) => Promise<T> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T> => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await asyncFunction(...args);
        
        if (mountedRef.current) {
          setData(result);
        }
        
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        
        if (mountedRef.current) {
          setError(errorMessage);
          setData(null);
        }
        
        throw err;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * Hook for handling async operations with automatic retry
 * @param asyncFunction - The async function to execute
 * @param maxRetries - Maximum number of retry attempts
 * @param retryDelay - Delay between retries in milliseconds
 * @returns Object containing data, loading, error states, execute function, and retry info
 */
export function useAsyncWithRetry<T = any, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  maxRetries = 3,
  retryDelay = 1000
) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const asyncState = useAsync(asyncFunction);

  const executeWithRetry = useCallback(
    async (...args: Args): Promise<T> => {
      let lastError: Error;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          setRetryCount(attempt);
          setIsRetrying(attempt > 0);
          
          const result = await asyncState.execute(...args);
          setIsRetrying(false);
          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error');
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          }
        }
      }
      
      setIsRetrying(false);
      throw lastError!;
    },
    [asyncState.execute, maxRetries, retryDelay]
  );

  const reset = useCallback(() => {
    asyncState.reset();
    setRetryCount(0);
    setIsRetrying(false);
  }, [asyncState.reset]);

  return {
    ...asyncState,
    execute: executeWithRetry,
    reset,
    retryCount,
    isRetrying,
    maxRetries,
  };
}

/**
 * Hook for handling multiple async operations in parallel
 * @param asyncFunctions - Array of async functions to execute
 * @returns Object containing results, loading, error states and execute function
 */
export function useAsyncParallel<T = any>(
  asyncFunctions: (() => Promise<T>)[]
) {
  const [results, setResults] = useState<(T | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<(string | null)[]>([]);
  const [completed, setCompleted] = useState<boolean[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setResults(new Array(asyncFunctions.length).fill(null));
    setErrors(new Array(asyncFunctions.length).fill(null));
    setCompleted(new Array(asyncFunctions.length).fill(false));

    try {
      const promises = asyncFunctions.map(async (fn, index) => {
        try {
          const result = await fn();
          
          if (mountedRef.current) {
            setResults(prev => {
              const newResults = [...prev];
              newResults[index] = result;
              return newResults;
            });
            setCompleted(prev => {
              const newCompleted = [...prev];
              newCompleted[index] = true;
              return newCompleted;
            });
          }
          
          return result;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';
          
          if (mountedRef.current) {
            setErrors(prev => {
              const newErrors = [...prev];
              newErrors[index] = errorMessage;
              return newErrors;
            });
            setCompleted(prev => {
              const newCompleted = [...prev];
              newCompleted[index] = true;
              return newCompleted;
            });
          }
          
          throw err;
        }
      });

      await Promise.allSettled(promises);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [asyncFunctions]);

  const reset = useCallback(() => {
    setResults([]);
    setErrors([]);
    setCompleted([]);
    setLoading(false);
  }, []);

  const allCompleted = completed.length > 0 && completed.every(Boolean);
  const hasErrors = errors.some(error => error !== null);
  const successCount = errors.filter(error => error === null).length;

  return {
    results,
    loading,
    errors,
    completed,
    allCompleted,
    hasErrors,
    successCount,
    execute,
    reset,
  };
}