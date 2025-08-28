import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface UseOptimizedDataLoadingOptions {
  cacheKey: string;
  cacheDuration?: number; // in milliseconds
  retryAttempts?: number;
  retryDelay?: number;
  staleWhileRevalidate?: boolean;
}

interface UseOptimizedDataLoadingReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  invalidateCache: () => void;
}

// Simple in-memory cache
const cache = new Map<string, CacheEntry<any>>();

export const useOptimizedDataLoading = <T>(
  fetchFunction: () => Promise<T>,
  options: UseOptimizedDataLoadingOptions
): UseOptimizedDataLoadingReturn<T> => {
  const {
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    retryAttempts = 3,
    retryDelay = 1000,
    staleWhileRevalidate = true
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getCachedData = useCallback((): T | null => {
    const cached = cache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiresAt) {
      cache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }, [cacheKey]);

  const setCachedData = useCallback((newData: T) => {
    const now = Date.now();
    cache.set(cacheKey, {
      data: newData,
      timestamp: now,
      expiresAt: now + cacheDuration
    });
  }, [cacheKey, cacheDuration]);

  const invalidateCache = useCallback(() => {
    cache.delete(cacheKey);
  }, [cacheKey]);

  const fetchWithRetry = useCallback(async (attempt = 1): Promise<T> => {
    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      const result = await fetchFunction();
      return result;
    } catch (err) {
      if (attempt < retryAttempts) {
        console.warn(`Fetch attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
        
        return new Promise((resolve, reject) => {
          retryTimeoutRef.current = setTimeout(async () => {
            try {
              const result = await fetchWithRetry(attempt + 1);
              resolve(result);
            } catch (retryErr) {
              reject(retryErr);
            }
          }, retryDelay * attempt); // Exponential backoff
        });
      }
      throw err;
    }
  }, [fetchFunction, retryAttempts, retryDelay]);

  const loadData = useCallback(async (useCache = true) => {
    try {
      // Check cache first
      if (useCache) {
        const cachedData = getCachedData();
        if (cachedData) {
          setData(cachedData);
          setError(null);
          
          if (!staleWhileRevalidate) {
            setLoading(false);
            return;
          }
          // Continue to fetch fresh data in background
        }
      }

      setLoading(true);
      setError(null);

      const freshData = await fetchWithRetry();
      
      setData(freshData);
      setCachedData(freshData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Data loading failed:', err);
      
      // If we have stale cached data, keep showing it
      if (staleWhileRevalidate) {
        const cachedData = getCachedData();
        if (cachedData && !data) {
          setData(cachedData);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [getCachedData, setCachedData, fetchWithRetry, staleWhileRevalidate, data]);

  const refresh = useCallback(async () => {
    await loadData(false); // Force fresh fetch
  }, [loadData]);

  // Initial load
  useEffect(() => {
    loadData();

    return () => {
      // Cleanup
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidateCache
  };
};

// Specialized hooks for common data patterns
export const useOptimizedProgram = (userId: string) => {
  return useOptimizedDataLoading(
    async () => {
      const { data, error } = await supabase
        .from('exercise_programs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw new Error(error.message);
      return data?.[0] || null;
    },
    {
      cacheKey: `program-${userId}`,
      cacheDuration: 2 * 60 * 1000, // 2 minutes for program data
      retryAttempts: 3
    }
  );
};

export const useOptimizedAssessment = (userId: string) => {
  return useOptimizedDataLoading(
    async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw new Error(error.message);
      return data?.[0] || null;
    },
    {
      cacheKey: `assessment-${userId}`,
      cacheDuration: 5 * 60 * 1000, // 5 minutes for assessment data
      retryAttempts: 2
    }
  );
};

export const useOptimizedSurveyData = (userId: string) => {
  return useOptimizedDataLoading(
    async () => {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw new Error(error.message);
      return data?.[0] || null;
    },
    {
      cacheKey: `survey-${userId}`,
      cacheDuration: 10 * 60 * 1000, // 10 minutes for survey data
      retryAttempts: 2
    }
  );
};
