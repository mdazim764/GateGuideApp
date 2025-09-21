import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';

const CustomHeader = ({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  navigation,
  route,
  transparent = false,
  largeTitle = false,
}) => {
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();

  // Improved route history detection - handles nested navigators better
  const getRouteHistory = () => {
    if (!navigation) return [];

    // Get current navigation state
    const state = navigation.getState();

    // For tab navigators, we need to look at the active tab's state
    if (state.type === 'tab' && state.routes.length > 0) {
      const activeTabIndex = state.index;
      const activeTabRoute = state.routes[activeTabIndex];

      // If the active tab has its own navigator, use that state
      if (activeTabRoute.state) {
        return activeTabRoute.state.routes || [];
      }
    }

    return state.routes || [];
  };

  const getTitle = () => {
    if (!route) return title || 'GateGuide';

    switch (route.name) {
      case 'YouTubePlaylist':
        return 'YouTube Playlists';
      case 'YouTubeVideoList':
        return route.params?.playlist?.title || 'Videos';
      case 'YouTubePlayer':
        return route.params?.video?.title || 'Video Player';
      case 'SubjectDetail':
        return route.params?.subject?.name || 'Subject';
      case 'QuizScreen':
        return 'Quiz';
      case 'QuizResult':
        return 'Quiz Results';
      case 'Settings':
        return 'Settings';
      case 'AiGuide':
        return 'AI Study Guide';
      case 'Analytics':
        return 'Performance Analytics';
      case 'Planner':
        return 'Study Planner';
      case 'Syllabus':
        return 'GATE Syllabus';
      default:
        return title || route.name;
    }
  };

  // Enhanced back navigation with better error handling
  const handleBackPress = () => {
    if (!navigation) {
      console.log('Navigation prop is missing');
      return;
    }

    // Use custom back handler if provided
    if (typeof onBack === 'function') {
      console.log('Using custom back handler');
      onBack();
      return;
    }

    try {
      // Special case handling based on route name
      if (route) {
        console.log(`Handling back navigation for route: ${route.name}`);

        switch (route.name) {
          case 'YouTubePlayer':
            navigation.navigate('YouTubeVideoList', route.params);
            return;
          case 'YouTubeVideoList':
            navigation.navigate('YouTubePlaylist');
            return;
          case 'YouTubePlaylist':
            navigation.navigate('Resources');
            return;
          case 'QuizResult':
            navigation.navigate('Home');
            return;
        }
      }

      // Check if we can go back in the history
      const canGoBack = navigation.canGoBack();
      console.log(`Can go back: ${canGoBack}`);

      if (canGoBack) {
        // Use goBack for standard back navigation
        navigation.goBack();
      } else {
        // Use reset to navigate to Home if we can't go back
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          }),
        );
      }
    } catch (error) {
      console.error('Error in back navigation:', error);
      // Fallback to Home navigation
      try {
        navigation.navigate('Home');
      } catch (fallbackError) {
        console.error('Fallback navigation failed:', fallbackError);
      }
    }
  };

  // Improved back button visibility logic
  const shouldShowBackButton = () => {
    // If explicitly set by props
    if (onBack === false) return false;
    if (onBack) return true;

    // Check if we're on a root screen (tab screen)
    if (
      route &&
      ['Home', 'Subjects', 'Resources', 'More'].includes(route.name)
    ) {
      return false;
    }

    // Use navigation.canGoBack() as a reliable method
    return navigation && navigation.canGoBack();
  };

  const showBack = shouldShowBackButton();

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: transparent ? 'transparent' : theme.card,
          paddingTop:
            Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight,
          borderBottomColor: transparent ? 'transparent' : theme.border,
        },
      ]}
    >
      <StatusBar
        backgroundColor={transparent ? 'transparent' : theme.card}
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent={true}
      />

      <View style={styles.header}>
        {/* Left/back button with improved touch area */}
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
          disabled={!showBack}
          accessibilityLabel="Back"
          accessibilityRole="button"
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          testID="header-back-button"
        >
          {showBack ? (
            <Icon name="arrow-back" size={24} color={theme.text} />
          ) : (
            <View style={styles.emptyIcon} />
          )}
        </TouchableOpacity>

        {/* Title section */}
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              { color: theme.text },
              largeTitle && styles.largeTitle,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {getTitle()}
          </Text>

          {subtitle && (
            <Text
              style={[styles.subtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right button */}
        <TouchableOpacity
          onPress={onRightPress}
          style={styles.rightButton}
          disabled={!rightIcon || !onRightPress}
          accessibilityRole="button"
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          testID="header-right-button"
        >
          {rightIcon ? (
            <Icon name={rightIcon} size={24} color={theme.text} />
          ) : (
            <View style={styles.emptyIcon} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: 0.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    // Fixed: Use consistent padding
    paddingBottom: 12,
    paddingTop: 12,
    // Fixed: Ensure height is sufficient (56px is standard)
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    // Added: To help visualize touch area during development
    // backgroundColor: 'rgba(0,0,0,0.05)',
  },
  emptyIcon: {
    width: 24,
    height: 24,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  largeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  rightButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default CustomHeader;

// // Basic usage
// <CustomHeader
//   navigation={navigation}
//   route={route}
// />

// // With subtitle
// <CustomHeader
//   title="Subject Details"
//   subtitle="Computer Science"
//   navigation={navigation}
//   route={route}
//   onBack={() => navigation.goBack()}
// />

// // With right button
// <CustomHeader
//   navigation={navigation}
//   route={route}
//   rightIcon="settings-outline"
//   onRightPress={() => navigation.navigate('Settings')}
// />

// // Large title with transparent background (for image headers)
// <CustomHeader
//   navigation={navigation}
//   route={route}
//   transparent={true}
//   largeTitle={true}
// />
