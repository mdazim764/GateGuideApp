import React, { useContext, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../theme/ThemeContext';
import { useNotification } from '../context/NotificationContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import SyllabusScreen from '../screens/SyllabusScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import TimerScreen from '../screens/TimerScreen';
import MoreScreen from '../screens/MoreScreen';
import PlannerScreen from '../screens/PlannerScreen';
import QuotesScreen from '../screens/QuotesScreen';
import TrackerScreen from '../screens/TrackerScreen';
import AiGuideScreen from '../screens/AiGuideScreen';
import SubjectDetailScreen from '../screens/SubjectDetailScreen';
import QuizScreen from '../screens/QuizScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import QuizResultScreen from '../screens/QuizResultScreen';
import YouTubePlaylistScreen from '../screens/YouTubePlaylistScreen';
import YouTubeVideoListScreen from '../screens/YouTubeVideoListScreen';
import YouTubePlayerScreen from '../screens/YouTubePlayerScreen';
import AddResourceScreen from '../screens/AddResourceScreen';
import QuizHistoryScreen from '../screens/QuizHistoryScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import NotificationBadge from '../components/NotificationBadge';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Define MainTabNavigator that was referenced but missing
const MainTabNavigator = () => {
  const { theme } = useContext(ThemeContext);
  const { unreadCount } = useNotification();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'SyllabusTab') {
            iconName = focused ? 'book-open-variant' : 'book-outline';
          } else if (route.name === 'ResourcesTab') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'TrackerTab') {
            iconName = focused ? 'chart-line' : 'chart-line-variant';
          } else if (route.name === 'MoreTab') {
            iconName = focused ? 'dots-horizontal' : 'dots-horizontal';
          } else if (route.name === 'NotificationsTab') {
            iconName = focused ? 'bell' : 'bell-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: `${theme.text}70`,
        tabBarStyle: { backgroundColor: theme.card },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="SyllabusTab"
        component={SyllabusStackScreen}
        options={{ tabBarLabel: 'Syllabus' }}
      />
      <Tab.Screen
        name="ResourcesTab"
        component={ResourcesStackScreen}
        options={{ tabBarLabel: 'Resources' }}
      />
      <Tab.Screen
        name="TrackerTab"
        component={TrackerStackScreen}
        options={{ tabBarLabel: 'Tracker' }}
      />

      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStackNavigator}
        options={{
          tabBarLabel: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Icon name="bell-outline" size={size} color={color} />
              <NotificationBadge
                size="small"
                containerStyle={{ position: 'absolute', top: -5, right: -5 }}
              />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="MoreTab"
        component={MoreStackScreen}
        options={{ tabBarLabel: 'More' }}
      />
    </Tab.Navigator>
  );
};

// Create individual stack navigators for each tab
const HomeStack = createStackNavigator();
const HomeStackScreen = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
    <HomeStack.Screen name="Quiz" component={QuizScreen} />
    <HomeStack.Screen name="QuizResult" component={QuizResultScreen} />
    <HomeStack.Screen name="Resources" component={ResourcesScreen} />
    <HomeStack.Screen name="Settings" component={SettingsScreen} />
    <HomeStack.Screen name="Analytics" component={AnalyticsScreen} />
    <HomeStack.Screen name="Planner" component={PlannerScreen} />
    <HomeStack.Screen name="Quotes" component={QuotesScreen} />
    <HomeStack.Screen name="Tracker" component={TrackerScreen} />
    <HomeStack.Screen name="Syllabus" component={SyllabusScreen} />
    <HomeStack.Screen name="Timer" component={TimerScreen} />
    <HomeStack.Screen name="AiGuide" component={AiGuideScreen} />
    <HomeStack.Screen name="AddResource" component={AddResourceScreen} />
    <HomeStack.Screen name="QuizHistory" component={QuizHistoryScreen} />
    <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    <HomeStack.Screen
      name="NotificationSettings"
      component={NotificationSettingsScreen}
    />
  </HomeStack.Navigator>
);

