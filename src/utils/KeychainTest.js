// src/utils/KeychainTest.js
import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';

// Configure keychain options based on platform
export const KEYCHAIN_OPTIONS = {
  service: 'com.gateguideapp',
  accessible: Platform.OS === 'ios' 
    ? Keychain.ACCESSIBLE.WHEN_UNLOCKED 
    : null,
  securityLevel: Platform.OS === 'android' 
    ? Keychain.SECURITY_LEVEL.ANY 
    : null,
};

// IMPORTANT: Only for testing, REMOVE THIS FROM PRODUCTION
export const testKeychain = async () => {
  try {
    console.log('Testing Keychain with options:', KEYCHAIN_OPTIONS);
    
    // REMOVE THIS LINE - it's clearing your auth tokens!
    // await Keychain.resetGenericPassword(KEYCHAIN_OPTIONS);
    // console.log('Cleared existing keychain data');
    
    // Just test if we can read/write
    const testValue = 'test_token_123';
    await Keychain.setGenericPassword('test@example.com', testValue, KEYCHAIN_OPTIONS);
    console.log('Stored test data in keychain');
    
    const credentials = await Keychain.getGenericPassword(KEYCHAIN_OPTIONS);
    console.log('Retrieved from keychain:', credentials ? {
      username: credentials.username,
      password_length: credentials.password.length
    } : 'No credentials found');
    
    return credentials !== false;
  } catch (error) {
    console.error('Keychain test failed:', error);
    return false;
  }
};