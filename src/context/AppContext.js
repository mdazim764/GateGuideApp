import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create context
const AppContext = createContext();

// Context provider
export const AppProvider = ({ children }) => {
  // App state
  const [progress, setProgress] = useState({});
  const [quotes, setQuotes] = useState([]);
  const [currentQuote, setCurrentQuote] = useState(null);
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
    setRandomQuoteOfDay,
    isLoading,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useApp = () => useContext(AppContext);