const SyllabusStack = createStackNavigator();
const SyllabusStackScreen = () => (
  <SyllabusStack.Navigator screenOptions={{ headerShown: false }}>
    <SyllabusStack.Screen name="Syllabus" component={SyllabusScreen} />
    <SyllabusStack.Screen
      name="SubjectDetail"
      component={SubjectDetailScreen}
    />
    <SyllabusStack.Screen name="Quiz" component={QuizScreen} />
    <SyllabusStack.Screen name="QuizResult" component={QuizResultScreen} />
    <SyllabusStack.Screen name="Resources" component={ResourcesScreen} />
    <SyllabusStack.Screen name="Tracker" component={TrackerScreen} />
    <SyllabusStack.Screen name="Analytics" component={AnalyticsScreen} />
  </SyllabusStack.Navigator>
);

const ResourcesStack = createStackNavigator();
const ResourcesStackScreen = () => (
  <ResourcesStack.Navigator screenOptions={{ headerShown: false }}>
    <ResourcesStack.Screen name="Resources" component={ResourcesScreen} />
    <ResourcesStack.Screen name="AddResource" component={AddResourceScreen} />
    <ResourcesStack.Screen
      name="YouTubePlaylist"
      component={YouTubePlaylistScreen}
    />
    <ResourcesStack.Screen
      name="YouTubeVideoList"
      component={YouTubeVideoListScreen}
    />
    <ResourcesStack.Screen
      name="YouTubePlayer"
      component={YouTubePlayerScreen}
    />
  </ResourcesStack.Navigator>
);

const TrackerStack = createStackNavigator();
const TrackerStackScreen = () => (
  <TrackerStack.Navigator screenOptions={{ headerShown: false }}>
    <TrackerStack.Screen name="Tracker" component={TrackerScreen} />
    <TrackerStack.Screen name="QuizResult" component={QuizResultScreen} />
  </TrackerStack.Navigator>
);

const MoreStack = createStackNavigator();
const MoreStackScreen = () => (
  <MoreStack.Navigator screenOptions={{ headerShown: false }}>
    <MoreStack.Screen name="MoreMenu" component={MoreScreen} />
    <MoreStack.Screen name="Planner" component={PlannerScreen} />
    <MoreStack.Screen name="Quotes" component={QuotesScreen} />
    <MoreStack.Screen name="Tracker" component={TrackerScreen} />
    <MoreStack.Screen name="AiGuide" component={AiGuideScreen} />
    <MoreStack.Screen name="Syllabus" component={SyllabusScreen} />
    <MoreStack.Screen name="Timer" component={TimerScreen} />
    <MoreStack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
    <MoreStack.Screen name="Quiz" component={QuizScreen} />
    <MoreStack.Screen name="QuizResult" component={QuizResultScreen} />
    <MoreStack.Screen name="QuizHistory" component={QuizHistoryScreen} />
    <MoreStack.Screen name="Settings" component={SettingsScreen} />
    <MoreStack.Screen name="Analytics" component={AnalyticsScreen} />
    <MoreStack.Screen name="Resources" component={ResourcesScreen} />
    <MoreStack.Screen name="AddResource" component={AddResourceScreen} />
    <MoreStack.Screen name="Notifications" component={NotificationsScreen} />
    <MoreStack.Screen
      name="YouTubePlaylist"
      component={YouTubePlaylistScreen}
    />
    <MoreStack.Screen
      name="YouTubeVideoList"
      component={YouTubeVideoListScreen}
    />
    <MoreStack.Screen name="YouTubePlayer" component={YouTubePlayerScreen} />
  </MoreStack.Navigator>
);

const NotificationsStack = createStackNavigator();
const NotificationsStackNavigator = () => (
  <NotificationsStack.Navigator screenOptions={{ headerShown: false }}>
    <NotificationsStack.Screen
      name="Notifications"
      component={NotificationsScreen}
    />
    <NotificationsStack.Screen
      name="NotificationSettings"
      component={NotificationSettingsScreen}
    />
  </NotificationsStack.Navigator>
);

// Authentication navigator
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Root navigator for handling auth flow
const AppNavigator = () => {
  const { isLoggedIn, loading } = useAuth();
  const { theme } = useContext(ThemeContext);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
