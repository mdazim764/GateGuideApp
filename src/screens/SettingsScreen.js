import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext'; // Changed to useAuth hook
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { logout, isLoggedIn } = useAuth(); // Use the useAuth hook instead
  const [notifications, setNotifications] = useState(true);
  const [remindTime, setRemindTime] = useState('08:00');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      margin: 16,
    },
    section: {
      margin: 16,
      marginTop: 0,
      borderRadius: 8,
      overflow: 'hidden',
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      padding: 16,
      borderBottomWidth: 1,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
    },
    settingInfo: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      opacity: 0.7,
    },
    settingValue: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingValueText: {
      fontSize: 16,
      marginRight: 4,
    },
    versionText: {
      fontSize: 14,
      opacity: 0.7,
    },
    dangerButton: {
      padding: 16,
      alignItems: 'center',
    },
    dangerButtonText: {
      color: '#E53935',
      fontWeight: 'bold',
      fontSize: 16,
    },
    logoutButton: {
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutButtonText: {
      color: '#E53935',
      fontWeight: 'bold',
      fontSize: 16,
      marginLeft: 8,
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('settings');
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        setNotifications(settings.notifications ?? true);
        setRemindTime(settings.remindTime ?? '08:00');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (key, value) => {
    try {
      let settings = {};
      const storedSettings = await AsyncStorage.getItem('settings');

      if (storedSettings) {
        settings = JSON.parse(storedSettings);
      }

      settings[key] = value;
      await AsyncStorage.setItem('settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const toggleNotifications = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    saveSettings('notifications', newValue);
  };

  const selectRemindTime = () => {
    // In a real app, this would show a time picker
    Alert.alert(
      'Set Reminder Time',
      'This would show a time picker in the full app',
      [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
    );
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear App Data',
      'Are you sure you want to clear all app data? This will reset your progress and settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All app data has been cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear app data');
            }
          },
        },
      ],
    );
  };

  const contactSupport = () => {
    Linking.openURL('mailto:support@gateguideapp.com');
  };

  const visitWebsite = () => {
    Linking.openURL('https://gateguideapp.com');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            // Check your actual auth navigation stack name
            // If you use a Stack.Navigator with name="AuthStack" in your AppNavigator:
            // navigation.reset({
            //   index: 0,
            //   routes: [{ name: 'Login' }], // Change to your actual auth entry screen name
            // });
          } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  // Render the logout button only if user is logged in
  const renderLogoutButton = () => {
    if (!isLoggedIn) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#E53935" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, borderBottomColor: theme.border },
            ]}
          >
            Appearance
          </Text>

          <View
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingDescription, { color: theme.text }]}>
                Switch between light and dark theme
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, borderBottomColor: theme.border },
            ]}
          >
            Notifications
          </Text>

          <View
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Enable Notifications
              </Text>
              <Text style={[styles.settingDescription, { color: theme.text }]}>
                Receive daily study reminders
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.settingItem,
              {
                opacity: notifications ? 1 : 0.5,
                borderBottomColor: theme.border,
              },
            ]}
            onPress={selectRemindTime}
            disabled={!notifications}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Reminder Time
              </Text>
              <Text style={[styles.settingDescription, { color: theme.text }]}>
                Set when to receive daily reminders
              </Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={[styles.settingValueText, { color: theme.primary }]}>
                {remindTime}
              </Text>
              <Icon name="chevron-right" size={20} color={theme.primary} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text, borderBottomColor: theme.border },
            ]}
          >
            About
          </Text>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={visitWebsite}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Visit Website
              </Text>
            </View>
            <Icon name="open-in-new" size={20} color={theme.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: theme.border }]}
            onPress={contactSupport}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Contact Support
              </Text>
            </View>
            <Icon name="email-outline" size={20} color={theme.primary} />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Version
              </Text>
            </View>
            <Text style={[styles.versionText, { color: theme.text }]}>
              1.0.0
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={styles.dangerButton} onPress={clearAllData}>
            <Text style={styles.dangerButtonText}>Clear App Data</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        {renderLogoutButton()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
