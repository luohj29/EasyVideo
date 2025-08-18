import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse, ApiError } from '@/types';

/**
 * Configuration options for API hooks
 */
interface UseApiOptions {
  immediate?: boolean;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
}

/**
 * Return type for useApi hook
 */
interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
  cancel: () => void;
}

/**
 * Custom hook for API calls with loading, error, and retry logic
 * @param apiFunction - The API function to call
 * @param options - Configuration options
 * @returns Object containing data, loading state, error, and control functions
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const {
    immediate = false,
    retries = 0,
    retryDelay = 1000,
    timeout = 30000,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setData(null);
    setError(null);
    retryCountRef.current = 0;
  }, [cancel]);

  const executeWithRetry = useCallback(
    async (...args: any[]): Promise<T> => {
      return new Promise((resolve, reject) => {
        const attemptRequest = async (attemptCount: number) => {
          try {
            // Cancel previous request
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
            }

            // Create new abort controller
            abortControllerRef.current = new AbortController();
            
            setLoading(true);
            setError(null);

            // Set timeout
            const timeoutPromise = new Promise<never>((_, timeoutReject) => {
              timeoutRef.current = setTimeout(() => {
                timeoutReject(new Error('Request timeout'));
              }, timeout);
            });

            // Race between API call and timeout
            const response = await Promise.race([
              apiFunction(...args),
              timeoutPromise,
            ]);

            // Clear timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }

            if (response.success) {
              setData(response.data);
              setLoading(false);
              retryCountRef.current = 0;
              
              if (onSuccess) {
                onSuccess(response.data);
              }
              
              resolve(response.data);
            } else {
              throw new Error(response.message || 'API request failed');
            }
          } catch (err) {
            // Clear timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }

            const apiError: ApiError = {
              message: err instanceof Error ? err.message : 'Unknown error',
              code: 'API_ERROR',
              details: err,
            };

            // Check if we should retry
            if (attemptCount < retries && !abortControllerRef.current?.signal.aborted) {
              setTimeout(() => {
                attemptRequest(attemptCount + 1);
              }, retryDelay * Math.pow(2, attemptCount)); // Exponential backoff
            } else {
              setError(apiError);
              setLoading(false);
              retryCountRef.current = 0;
              
              if (onError) {
                onError(apiError);
              }
              
              reject(apiError);
            }
          }
        };

        attemptRequest(0);
      });
    },
    [apiFunction, retries, retryDelay, timeout, onSuccess, onError]
  );

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      return executeWithRetry(...args);
    },
    [executeWithRetry]
  );

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    cancel,
  };
}

/**
 * Custom hook for paginated API calls
 * @param apiFunction - The paginated API function
 * @param pageSize - Number of items per page
 * @param options - Configuration options
 * @returns Object containing paginated data and controls
 */
export function usePaginatedApi<T>(
  apiFunction: (page: number, pageSize: number, ...args: any[]) => Promise<ApiResponse<{ items: T[]; total: number; page: number; pageSize: number }>>,
  pageSize = 10,
  options: UseApiOptions = {}
) {
  const [allData, setAllData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const {
    data,
    loading,
    error,
    execute: executeBase,
    reset: resetBase,
    cancel,
  } = useApi(apiFunction, options);

  const loadPage = useCallback(
    async (page: number, append = false, ...args: any[]) => {
      try {
        if (append) {
          setLoadingMore(true);
        }
        
        const result = await executeBase(page, pageSize, ...args);
        
        if (result) {
          const { items, total, page: responsePage } = result;
          
          if (append) {
            setAllData(prev => [...prev, ...items]);
          } else {
            setAllData(items);
          }
          
          setTotalItems(total);
          setCurrentPage(responsePage);
          setHasMore(items.length === pageSize && (page * pageSize) < total);
        }
      } finally {
        setLoadingMore(false);
      }
    },
    [executeBase, pageSize]
  );

  const loadMore = useCallback(
    async (...args: any[]) => {
      if (!loadingMore && hasMore) {
        await loadPage(currentPage + 1, true, ...args);
      }
    },
    [loadPage, currentPage, loadingMore, hasMore]
  );

  const refresh = useCallback(
    async (...args: any[]) => {
      setCurrentPage(1);
      await loadPage(1, false, ...args);
    },
    [loadPage]
  );

  const reset = useCallback(() => {
    resetBase();
    setAllData([]);
    setCurrentPage(1);
    setTotalItems(0);
    setHasMore(true);
    setLoadingMore(false);
  }, [resetBase]);

  const goToPage = useCallback(
    async (page: number, ...args: any[]) => {
      if (page >= 1 && page <= Math.ceil(totalItems / pageSize)) {
        await loadPage(page, false, ...args);
      }
    },
    [loadPage, totalItems, pageSize]
  );

  return {
    data: allData,
    loading,
    loadingMore,
    error,
    currentPage,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
    hasMore,
    loadPage,
    loadMore,
    refresh,
    reset,
    cancel,
    goToPage,
  };
}

/**
 * Custom hook for infinite scroll API calls
 * @param apiFunction - The API function for infinite scroll
 * @param pageSize - Number of items per page
 * @param options - Configuration options
 * @returns Object containing infinite scroll data and controls
 */
export function useInfiniteApi<T>(
  apiFunction: (cursor?: string, pageSize?: number, ...args: any[]) => Promise<ApiResponse<{ items: T[]; nextCursor?: string; hasMore: boolean }>>,
  pageSize = 10,
  options: UseApiOptions = {}
) {
  const [allData, setAllData] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const {
    data,
    loading,
    error,
    execute: executeBase,
    reset: resetBase,
    cancel,
  } = useApi(apiFunction, options);

  const loadMore = useCallback(
    async (...args: any[]) => {
      if (loadingMore || !hasMore) return;

      try {
        setLoadingMore(true);
        
        const result = await executeBase(nextCursor, pageSize, ...args);
        
        if (result) {
          const { items, nextCursor: newCursor, hasMore: moreAvailable } = result;
          
          setAllData(prev => [...prev, ...items]);
          setNextCursor(newCursor);
          setHasMore(moreAvailable);
        }
      } finally {
        setLoadingMore(false);
      }
    },
    [executeBase, nextCursor, pageSize, loadingMore, hasMore]
  );

  const refresh = useCallback(
    async (...args: any[]) => {
      setAllData([]);
      setNextCursor(undefined);
      setHasMore(true);
      
      try {
        const result = await executeBase(undefined, pageSize, ...args);
        
        if (result) {
          const { items, nextCursor: newCursor, hasMore: moreAvailable } = result;
          
          setAllData(items);
          setNextCursor(newCursor);
          setHasMore(moreAvailable);
        }
      } catch (err) {
        // Error is handled by the base hook
      }
    },
    [executeBase, pageSize]
  );

  const reset = useCallback(() => {
    resetBase();
    setAllData([]);
    setNextCursor(undefined);
    setHasMore(true);
    setLoadingMore(false);
  }, [resetBase]);

  return {
    data: allData,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    reset,
    cancel,
  };
}

/**
 * Custom hook for optimistic updates
 * @param apiFunction - The API function to call
 * @param options - Configuration options
 * @returns Object containing optimistic update controls
 */
export function useOptimisticApi<T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const {
    data: actualData,
    loading,
    error,
    execute: executeBase,
    reset: resetBase,
    cancel,
  } = useApi(apiFunction, {
    ...options,
    onSuccess: (data) => {
      setIsOptimistic(false);
      setOptimisticData(null);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      setIsOptimistic(false);
      setOptimisticData(null);
      options.onError?.(error);
    },
  });

  const executeOptimistic = useCallback(
    async (optimisticValue: T, ...args: any[]) => {
      setOptimisticData(optimisticValue);
      setIsOptimistic(true);
      
      try {
        const result = await executeBase(...args);
        return result;
      } catch (err) {
        // Error handling is done in the onError callback
        throw err;
      }
    },
    [executeBase]
  );

  const reset = useCallback(() => {
    resetBase();
    setOptimisticData(null);
    setIsOptimistic(false);
  }, [resetBase]);

  return {
    data: isOptimistic ? optimisticData : actualData,
    loading,
    error,
    isOptimistic,
    execute: executeOptimistic,
    reset,
    cancel,
  };
}

