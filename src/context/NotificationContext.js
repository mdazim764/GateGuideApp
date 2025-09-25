import React, { createContext, useState, useContext, useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Platform, AppState, Alert, PermissionsAndroid } from 'react-native';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider',
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const [fcmToken, setFcmToken] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tokenRegistered, setTokenRegistered] = useState(false);
  const [preferences, setPreferences] = useState({
    morningQuotes: true,
    taskReminders: true,
    progressUpdates: true,
    streakReminders: true,
    weeklyReports: true,
  });
  const isAuthenticated = isLoggedIn; // Alias for clarity

  // Configure push notifications on component mount
  useEffect(() => {
    configurePushNotifications();
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Configure push notifications
  const configurePushNotifications = () => {
    // Configure for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'default-channel-id',
          channelName: 'Default Channel',
          channelDescription: 'A default channel for notifications',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        created => console.log(`Channel created: ${created}`),
      );

      PushNotification.createChannel(
        {
          channelId: 'reminders-channel-id',
          channelName: 'Reminders',
          channelDescription:
            'Channel for reminders and scheduled notifications',
          playSound: true,
          soundName: 'default',
          importance: 3,
          vibrate: true,
        },
        created => console.log(`Reminders channel created: ${created}`),
      );

      PushNotification.createChannel(
        {
          channelId: 'quotes-channel-id',
          channelName: 'Daily Quotes',
          channelDescription: 'Channel for daily inspirational quotes',
          playSound: false,
          importance: 2,
          vibrate: false,
        },
        created => console.log(`Quotes channel created: ${created}`),
      );
    }

    // Configure push notification handlers
    PushNotification.configure({
      onRegister: function (token) {
        console.log('Local TOKEN:', token);
        if (Platform.OS === 'ios') {
          setFcmToken(token.token);
        }
      },

      onNotification: function (notification) {
        console.log('LOCAL NOTIFICATION:', notification);

        // Handle notification tap
        if (notification.userInteraction) {
          handleNotificationOpen(notification);
        }

        // Required on iOS only
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },

      onAction: function (notification) {
        console.log('ACTION:', notification.action);
        console.log('NOTIFICATION:', notification);
      },

      onRegistrationError: function (err) {
        console.error(err.message, err);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });
  };

  // Request notification permissions and get FCM token
  useEffect(() => {
    const requestPermissionAndToken = async () => {
      try {
        console.log('Requesting FCM permissions...');

        // Request permission
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Authorization status:', authStatus);

          // Get FCM token
          const token = await messaging().getToken();
          console.log('FCM Token obtained:', token);
          setFcmToken(token);

          // If user is authenticated, register token immediately
          if (isAuthenticated) {
            await registerTokenWithBackend(token);
          }
        } else {
          console.log('Notification permissions denied');
        }
      } catch (error) {
        console.error('Failed to get notification permission:', error);
      }
    };

    requestPermissionAndToken();

    // Listen for token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async token => {
      console.log('FCM token refreshed:', token);
      setFcmToken(token);
      setTokenRegistered(false); // Reset registration status

      if (isAuthenticated) {
        await registerTokenWithBackend(token);
      }
    });

    return unsubscribeTokenRefresh;
  }, []); // Remove isAuthenticated dependency to avoid multiple calls

  // Register FCM token when user authenticates or token changes
  useEffect(() => {
    const handleTokenRegistration = async () => {
      if (isAuthenticated && fcmToken && !tokenRegistered) {
        console.log('User authenticated, registering FCM token...');
        await registerTokenWithBackend(fcmToken);
        fetchNotifications();
        fetchNotificationPreferences();
      }
    };

    handleTokenRegistration();
  }, [isAuthenticated, fcmToken, tokenRegistered]);

  // Set up foreground message handler
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);

      // Display the notification locally
      showLocalNotification(remoteMessage);

      // Refresh notifications list
      fetchNotifications();
    });

    return unsubscribe;
  }, []);

  // Set up background notification handlers
  useEffect(() => {
    // Background state
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(
        'Notification opened app from background state:',
        remoteMessage,
      );
      handleNotificationOpen(remoteMessage);
    });

    // Quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'App opened from quit state by notification:',
            remoteMessage,
          );
          handleNotificationOpen(remoteMessage);
        }
      });
  }, []);

  // Register FCM token with backend
  const registerTokenWithBackend = async token => {
    if (!token || !isAuthenticated) return;

    try {
      console.log(
        'Registering FCM token with backend:',
        token.substring(0, 20) + '...',
      );

      const response = await api.notifications.updateFcmToken(token);
      console.log('FCM token registration response:', response.data);

      setTokenRegistered(true);
      console.log('FCM token registered with backend successfully');
    } catch (error) {
      console.error('Error registering FCM token with backend:', error);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }

      setTokenRegistered(false);
    }
  };

  // Show local notification for foreground messages
  const showLocalNotification = remoteMessage => {
    const { notification, data } = remoteMessage;

    if (!notification) return;

    // Determine channel based on notification type
    let channelId = 'default-channel-id';
    if (data && data.type) {
      switch (data.type) {
        case 'quote':
          channelId = 'quotes-channel-id';
          break;
        case 'reminder':
        case 'task':
        case 'streak':
          channelId = 'reminders-channel-id';
          break;
        default:
          channelId = 'default-channel-id';
      }
    }

    PushNotification.localNotification({
      channelId,
      title: notification.title || 'GATE Guide',
      message: notification.body || '',
      playSound: true,
      soundName: 'default',
      userInfo: data || {},
      largeIcon: 'ic_launcher',
      smallIcon: 'ic_notification',
    });
  };

  // Handle notification open/tap
  const handleNotificationOpen = notification => {
    console.log('Handling notification open:', notification);

    // Mark notification as read if ID is available
    if (notification.data && notification.data.notificationId) {
      markNotificationsRead([notification.data.notificationId]);
    }

    // Handle navigation based on notification type
    // This will be implemented based on your navigation structure
  };

  // Fetch notifications from API
  const fetchNotifications = async (page = 1, limit = 20) => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      console.log('Fetching notifications from API...');
      const response = await api.notifications.getNotifications(page, limit);
      console.log('Notifications response:', response.data);

      if (response.data && response.data.notifications) {
        setNotifications(response.data.notifications);
        const unread = response.data.notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
        console.log(
          `Loaded ${response.data.notifications.length} notifications, ${unread} unread`,
        );
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mark notifications as read
  const markNotificationsRead = async notificationIds => {
    if (!isAuthenticated || !notificationIds.length) return;

    try {
      console.log('Marking notifications as read:', notificationIds);
      await api.notifications.markRead(notificationIds);

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification,
        ),
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      console.log('Notifications marked as read successfully');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Delete notifications
  const deleteNotifications = async notificationIds => {
    if (!isAuthenticated || !notificationIds.length) return;

    try {
      console.log('Deleting notifications:', notificationIds);
      await api.notifications.deleteNotifications(notificationIds);

      // Update local state
      setNotifications(prev =>
        prev.filter(notification => !notificationIds.includes(notification.id)),
      );

      // Update unread count
      const unreadDeleted = notifications.filter(
        n => notificationIds.includes(n.id) && !n.read,
      ).length;

      setUnreadCount(prev => Math.max(0, prev - unreadDeleted));
      console.log('Notifications deleted successfully');
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!isAuthenticated) return;

    try {
      console.log('Clearing all notifications...');
      await api.notifications.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      console.log('All notifications cleared successfully');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Fetch notification preferences
  const fetchNotificationPreferences = async () => {
    if (!isAuthenticated) return;

    try {
      console.log('Fetching notification preferences...');
      const response = await api.notifications.getPreferences();
      if (response.data) {
        setPreferences(response.data);
        console.log('Notification preferences loaded:', response.data);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  // Update notification preferences
  const updateNotificationPreferences = async newPreferences => {
    if (!isAuthenticated) return;

    try {
      console.log('Updating notification preferences:', newPreferences);
      const response = await api.notifications.updatePreferences(
        newPreferences,
      );
      if (response.data) {
        setPreferences(response.data);
        console.log('Notification preferences updated successfully');
      }
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    console.log('Sending test notification...');

    if (!isAuthenticated) {
      console.log('User not authenticated');
      Alert.alert('Error', 'You must be logged in to send test notifications');
      return false;
    }

    if (!fcmToken) {
      console.log('FCM token not available');
      Alert.alert(
        'Error',
        'FCM token not available. Please check your notification permissions.',
      );
      return false;
    }

    if (!tokenRegistered) {
      console.log('FCM token not registered with backend');
      // Try to register token first
      await registerTokenWithBackend(fcmToken);

      if (!tokenRegistered) {
        Alert.alert(
          'Error',
          'FCM token not registered with backend. Please try again.',
        );
        return false;
      }
    }

    try {
      console.log('Calling test notification API...');
      const response = await api.notifications.sendTestNotification();
      console.log('Test notification API response:', response.data);

      Alert.alert(
        'Success',
        'Test notification sent successfully! You should receive it shortly.',
      );

      // Refresh notifications to include the new test notification
      setTimeout(() => {
        fetchNotifications();
      }, 1000);

      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);

      let errorMessage = 'Failed to send test notification';
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        errorMessage = error.response.data?.message || errorMessage;
      }

      Alert.alert('Error', errorMessage);
      return false;
    }
  };

  // Force refresh FCM token and re-register
  const refreshFcmToken = async () => {
    try {
      console.log('Refreshing FCM token...');
      await messaging().deleteToken();
      const newToken = await messaging().getToken();
      console.log('New FCM token obtained:', newToken);

      setFcmToken(newToken);
      setTokenRegistered(false);

      if (isAuthenticated) {
        await registerTokenWithBackend(newToken);
      }

      return newToken;
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
      return null;
    }
  };

  const value = {
    fcmToken,
    notifications,
    unreadCount,
    loading,
    preferences,
    tokenRegistered,
    fetchNotifications,
    markNotificationsRead,
    deleteNotifications,
    clearAllNotifications,
    updateNotificationPreferences,
    sendTestNotification,
    fetchNotificationPreferences,
    refreshFcmToken,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
