import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/CustomHeader';

const NotificationSettingsScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const {
    preferences,
    loading,
    updateNotificationPreferences,
    sendTestNotification,
  } = useNotification();

  const [localPreferences, setLocalPreferences] = useState({
    morningQuotes: true,
    taskReminders: true,
    progressUpdates: true,
    streakReminders: true,
    weeklyReports: true,
  });

  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  // Initialize with current preferences
  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  // Toggle a preference
  const togglePreference = key => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Save preferences to the server
  const savePreferences = async () => {
    setSaving(true);
    try {
      await updateNotificationPreferences(localPreferences);
      Alert.alert('Success', 'Notification settings updated successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  // Send test notification
  const handleSendTest = async () => {
    setTestLoading(true);
    try {
      await sendTestNotification();
      Alert.alert(
        'Success',
        'Test notification sent. You should receive it shortly.',
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <CustomHeader title="Notification Settings" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <CustomHeader title="Notification Settings" navigation={navigation} />

      <ScrollView style={styles.scrollContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Notification Preferences
        </Text>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => togglePreference('morningQuotes')}
          >
            <View style={styles.settingInfo}>
              <Icon
                name="format-quote-open"
                size={22}
                color="#1976D2"
                style={styles.settingIcon}
              />
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Morning Quotes
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  Daily inspirational quotes to start your day
                </Text>
              </View>
            </View>
            <Switch
              value={localPreferences.morningQuotes}
              onValueChange={() => togglePreference('morningQuotes')}
              trackColor={{ false: '#767577', true: `${theme.primary}80` }}
              thumbColor={
                localPreferences.morningQuotes ? theme.primary : '#f4f3f4'
              }
            />
          </TouchableOpacity>

          <View
            style={[styles.separator, { backgroundColor: `${theme.text}20` }]}
          />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => togglePreference('taskReminders')}
          >
            <View style={styles.settingInfo}>
              <Icon
                name="clock-outline"
                size={22}
                color="#FFA000"
                style={styles.settingIcon}
              />
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Task Reminders
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  Reminders for scheduled study tasks
                </Text>
              </View>
            </View>
            <Switch
              value={localPreferences.taskReminders}
              onValueChange={() => togglePreference('taskReminders')}
              trackColor={{ false: '#767577', true: `${theme.primary}80` }}
              thumbColor={
                localPreferences.taskReminders ? theme.primary : '#f4f3f4'
              }
            />
          </TouchableOpacity>

          <View
            style={[styles.separator, { backgroundColor: `${theme.text}20` }]}
          />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => togglePreference('progressUpdates')}
          >
            <View style={styles.settingInfo}>
              <Icon
                name="chart-line"
                size={22}
                color="#388E3C"
                style={styles.settingIcon}
              />
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Progress Updates
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  Weekly updates on your study progress
                </Text>
              </View>
            </View>
            <Switch
              value={localPreferences.progressUpdates}
              onValueChange={() => togglePreference('progressUpdates')}
              trackColor={{ false: '#767577', true: `${theme.primary}80` }}
              thumbColor={
                localPreferences.progressUpdates ? theme.primary : '#f4f3f4'
              }
            />
          </TouchableOpacity>

          <View
            style={[styles.separator, { backgroundColor: `${theme.text}20` }]}
          />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => togglePreference('streakReminders')}
          >
            <View style={styles.settingInfo}>
              <Icon
                name="fire"
                size={22}
                color="#E64A19"
                style={styles.settingIcon}
              />
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Streak Reminders
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  Reminders to maintain your study streak
                </Text>
              </View>
            </View>
            <Switch
              value={localPreferences.streakReminders}
              onValueChange={() => togglePreference('streakReminders')}
              trackColor={{ false: '#767577', true: `${theme.primary}80` }}
              thumbColor={
                localPreferences.streakReminders ? theme.primary : '#f4f3f4'
              }
            />
          </TouchableOpacity>

          <View
            style={[styles.separator, { backgroundColor: `${theme.text}20` }]}
          />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => togglePreference('weeklyReports')}
          >
            <View style={styles.settingInfo}>
              <Icon
                name="chart-bar"
                size={22}
                color="#7B1FA2"
                style={styles.settingIcon}
              />
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Weekly Reports
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  Comprehensive weekly performance reports
                </Text>
              </View>
            </View>
            <Switch
              value={localPreferences.weeklyReports}
              onValueChange={() => togglePreference('weeklyReports')}
              trackColor={{ false: '#767577', true: `${theme.primary}80` }}
              thumbColor={
                localPreferences.weeklyReports ? theme.primary : '#f4f3f4'
              }
            />
          </TouchableOpacity>
        </View>

        <View style={styles.testContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Test Notifications
          </Text>
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme.primary }]}
            onPress={handleSendTest}
            disabled={testLoading}
          >
            {testLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="bell-ring-outline" size={18} color="#FFFFFF" />
                <Text style={styles.testButtonText}>
                  Send Test Notification
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text
            style={[styles.testDescription, { color: theme.textSecondary }]}
          >
            Send a test notification to verify your device is properly set up
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: theme.primary },
            saving && { opacity: 0.7 },
          ]}
          onPress={savePreferences}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  testContainer: {
    marginBottom: 24,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  testDescription: {
    fontSize: 13,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationSettingsScreen;
