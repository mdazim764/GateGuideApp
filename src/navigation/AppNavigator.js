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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MoreStack = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // <-- Hide system header for all screens
      }}
    >
      <Stack.Screen name="MoreMenu" component={MoreScreen} />
      <Stack.Screen name="Planner" component={PlannerScreen} />
      <Stack.Screen name="Quotes" component={QuotesScreen} />
      <Stack.Screen name="Tracker" component={TrackerScreen} />
      <Stack.Screen name="AiGuide" component={AiGuideScreen} />
      <Stack.Screen name="Syllabus" component={SyllabusScreen} />
      <Stack.Screen name="Timer" component={TimerScreen} />
      <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Resources" component={ResourcesScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home')
            iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Syllabus')
            iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Resources')
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          else if (route.name === 'Timer')
            iconName = focused ? 'time' : 'time-outline';
          else if (route.name === 'More')
            iconName = focused ? 'menu' : 'menu-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.tabIconFocused,
        tabBarInactiveTintColor: theme.tabIcon,
        tabBarStyle: { backgroundColor: theme.tabBar },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Syllabus" component={SyllabusScreen} />
      <Tab.Screen name="Resources" component={ResourcesScreen} />
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
};

export default AppNavigator;
