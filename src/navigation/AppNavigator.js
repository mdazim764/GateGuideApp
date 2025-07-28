import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import PlannerScreen from '../screens/PlannerScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import TrackerScreen from '../screens/TrackerScreen';
import QuotesScreen from '../screens/QuotesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const HomeStack = () => (
  <Stack.Navigator options={{ headerShown: false }}>
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const PlannerStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Planner"
      component={PlannerScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const ResourcesStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Resources"
      component={ResourcesScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const TrackerStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Tracker" component={TrackerScreen} />
  </Stack.Navigator>
);

const QuotesStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Quotes" component={QuotesScreen} />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

// Tab navigator
const AppNavigator = () => {
  const { theme, isDarkMode } = useContext(ThemeContext);

  return (
    <NavigationContainer
      theme={{
        dark: isDarkMode,
        colors: {
          primary: theme.primary,
          background: theme.background,
          card: theme.card,
          text: theme.text,
          border: theme.card,
          notification: theme.primary,
        },
        fonts: {
          regular: {
            fontFamily: undefined,
            fontWeight: 'normal',
          },
          medium: {
            fontFamily: undefined,
            fontWeight: '500',
          },
          light: {
            fontFamily: undefined,
            fontWeight: '300',
          },
          thin: {
            fontFamily: undefined,
            fontWeight: '100',
          },
        },
      }}
    >
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'HomeTab') {
              iconName = 'home';
            } else if (route.name === 'PlannerTab') {
              iconName = 'calendar-check';
            } else if (route.name === 'ResourcesTab') {
              iconName = 'book-open-page-variant';
            } else if (route.name === 'TrackerTab') {
              iconName = 'chart-line';
            } else if (route.name === 'QuotesTab') {
              iconName = 'format-quote-close';
            } else if (route.name === 'SettingsTab') {
              iconName = 'cog';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.tabIconFocused,
          tabBarInactiveTintColor: theme.tabIcon,
          tabBarStyle: { backgroundColor: theme.tabBar },
        })}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{ tabBarLabel: 'Home', headerShown: false }}
        />
        <Tab.Screen
          name="PlannerTab"
          component={PlannerStack}
          options={{ tabBarLabel: 'Planner', headerShown: false }}
        />
        <Tab.Screen
          name="ResourcesTab"
          component={ResourcesStack}
          options={{ tabBarLabel: 'Resources', headerShown: false }}
        />
        <Tab.Screen
          name="TrackerTab"
          component={TrackerStack}
          options={{ tabBarLabel: 'Tracker', headerShown: false }}
        />
        <Tab.Screen
          name="QuotesTab"
          component={QuotesStack}
          options={{ tabBarLabel: 'Quotes', headerShown: false }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStack}
          options={{ tabBarLabel: 'Settings', headerShown: false }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
