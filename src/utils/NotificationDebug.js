import messaging from '@react-native-firebase/messaging';
import api from '../services/api';

export const debugNotificationSystem = async () => {
  console.log('=== NOTIFICATION SYSTEM DEBUG ===');
  
  try {
    // Check FCM token
    const token = await messaging().getToken();
    console.log('Current FCM Token:', token);
    
    // Check authorization status
    const authStatus = await messaging().requestPermission();
    console.log('Authorization Status:', authStatus);
    
    // Test backend connection
    try {
      const response = await api.notifications.getNotifications(1, 1);
      console.log('Backend connection: SUCCESS');
      console.log('Sample response:', response.data);
    } catch (error) {
      console.log('Backend connection: FAILED');
      console.error('Backend error:', error.response?.data || error.message);
    }
    
    // Test token registration
    try {
      await api.notifications.updateFcmToken(token);
      console.log('Token registration: SUCCESS');
    } catch (error) {
      console.log('Token registration: FAILED');
      console.error('Token registration error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
  
  console.log('=== DEBUG COMPLETE ===');
};