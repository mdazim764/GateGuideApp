// src/utils/AuthStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKENS = {
  ACCESS_TOKEN: '@auth/accessToken',
  REFRESH_TOKEN: '@auth/refreshToken',
  USER: '@auth/user',
};

export const saveAuthData = async (accessToken, refreshToken, user) => {
  try {
    const userData = JSON.stringify(user);

    await AsyncStorage.multiSet([
      [AUTH_TOKENS.ACCESS_TOKEN, accessToken],
      [AUTH_TOKENS.REFRESH_TOKEN, refreshToken],
      [AUTH_TOKENS.USER, userData],
    ]);

    return true;
  } catch (error) {
    console.error('Error saving auth data:', error);
    return false;
  }
};

export const getAuthData = async () => {
  try {
    const values = await AsyncStorage.multiGet([
      AUTH_TOKENS.ACCESS_TOKEN,
      AUTH_TOKENS.REFRESH_TOKEN,
      AUTH_TOKENS.USER,
    ]);

    const accessToken = values[0][1];
    const refreshToken = values[1][1];
    const userString = values[2][1];

    const user = userString ? JSON.parse(userString) : null;

    return { accessToken, refreshToken, user };
  } catch (error) {
    console.error('Error getting auth data:', error);
    return { accessToken: null, refreshToken: null, user: null };
  }
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      AUTH_TOKENS.ACCESS_TOKEN,
      AUTH_TOKENS.REFRESH_TOKEN,
      AUTH_TOKENS.USER,
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};
