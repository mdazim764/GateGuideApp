import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from './colors';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [theme, setTheme] = useState(isDarkMode ? darkTheme : lightTheme);
  
  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('settings');
        if (storedSettings) {
          const settings = JSON.parse(storedSettings);
          // Use the stored darkMode value if available, otherwise use system preference
          const savedDarkMode = settings.darkMode !== undefined ? settings.darkMode : (systemColorScheme === 'dark');
          setIsDarkMode(savedDarkMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    
    loadThemePreference();
  }, [systemColorScheme]);
  
  // Update theme when dark mode changes
  useEffect(() => {
    setTheme(isDarkMode ? darkTheme : lightTheme);
  }, [isDarkMode]);
  
  // Toggle between light and dark themes
  const toggleTheme = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      
      // Save theme preference
      let settings = {};
      const storedSettings = await AsyncStorage.getItem('settings');
      
      if (storedSettings) {
        settings = JSON.parse(storedSettings);
      }
      
      settings.darkMode = newValue;
      await AsyncStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };
  
  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
