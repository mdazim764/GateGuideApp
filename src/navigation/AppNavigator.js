import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../theme/ThemeContext';

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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Define MainTabNavigator that was referenced but missing
const MainTabNavigator = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab')
            iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'SyllabusTab')
            iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'ResourcesTab')
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          else if (route.name === 'TimerTab')
            iconName = focused ? 'time' : 'time-outline';
          else if (route.name === 'MoreTab')
            iconName = focused ? 'menu' : 'menu-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.tabIconFocused,
        tabBarInactiveTintColor: theme.tabIcon,
        tabBarStyle: { backgroundColor: theme.tabBar },
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
        name="TimerTab"
        component={TimerStackScreen}
        options={{ tabBarLabel: 'Timer' }}
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
      options={({ route }) => ({
        tabBarVisible: route.params?.hideTabBar === true ? false : true,
      })}
    />
  </ResourcesStack.Navigator>
);

const TimerStack = createStackNavigator();
const TimerStackScreen = () => (
  <TimerStack.Navigator screenOptions={{ headerShown: false }}>
    <TimerStack.Screen name="Timer" component={TimerScreen} />
  </TimerStack.Navigator>
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
    <MoreStack.Screen name="Settings" component={SettingsScreen} />
    <MoreStack.Screen name="Analytics" component={AnalyticsScreen} />
    <MoreStack.Screen name="Resources" component={ResourcesScreen} />
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

// Authentication navigator
const AuthStack = createStackNavigator();
const AuthStackScreen = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Root navigator for handling auth flow
const RootStack = createStackNavigator();
const AppNavigator = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {/* For now, just show the main app. Later you can add auth logic:
      {isSignedIn ? (
        <RootStack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthStackScreen} />
      )} */}
      <RootStack.Screen name="Main" component={MainTabNavigator} />
    </RootStack.Navigator>
  );
};

export default AppNavigator;
