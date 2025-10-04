// src/context/DataContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const DataContext = createContext();

// Cache keys for different data types
const CACHE_KEYS = {
  SYLLABUS_TREE: '@cache/syllabusTree',
  SYLLABUS_WITH_PROGRESS: '@cache/syllabusWithProgress',
  SUBJECTS: '@cache/subjects',
  PLAYLISTS: '@cache/playlists',
  QUOTES: '@cache/quotes',
  USER_PROFILE: '@cache/userProfile',
};

// Cache expiry times (in milliseconds)
const CACHE_EXPIRY = {
  SYLLABUS_TREE: 24 * 60 * 60 * 1000, // 24 hours (static data)
  SYLLABUS_WITH_PROGRESS: 5 * 60 * 1000, // 5 minutes (dynamic data)
  SUBJECTS: 24 * 60 * 60 * 1000, // 24 hours
  PLAYLISTS: 6 * 60 * 60 * 1000, // 6 hours
  QUOTES: 60 * 60 * 1000, // 1 hour
  USER_PROFILE: 30 * 60 * 1000, // 30 minutes
};

export const DataProvider = ({ children }) => {
  // State for cached data
  const [syllabusTree, setSyllabusTree] = useState(null);
  const [syllabusWithProgress, setSyllabusWithProgress] = useState(null);
  const [subjects, setSubjects] = useState(null);
  const [playlists, setPlaylists] = useState(null);
  const [quotes, setQuotes] = useState(null);

  // Loading states
  const [loading, setLoading] = useState({
    syllabusTree: false,
    syllabusWithProgress: false,
    subjects: false,
    playlists: false,
    quotes: false,
  });

  // Error states
  const [errors, setErrors] = useState({});

  // Helper function to check if cache is valid
  const isCacheValid = (cacheData, expiryTime) => {
    if (!cacheData || !cacheData.timestamp) return false;
    return Date.now() - cacheData.timestamp < expiryTime;
  };

  // Helper function to get cached data
  const getCachedData = async cacheKey => {
    try {
      const cachedString = await AsyncStorage.getItem(cacheKey);
      return cachedString ? JSON.parse(cachedString) : null;
    } catch (error) {
      console.error(`Error reading cache for ${cacheKey}:`, error);
      return null;
    }
  };

  // Helper function to set cached data
  const setCachedData = async (cacheKey, data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error(`Error setting cache for ${cacheKey}:`, error);
    }
  };

  // Generic function to fetch and cache data
  const fetchWithCache = async (
    cacheKey,
    apiCall,
    stateSetter,
    loadingKey,
    expiryTime,
    forceRefresh = false,
  ) => {
    try {
      // Check cache first (unless forced refresh)
      if (!forceRefresh) {
        const cachedData = await getCachedData(cacheKey);
        if (cachedData && isCacheValid(cachedData, expiryTime)) {
          console.log(`Using cached data for ${cacheKey}`);
          stateSetter(cachedData.data);
          return cachedData.data;
        }
      }

      // Set loading state
      setLoading(prev => ({ ...prev, [loadingKey]: true }));
      setErrors(prev => ({ ...prev, [loadingKey]: null }));

      console.log(`Fetching fresh data for ${cacheKey}`);

      // Fetch fresh data
      const response = await apiCall();
      const data = response.data;

      // Update state and cache
      stateSetter(data);
      await setCachedData(cacheKey, data);

      return data;
    } catch (error) {
      console.error(`Error fetching ${cacheKey}:`, error);
      setErrors(prev => ({ ...prev, [loadingKey]: error.message }));

      // Try to return cached data even if expired, as fallback
      const cachedData = await getCachedData(cacheKey);
      if (cachedData?.data) {
        console.log(`Using expired cache as fallback for ${cacheKey}`);
        stateSetter(cachedData.data);
        return cachedData.data;
      }

      throw error;
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Specific fetch functions
  const fetchSyllabusTree = useCallback((forceRefresh = false) => {
    return fetchWithCache(
      CACHE_KEYS.SYLLABUS_TREE,
      api.academic.getSyllabusTree,
      setSyllabusTree,
      'syllabusTree',
      CACHE_EXPIRY.SYLLABUS_TREE,
      forceRefresh,
    );
  }, []);

  const fetchSyllabusWithProgress = useCallback((forceRefresh = false) => {
    return fetchWithCache(
      CACHE_KEYS.SYLLABUS_WITH_PROGRESS,
      api.academic.getSyllabusWithProgress,
      setSyllabusWithProgress,
      'syllabusWithProgress',
      CACHE_EXPIRY.SYLLABUS_WITH_PROGRESS,
      forceRefresh,
    );
  }, []);

  const fetchSubjects = useCallback((forceRefresh = false) => {
    return fetchWithCache(
      CACHE_KEYS.SUBJECTS,
      api.academic.getSubjects,
      setSubjects,
      'subjects',
      CACHE_EXPIRY.SUBJECTS,
      forceRefresh,
    );
  }, []);

  const fetchPlaylists = useCallback((forceRefresh = false) => {
    return fetchWithCache(
      CACHE_KEYS.PLAYLISTS,
      api.youtube.getPlaylists,
      setPlaylists,
      'playlists',
      CACHE_EXPIRY.PLAYLISTS,
      forceRefresh,
    );
  }, []);

  const fetchQuotes = useCallback((forceRefresh = false) => {
    return fetchWithCache(
      CACHE_KEYS.QUOTES,
      () => api.quotes.getAll(1, 50), // Get more quotes at once
      setQuotes,
      'quotes',
      CACHE_EXPIRY.QUOTES,
      forceRefresh,
    );
  }, []);

  // Initialize cache on app start
  useEffect(() => {
    const initializeCache = async () => {
      console.log('Initializing data cache...');

      // Load critical data first (syllabus tree is most important)
      try {
        await fetchSyllabusTree();
        // Load subjects after syllabus tree (subjects depend on syllabus)
        await fetchSubjects();
      } catch (error) {
        console.error('Error initializing critical data:', error);
      }

      // Load other data in parallel (not critical for immediate app function)
      Promise.allSettled([fetchPlaylists(), fetchQuotes()]).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const dataTypes = ['playlists', 'quotes'];
            console.warn(`Failed to load ${dataTypes[index]}:`, result.reason);
          }
        });
      });
    };

    initializeCache();
  }, []);

  // Function to refresh all data
  const refreshAllData = useCallback(async () => {
    console.log('Refreshing all cached data...');

    const refreshPromises = [
      fetchSyllabusTree(true),
      fetchSyllabusWithProgress(true),
      fetchSubjects(true),
      fetchPlaylists(true),
      fetchQuotes(true),
    ];

    try {
      await Promise.allSettled(refreshPromises);
      console.log('All data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [
    fetchSyllabusTree,
    fetchSyllabusWithProgress,
    fetchSubjects,
    fetchPlaylists,
    fetchQuotes,
  ]);

  // Function to refresh specific data type
  const refreshData = useCallback(
    dataType => {
      switch (dataType) {
        case 'syllabusTree':
          return fetchSyllabusTree(true);
        case 'syllabusWithProgress':
          return fetchSyllabusWithProgress(true);
        case 'subjects':
          return fetchSubjects(true);
        case 'playlists':
          return fetchPlaylists(true);
        case 'quotes':
          return fetchQuotes(true);
        default:
          console.warn(`Unknown data type: ${dataType}`);
      }
    },
    [
      fetchSyllabusTree,
      fetchSyllabusWithProgress,
      fetchSubjects,
      fetchPlaylists,
      fetchQuotes,
    ],
  );

  // Function to refresh syllabus progress after an update
  const refreshSyllabusProgress = useCallback(async () => {
    console.log('Refreshing syllabus progress data after update...');
    try {
      // Set loading state
      setLoading(prev => ({ ...prev, syllabusWithProgress: true }));

      // Fetch fresh data directly from API
      const response = await api.academic.getSyllabusWithProgress();
      const data = response.data;

      // Update state
      setSyllabusWithProgress(data);

      // Update cache with fresh data
      await setCachedData(CACHE_KEYS.SYLLABUS_WITH_PROGRESS, data);

      console.log('Syllabus progress refreshed successfully');
      return data;
    } catch (error) {
      console.error('Error refreshing syllabus progress:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, syllabusWithProgress: false }));
    }
  }, []);

  // Function to clear cache
  const clearCache = useCallback(async (dataType = null) => {
    try {
      if (dataType) {
        const cacheKey = CACHE_KEYS[dataType.toUpperCase()];
        if (cacheKey) {
          await AsyncStorage.removeItem(cacheKey);
          console.log(`Cache cleared for ${dataType}`);
        }
      } else {
        // Clear all cache
        const keys = Object.values(CACHE_KEYS);
        await AsyncStorage.multiRemove(keys);
        console.log('All cache cleared');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  // Function to get cache info (for debugging)
  const getCacheInfo = useCallback(async () => {
    const cacheInfo = {};

    for (const [key, cacheKey] of Object.entries(CACHE_KEYS)) {
      const cachedData = await getCachedData(cacheKey);
      cacheInfo[key] = {
        exists: !!cachedData,
        timestamp: cachedData?.timestamp,
        age: cachedData?.timestamp ? Date.now() - cachedData.timestamp : null,
        isValid: cachedData
          ? isCacheValid(cachedData, CACHE_EXPIRY[key])
          : false,
      };
    }

    return cacheInfo;
  }, []);

  const value = {
    // Data
    syllabusTree,
    syllabusWithProgress,
    subjects,
    playlists,
    quotes,

    // Loading states
    loading,
    errors,

    // Functions
    fetchSyllabusTree,
    fetchSyllabusWithProgress,
    fetchSubjects,
    fetchPlaylists,
    fetchQuotes,
    refreshAllData,
    refreshData,
    clearCache,
    getCacheInfo,
    refreshSyllabusProgress, // Add this new function
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export { DataContext };
