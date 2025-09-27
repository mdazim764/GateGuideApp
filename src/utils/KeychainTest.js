// src/utils/KeychainTest.js
import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';

// Configure keychain options based on platform
export const KEYCHAIN_OPTIONS = {
  service: 'com.gateguideapp',
  accessible: Platform.OS === 'ios' ? Keychain.ACCESSIBLE.WHEN_UNLOCKED : null,
  securityLevel: Platform.OS === 'android' ? Keychain.SECURITY_LEVEL.ANY : null,
};

// IMPORTANT: Only for testing, REMOVE THIS FROM PRODUCTION
export const testKeychain = async () => {
  console.log('Stored test data in keychain');

  try {
    // Store test data
    await Keychain.setGenericPassword(
      'keychainTestUser',
      'keychainTestPassword',
    );

    // Retrieve test data with platform-specific options
    const credentials =
      Platform.OS === 'ios'
        ? await Keychain.getGenericPassword({
            authenticationPrompt: {
              title: 'Authenticate to retrieve secret',
              cancel: 'Cancel',
            },
          })
        : await Keychain.getGenericPassword(); // No prompt on Android

    if (credentials) {
      console.log('Keychain test result: PASSED');
      return true;
    } else {
      console.log('Keychain test result: FAILED - No credentials found');
      return false;
    }
  } catch (error) {
    console.log('Keychain test failed:', error);
    console.log('Keychain test result: FAILED');
    return false;
  }
};