/**
 * Custom hook for parallel API calls
 * @param apiFunctions - Array of API functions to call in parallel
 * @param options - Configuration options
 * @returns Object containing parallel execution results
 */
export function useParallelApi<T extends any[]>(
  apiFunctions: { [K in keyof T]: (...args: any[]) => Promise<ApiResponse<T[K]>> },
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<{ [K in keyof T]: T[K] | null }>(
    apiFunctions.map(() => null) as any
  );
  const [loading, setLoading] = useState<{ [K in keyof T]: boolean }>(
    apiFunctions.map(() => false) as any
  );
  const [errors, setErrors] = useState<{ [K in keyof T]: ApiError | null }>(
    apiFunctions.map(() => null) as any
  );
  
  const abortControllersRef = useRef<AbortController[]>([]);

  const execute = useCallback(
    async (...argsArray: any[][]) => {
      // Cancel previous requests
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current = [];

      // Initialize loading states
      setLoading(apiFunctions.map(() => true) as any);
      setErrors(apiFunctions.map(() => null) as any);

      const promises = apiFunctions.map(async (apiFunction, index) => {
        try {
          const controller = new AbortController();
          abortControllersRef.current[index] = controller;

          const args = argsArray[index] || [];
          const response = await apiFunction(...args);

          if (response.success) {
            setData(prev => {
              const newData = [...prev];
              newData[index] = response.data;
              return newData as any;
            });
          } else {
            throw new Error(response.message || 'API request failed');
          }

          return response.data;
        } catch (err) {
          const apiError: ApiError = {
            message: err instanceof Error ? err.message : 'Unknown error',
            code: 'API_ERROR',
            details: err,
          };

          setErrors(prev => {
            const newErrors = [...prev];
            newErrors[index] = apiError;
            return newErrors as any;
          });

          throw apiError;
        } finally {
          setLoading(prev => {
            const newLoading = [...prev];
            newLoading[index] = false;
            return newLoading as any;
          });
        }
      });

      try {
        const results = await Promise.allSettled(promises);
        return results.map(result => 
          result.status === 'fulfilled' ? result.value : null
        ) as T;
      } catch (err) {
        // Individual errors are already handled above
        throw err;
      }
    },
    [apiFunctions]
  );

  const cancel = useCallback(() => {
    abortControllersRef.current.forEach(controller => controller.abort());
    setLoading(apiFunctions.map(() => false) as any);
  }, [apiFunctions]);

  const reset = useCallback(() => {
    cancel();
    setData(apiFunctions.map(() => null) as any);
    setErrors(apiFunctions.map(() => null) as any);
  }, [cancel, apiFunctions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    data,
    loading,
    errors,
    execute,
    reset,
    cancel,
    isLoading: loading.some(Boolean),
    hasErrors: errors.some(Boolean),
  };
}