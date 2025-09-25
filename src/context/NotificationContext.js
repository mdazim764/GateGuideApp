import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Platform, AppState, Alert, PermissionsAndroid, Linking } from 'react-native';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
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
  
  // Navigation reference for deep linking
  const navigationRef = useRef(null);
  const isAuthenticated = isLoggedIn;

  // Set navigation reference from the root navigator
  const setNavigationRef = (ref) => {
    navigationRef.current = ref;
  };

  // Configure push notifications on component mount
  useEffect(() => {
    configurePushNotifications();
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Configure push notifications with enhanced channels
  const configurePushNotifications = () => {
    if (Platform.OS === 'android') {
      // Create notification channels with different priorities
      const channels = [
        {
          channelId: 'high-priority',
          channelName: 'High Priority',
          channelDescription: 'Important notifications that require immediate attention',
          playSound: true,
          soundName: 'default',
          importance: 4, // HIGH
          vibrate: true,
          showBadge: true,
        },
        {
          channelId: 'reminders',
          channelName: 'Study Reminders',
          channelDescription: 'Study session and task reminders',
          playSound: true,
          soundName: 'default',
          importance: 3, // DEFAULT
          vibrate: true,
          showBadge: true,
        },
        {
          channelId: 'quotes',
          channelName: 'Daily Quotes',
          channelDescription: 'Daily inspirational quotes',
          playSound: false,
          importance: 2, // LOW
          vibrate: false,
          showBadge: false,
        },
        {
          channelId: 'progress',
          channelName: 'Progress Updates',
          channelDescription: 'Study progress and achievements',
          playSound: true,
          soundName: 'default',
          importance: 3, // DEFAULT
          vibrate: false,
          showBadge: true,
        },
        {
          channelId: 'social',
          channelName: 'Social',
          channelDescription: 'Community and social notifications',
          playSound: false,
          importance: 2, // LOW
          vibrate: false,
          showBadge: true,
        }
      ];

      channels.forEach(channel => {
        PushNotification.createChannel(channel, created => 
          console.log(`Channel ${channel.channelId} created: ${created}`)
        );
      });
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

        // Handle notification actions (if any)
        if (notification.action) {
          handleNotificationAction(notification);
        }

        // Required on iOS only
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },

      onAction: function (notification) {
        console.log('ACTION:', notification.action);
        handleNotificationAction(notification);
      },

      onRegistrationError: function (err) {
        console.error('Registration error:', err);
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

        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Authorization status:', authStatus);
          const token = await messaging().getToken();
          console.log('FCM Token obtained:', token);
          setFcmToken(token);

          if (isAuthenticated) {
            await registerTokenWithBackend(token);
          }
        } else {
          console.log('Notification permissions denied');
          // Show alert to guide user to settings if needed
          showPermissionDeniedAlert();
        }
      } catch (error) {
        console.error('Failed to get notification permission:', error);
      }
    };

    requestPermissionAndToken();

    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async token => {
      console.log('FCM token refreshed:', token);
      setFcmToken(token);
      setTokenRegistered(false);

      if (isAuthenticated) {
        await registerTokenWithBackend(token);
      }
    });

    return unsubscribeTokenRefresh;
  }, []);

  // Show permission denied alert with settings redirect
  const showPermissionDeniedAlert = () => {
    Alert.alert(
      'Notifications Disabled',
      'To receive study reminders and updates, please enable notifications in your device settings.',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  };

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

      // Show local notification with enhanced styling
      showEnhancedLocalNotification(remoteMessage);

      // Refresh notifications list
      fetchNotifications();

      // Handle in-app notification display (optional)
      showInAppNotification(remoteMessage);
    });

    return unsubscribe;
  }, []);

  // Set up background notification handlers
  useEffect(() => {
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app from background state:', remoteMessage);
      handleNotificationOpen(remoteMessage);
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened from quit state by notification:', remoteMessage);
          handleNotificationOpen(remoteMessage);
        }
      });
  }, []);

  // Enhanced local notification display
  const showEnhancedLocalNotification = (remoteMessage) => {
    const { notification, data } = remoteMessage;
    if (!notification) return;

    const channelId = getChannelIdForNotificationType(data?.type);
    const actions = getNotificationActions(data?.type);

    PushNotification.localNotification({
      channelId,
      title: notification.title || 'GATE Guide',
      message: notification.body || '',
      bigText: notification.body, // For Android expanded view
      subText: getSubTextForType(data?.type),
      playSound: shouldPlaySound(data?.type),
      soundName: 'default',
      userInfo: data || {},
      largeIcon: 'ic_launcher',
      smallIcon: 'ic_notification',
      color: getColorForType(data?.type),
      actions: actions,
      invokeApp: false, // Don't automatically open app
      autoCancel: true,
      ongoing: false,
      priority: getPriorityForType(data?.type),
      visibility: 'public',
    });
  };

  // Get appropriate notification channel based on type
  const getChannelIdForNotificationType = (type) => {
    switch (type) {
      case 'quote':
      case 'daily_quote':
        return 'quotes';
      case 'reminder':
      case 'task_reminder':
      case 'study_reminder':
      case 'streak_reminder':
        return 'reminders';
      case 'progress':
      case 'achievement':
      case 'weekly_report':
        return 'progress';
      case 'quiz_result':
      case 'test_complete':
        return 'high-priority';
      default:
        return 'high-priority';
    }
  };

  // Get notification actions based on type
  const getNotificationActions = (type) => {
    switch (type) {
      case 'study_reminder':
        return ['start_study', 'snooze'];
      case 'quiz_reminder':
        return ['take_quiz', 'later'];
      case 'streak_reminder':
        return ['continue_streak', 'dismiss'];
      default:
        return ['view', 'dismiss'];
    }
  };

  // Get subtitle text for notification type
  const getSubTextForType = (type) => {
    switch (type) {
      case 'quote':
        return 'Daily Inspiration';
      case 'reminder':
      case 'study_reminder':
        return 'Study Time';
      case 'progress':
        return 'Progress Update';
      case 'achievement':
        return 'New Achievement';
      case 'quiz_result':
        return 'Quiz Complete';
      default:
        return 'GATE Guide';
    }
  };

  // Determine if notification should play sound
  const shouldPlaySound = (type) => {
    const quietTypes = ['quote', 'daily_quote', 'progress'];
    return !quietTypes.includes(type);
  };

  // Get notification color based on type
  const getColorForType = (type) => {
    switch (type) {
      case 'quote':
        return '#2196F3';
      case 'reminder':
        return '#FF9800';
      case 'progress':
        return '#4CAF50';
      case 'achievement':
        return '#9C27B0';
      case 'quiz_result':
        return '#00BCD4';
      default:
        return '#007AFF';
    }
  };

  // Get notification priority
  const getPriorityForType = (type) => {
    const highPriorityTypes = ['quiz_result', 'achievement', 'streak_reminder'];
    const lowPriorityTypes = ['quote', 'daily_quote'];
    
    if (highPriorityTypes.includes(type)) return 'high';
    if (lowPriorityTypes.includes(type)) return 'low';
    return 'default';
  };

  // Handle notification actions
  const handleNotificationAction = (notification) => {
    const { action, userInfo } = notification;
    console.log('Handling notification action:', action, userInfo);

    switch (action) {
      case 'start_study':
        navigateToScreen('Timer');
        break;
      case 'take_quiz':
        navigateToScreen('Quiz');
        break;
      case 'continue_streak':
        navigateToScreen('Home');
        break;
      case 'view':
        handleNotificationOpen(notification);
        break;
      case 'snooze':
      case 'later':
      case 'dismiss':
        // Handle snooze logic if needed
        break;
    }
  };

  // Show in-app notification (banner style)
  const showInAppNotification = (remoteMessage) => {
    // This can be implemented with a custom in-app notification component
    // For now, we'll just log it
    console.log('Would show in-app notification:', remoteMessage);
  };

  // Enhanced notification open handler with deep linking
  const handleNotificationOpen = (notification) => {
    console.log('Handling notification open:', notification);

    const data = notification.data || notification.userInfo || {};
    
    // Mark notification as read if ID is available
    if (data.notificationId) {
      markNotificationsRead([data.notificationId]);
    }

    // Handle navigation based on notification type and data
    handleNotificationNavigation(data);
  };

  // Smart navigation handler
  const handleNotificationNavigation = (data) => {
    const { type, navigationTarget, navigationParams, subjectId, topicId, quizId, resourceId } = data;

    // Use explicit navigation target if provided
    if (navigationTarget) {
      navigateToScreen(navigationTarget, navigationParams);
      return;
    }

    // Smart navigation based on notification type
    switch (type) {
      case 'quote':
      case 'daily_quote':
        navigateToScreen('Quotes');
        break;
        
      case 'study_reminder':
      case 'task_reminder':
        navigateToScreen('Planner');
        break;
        
      case 'streak_reminder':
        navigateToScreen('TrackerTab', { screen: 'Tracker' });
        break;
        
      case 'progress':
      case 'weekly_report':
        navigateToScreen('AnalyticsTab', { screen: 'Analytics' });
        break;
        
      case 'quiz_result':
        if (quizId) {
          navigateToScreen('QuizResult', { quizId });
        } else {
          navigateToScreen('QuizHistory');
        }
        break;
        
      case 'quiz_reminder':
        navigateToScreen('Quiz', { subjectId, topicId });
        break;
        
      case 'achievement':
        navigateToScreen('TrackerTab', { screen: 'Tracker' });
        break;
        
      case 'resource_added':
        if (resourceId) {
          navigateToScreen('ResourceDetail', { resourceId });
        } else {
          navigateToScreen('ResourcesTab', { screen: 'Resources' });
        }
        break;
        
      case 'subject_progress':
        if (subjectId) {
          navigateToScreen('SubjectDetail', { subjectId });
        } else {
          navigateToScreen('SyllabusTab', { screen: 'Syllabus' });
        }
        break;
        
      default:
        // Default to notifications screen
        navigateToScreen('Notifications');
    }
  };

  // Navigation helper
  const navigateToScreen = (screenName, params = {}) => {
    if (navigationRef.current) {
      try {
        navigationRef.current.navigate(screenName, params);
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to home screen
        navigationRef.current.navigate('Home');
      }
    } else {
      console.warn('Navigation ref not available');
    }
  };

  // Register FCM token with backend
  const registerTokenWithBackend = async (token) => {
    if (!token || !isAuthenticated) return;

    try {
      console.log('Registering FCM token with backend:', token.substring(0, 20) + '...');
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

  // Fetch notifications from API with enhanced filtering
  const fetchNotifications = async (page = 1, limit = 20, filters = {}) => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      console.log('Fetching notifications from API...');
      const params = { page, limit, ...filters };
      const response = await api.notifications.getNotifications(params.page, params.limit);
      console.log('Notifications response:', response.data);

      if (response.data && response.data.notifications) {
        if (page === 1) {
          setNotifications(response.data.notifications);
        } else {
          // Append for pagination
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
        
        const unread = response.data.notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
        console.log(`Loaded ${response.data.notifications.length} notifications, ${unread} unread`);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Bulk mark notifications as read
  const markAllNotificationsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      await markNotificationsRead(unreadIds);
    }
  };

  // Mark notifications as read
  const markNotificationsRead = async (notificationIds) => {
    if (!isAuthenticated || !notificationIds.length) return;

    try {
      console.log('Marking notifications as read:', notificationIds);
      await api.notifications.markRead(notificationIds);

      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification,
        ),
      );

      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      console.log('Notifications marked as read successfully');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Delete notifications with confirmation
  const deleteNotifications = async (notificationIds) => {
    if (!isAuthenticated || !notificationIds.length) return;

    try {
      console.log('Deleting notifications:', notificationIds);
      await api.notifications.deleteNotifications(notificationIds);

      setNotifications(prev =>
        prev.filter(notification => !notificationIds.includes(notification.id)),
      );

      const unreadDeleted = notifications.filter(
        n => notificationIds.includes(n.id) && !n.read,
      ).length;

      setUnreadCount(prev => Math.max(0, prev - unreadDeleted));
      console.log('Notifications deleted successfully');
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  // Clear all notifications with confirmation
  const clearAllNotifications = async () => {
    if (!isAuthenticated) return;

    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Clearing all notifications...');
              await api.notifications.clearAllNotifications();
              setNotifications([]);
              setUnreadCount(0);
              console.log('All notifications cleared successfully');
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
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
  const updateNotificationPreferences = async (newPreferences) => {
    if (!isAuthenticated) return;

    try {
      console.log('Updating notification preferences:', newPreferences);
      const response = await api.notifications.updatePreferences(newPreferences);
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
      Alert.alert('Error', 'FCM token not available. Please check your notification permissions.');
      return false;
    }

    if (!tokenRegistered) {
      console.log('FCM token not registered with backend');
      await registerTokenWithBackend(fcmToken);

      if (!tokenRegistered) {
        Alert.alert('Error', 'FCM token not registered with backend. Please try again.');
        return false;
      }
    }

    try {
      console.log('Calling test notification API...');
      const response = await api.notifications.sendTestNotification();
      console.log('Test notification API response:', response.data);

      Alert.alert('Success', 'Test notification sent successfully! You should receive it shortly.');

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

  // Schedule local reminder (for offline reminders)
  const scheduleLocalReminder = (title, body, date, data = {}) => {
    PushNotification.localNotificationSchedule({
      title,
      message: body,
      date,
      userInfo: data,
      playSound: true,
      soundName: 'default',
      channelId: 'reminders',
    });
  };

  // Cancel scheduled local notification
  const cancelLocalReminder = (notificationId) => {
    PushNotification.cancelLocalNotifications({ id: notificationId });
  };

  const value = {
    fcmToken,
    notifications,
    unreadCount,
    loading,
    preferences,
    tokenRegistered,
    setNavigationRef, // Export for AppNavigator
    fetchNotifications,
    markNotificationsRead,
    markAllNotificationsRead,
    deleteNotifications,
    clearAllNotifications,
    updateNotificationPreferences,
    sendTestNotification,
    fetchNotificationPreferences,
    refreshFcmToken,
    scheduleLocalReminder,
    cancelLocalReminder,
    navigateToScreen, // For external navigation triggers
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
