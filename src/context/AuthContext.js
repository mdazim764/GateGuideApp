// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { getAuthData, saveAuthData, clearAuthData } from '../utils/AuthStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        console.log('Checking for existing auth data...');
        
        // Get all auth data
        const accessToken = await AsyncStorage.getItem('@auth/accessToken');
        const userString = await AsyncStorage.getItem('@auth/user');
        
        if (accessToken && userString) {
          console.log('Found auth data');
          
          try {
            // Set user from storage first for immediate UI response
            const user = JSON.parse(userString);
            setUser(user);
            setToken(accessToken);
            
            // Verify token with backend (but don't block UI)
            api.auth.verifyToken()
              .then(response => {
                console.log('Token verification successful');
                // Update user data if needed
                if (response.data.user) {
                  setUser(response.data.user);
                  AsyncStorage.setItem('@auth/user', JSON.stringify(response.data.user));
                }
              })
              .catch(verifyError => {
                console.log('Token verification failed:', verifyError);
                // Only if we get a 401/403, clear auth and log out
                if (verifyError.response && 
                    (verifyError.response.status === 401 || 
                     verifyError.response.status === 403)) {
                  // The token refresh interceptor will handle this automatically
                }
              });
          } catch (parseError) {
            console.log('Error parsing user data:', parseError);
            await AsyncStorage.removeItem('@auth/user');
          }
        } else {
          console.log('No auth data found');
        }
      } catch (err) {
        console.log('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.auth.login({ email, password });
      const { token: accessToken, refreshToken, user } = response.data;
      
      console.log('Login successful, storing tokens...');
      
      // Store user data and tokens
      await AsyncStorage.setItem('@auth/accessToken', accessToken);
      await AsyncStorage.setItem('@auth/refreshToken', refreshToken);
      await AsyncStorage.setItem('@auth/user', JSON.stringify(user));
      
      setUser(user);
      setToken(accessToken);
      return true;
    } catch (err) {
      console.log('Login failed:', err.response?.data || err);
      setError(err.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);

    try {
      await api.auth.register({ name, email, password });
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);

    try {
      console.log('Logging out...');

      // Tell the server we're logging out
      await api.auth.logout();

      // Clear local auth data
      await clearAuthData();

      setUser(null);
      setToken(null);
    } catch (err) {
      console.log('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isLoggedIn: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
