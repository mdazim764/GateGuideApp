import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

// Create context
const AppContext = createContext();

// Context provider
export const AppProvider = ({ children }) => {
  // App state
  const [progress, setProgress] = useState({});
  const [currentQuote, setCurrentQuote] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from storage on app start
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load progress data
        const progressData = await AsyncStorage.getItem('progress');
        if (progressData) {
          setProgress(JSON.parse(progressData));
        }

        // Load or initialize quotes
        await loadQuotes();

        // Set random quote of the day
        setRandomQuoteOfDay();
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Load quotes data
  const loadQuotes = async () => {
    try {
      // First try to get from AsyncStorage
      const storedQuotes = await AsyncStorage.getItem('quotes');

      if (storedQuotes) {
        setQuotes(JSON.parse(storedQuotes));
      } else {
        // If not in storage, use default quotes
        // In real app, you would fetch from API or bundle with app
        const defaultQuotes = [
          {
            id: 1,
            text: 'Har dard ke baad rehmat hoti hai... sirf rukna nahi hota.',
            author: 'Sufi Wisdom',
          },
          {
            id: 2,
            text: 'Ilm woh noor hai jo sirf hausle se roshan hota hai.',
            author: 'Ahle Bait',
          },
          {
            id: 3,
            text: 'Jab tak na lage thokar, tab tak nahi hota insaan ko hosh.',
            author: 'Hazrat Ali (A.S.)',
          },
          {
            id: 4,
            text: 'Main apna future likh raha hoon.',
            author: 'Daily Affirmation',
          },
          {
            id: 5,
            text: 'Sab kuch mumkin hai agar khud par yaqeen ho.',
            author: 'Sufi Wisdom',
          },
        ];

        setQuotes(defaultQuotes);
        await AsyncStorage.setItem('quotes', JSON.stringify(defaultQuotes));
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
  };

  // Set random quote of the day
  const setRandomQuoteOfDay = () => {
    if (quotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setCurrentQuote(quotes[randomIndex]);
    }
  };

  // Fetch daily quote from API
  const fetchDailyQuote = async () => {
    try {
      setLoadingQuotes(true);
      setQuoteError(null);
      const response = await api.quotes.getDaily();
      console.log('Daily quote response:', response);
      if (response.data) {
        setCurrentQuote(response.data);
      }
    } catch (error) {
      console.error('Error fetching daily quote:', error);
      setQuoteError('Could not load daily quote');
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Fetch random quote from API
  const fetchRandomQuote = async () => {
    try {
      setLoadingQuotes(true);
      setQuoteError(null);
      const response = await api.quotes.getRandom();
      if (response.data) {
        console.log('Random quote response:', response);
        setCurrentQuote(response.data);
      }
    } catch (error) {
      console.error('Error fetching random quote:', error);
      setQuoteError('Could not load random quote');
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Fetch all quotes from API
  const fetchAllQuotes = async (page = 1, limit = 20) => {
    try {
      setLoadingQuotes(true);
      setQuoteError(null);
      const response = await api.quotes.getAll(page, limit);
      if (response.data && response.data.quotes) {
        setQuotes(response.data.quotes);
        // If no current quote is set, use the first one
        if (!currentQuote && response.data.quotes.length > 0) {
          console.log(
            'Setting current quote from all quotes:',
            response.data.quotes[0],
          );
          setCurrentQuote(response.data.quotes[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setQuoteError('Could not load quotes');
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Renamed from setRandomQuoteOfDay to reflect API usage
  const refreshCurrentQuote = () => {
    // Try to get a personalized quote first, fall back to random if error
    api.quotes
      .getPersonalized()
      .then(response => {
        if (response.data) {
          console.log('Personalized quote response:', response);
          setCurrentQuote(response.data);
        }
      })
      .catch(error => {
        console.log('Falling back to random quote:', error);
        fetchRandomQuote();
      });
  };

  // Update progress
  const updateProgress = async (subjectId, topicId, status) => {
    try {
      const newProgress = {
        ...progress,
        [subjectId]: {
          ...(progress[subjectId] || {}),
          [topicId]: status,
        },
      };

      setProgress(newProgress);
      await AsyncStorage.setItem('progress', JSON.stringify(newProgress));
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Context value
  const contextValue = {
    progress,
    updateProgress,
    quotes,
    currentQuote,
    loadingQuotes,
    quoteError,
    fetchDailyQuote,
    fetchRandomQuote,
    fetchAllQuotes,
    refreshCurrentQuote, // renamed from setRandomQuoteOfDay
    isLoading,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useApp = () => useContext(AppContext);
