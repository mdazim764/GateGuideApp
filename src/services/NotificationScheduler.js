// src/services/NotificationScheduler.js
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationScheduler {
  static STORAGE_KEY = '@scheduled_notifications';

  // Schedule daily study reminder
  static async scheduleDailyReminder(time = '09:00') {
    const [hours, minutes] = time.split(':').map(Number);
    const notificationDate = new Date();
    notificationDate.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (notificationDate <= new Date()) {
      notificationDate.setDate(notificationDate.getDate() + 1);
    }

    const notificationId = `daily_reminder_${Date.now()}`;

    PushNotification.localNotificationSchedule({
      id: notificationId,
      title: '📚 Study Time!',
      message: 'Ready to continue your GATE preparation journey?',
      date: notificationDate,
      repeatType: 'day', // Repeat daily
      channelId: 'reminders',
      userInfo: {
        type: 'study_reminder',
        notificationId,
      },
    });

    // Store scheduled notification info
    await this.storeScheduledNotification(notificationId, {
      type: 'daily_reminder',
      time,
      scheduledAt: notificationDate.toISOString(),
    });

    console.log('Daily reminder scheduled for', notificationDate);
    return notificationId;
  }

  // Schedule streak reminder
  static async scheduleStreakReminder() {
    const notificationDate = new Date();
    notificationDate.setHours(20, 0, 0, 0); // 8 PM daily

    if (notificationDate <= new Date()) {
      notificationDate.setDate(notificationDate.getDate() + 1);
    }

    const notificationId = `streak_reminder_${Date.now()}`;

    PushNotification.localNotificationSchedule({
      id: notificationId,
      title: '🔥 Keep Your Streak Alive!',
      message:
        "Don't break your study streak. Quick 15 minutes can make a difference!",
      date: notificationDate,
      repeatType: 'day',
      channelId: 'reminders',
      userInfo: {
        type: 'streak_reminder',
        notificationId,
      },
    });

    await this.storeScheduledNotification(notificationId, {
      type: 'streak_reminder',
      scheduledAt: notificationDate.toISOString(),
    });

    return notificationId;
  }

  // Schedule quiz reminder
  static async scheduleQuizReminder(subjectId, delay = 24) {
    const notificationDate = new Date();
    notificationDate.setHours(notificationDate.getHours() + delay);

    const notificationId = `quiz_reminder_${subjectId}_${Date.now()}`;

    PushNotification.localNotificationSchedule({
      id: notificationId,
      title: '🧠 Time for a Quiz!',
      message: 'Test your knowledge and track your progress.',
      date: notificationDate,
      channelId: 'reminders',
      userInfo: {
        type: 'quiz_reminder',
        subjectId,
        notificationId,
      },
    });

    await this.storeScheduledNotification(notificationId, {
      type: 'quiz_reminder',
      subjectId,
      scheduledAt: notificationDate.toISOString(),
    });

    return notificationId;
  }

  // Store scheduled notification info
  static async storeScheduledNotification(notificationId, data) {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const notifications = stored ? JSON.parse(stored) : {};
      notifications[notificationId] = data;
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(notifications),
      );
    } catch (error) {
      console.error('Error storing scheduled notification:', error);
    }
  }

  // Cancel scheduled notification
  static async cancelScheduledNotification(notificationId) {
    PushNotification.cancelLocalNotifications({ id: notificationId });

    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const notifications = JSON.parse(stored);
        delete notifications[notificationId];
        await AsyncStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(notifications),
        );
      }
    } catch (error) {
      console.error('Error removing scheduled notification:', error);
    }
  }

  // Get all scheduled notifications
  static async getScheduledNotifications() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return {};
    }
  }

  // Clear all scheduled notifications
  static async clearAllScheduled() {
    PushNotification.cancelAllLocalNotifications();
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }
}

export default NotificationScheduler;
