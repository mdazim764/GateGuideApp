import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Dimensions,
  Image,
  Easing,
  Platform,
  SafeAreaView as RNSafeAreaView, // Fallback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

// Default theme fallback to prevent undefined errors
const defaultTheme = {
  background: '#FFFFFF',
  text: '#000000',
  primary: '#007AFF',
  card: '#F5F5F5',
};

const HomeScreen = ({ navigation }) => {
  // Use try/catch to handle any context errors
  let appContextValues = { isLoading: true };
  let themeContextValues = { theme: defaultTheme };

  try {
    appContextValues = useApp() || { isLoading: true };
  } catch (error) {
    console.error('Error loading AppContext:', error);
  }

  try {
    themeContextValues = useContext(ThemeContext) || { theme: defaultTheme };
  } catch (error) {
    console.error('Error loading ThemeContext:', error);
  }

  const { currentQuote, progress, isLoading = true } = appContextValues;
  const { theme = defaultTheme } = themeContextValues;

  console.log('Theme loaded:', theme); // Debug logging
  console.log('App Context:', appContextValues); // Debug logging

  const [daysRemaining, setDaysRemaining] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [studyStreak, setStudyStreak] = useState(7); // Mock data
  const [localTasks, setLocalTasks] = useState([]);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [recentlyViewedItems, setRecentlyViewedItems] = useState([
    {
      id: 1,
      title: 'Operating Systems',
      subtitle: 'Process Scheduling & Memory Management',
      progress: 67,
      duration: '45 min',
    },
    {
      id: 2,
      title: 'Data Structures',
      subtitle: 'Graph Algorithms & Applications',
      progress: 38,
      duration: '60 min',
    },
    {
      id: 3,
      title: 'Computer Networks',
      subtitle: 'Network Layer & Routing Protocols',
      progress: 22,
      duration: '30 min',
    },
  ]);

  // Animations - with error handling
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    console.log('Running entrance animations');

    // Simple animation with fewer dependencies
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => console.log('Animation complete'));

    // Set up other data
    setDaysRemaining(586); // Hard-coded value for testing
    setOverallProgress(25);
  }, []);

  useEffect(() => {
    // Update progress animation when progress changes
    if (!hasError && isComponentMounted) {
      try {
        Animated.timing(progressAnim, {
          toValue: overallProgress,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      } catch (error) {
        console.error('Error animating progress:', error);
      }
    }
  }, [overallProgress, isComponentMounted]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      // Mock refreshing data
      setRefreshing(false);
    }, 1500);
  }, []);

  const toggleTaskCompletion = id => {
    setLocalTasks(
      localTasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const getPriorityColor = priority => {
    switch (priority) {
      case 'high':
        return '#E74C3C';
      case 'medium':
        return '#F39C12';
      case 'low':
        return '#2ECC71';
      default:
        return theme.text || '#000000';
    }
  };

  const calculateTimeLeft = () => {
    // Calculate hours, minutes left for today's study
    const now = new Date();
    const hours = 22 - now.getHours();
    const minutes = 60 - now.getMinutes();

    return hours > 0
      ? `${hours} hr ${minutes} min left today`
      : 'Last hour for today!';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Simple styles for error state
  const errorStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#FFF',
    },
    text: {
      fontSize: 16,
      marginBottom: 20,
      textAlign: 'center',
    },
    button: {
      backgroundColor: '#007AFF',
      padding: 12,
      borderRadius: 8,
    },
    buttonText: {
      color: '#FFF',
      fontWeight: 'bold',
    },
  });

  // Handle error state with simple UI
  if (hasError) {
    return (
      <View style={errorStyles.container}>
        <Text style={errorStyles.text}>
          Something went wrong loading the dashboard. Please try again.
        </Text>
        <TouchableOpacity
          style={errorStyles.button}
          onPress={() => {
            setHasError(false);
            setIsComponentMounted(false);
            // Force remount component logic
            setTimeout(() => setIsComponentMounted(true), 100);
          }}
        >
          <Text style={errorStyles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Force component to mount properly
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Set component as mounted after a short delay
    const timer = setTimeout(() => {
      setIsMounted(true);
      setIsComponentMounted(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background || '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      marginTop: 16,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 16,
      paddingBottom: 0,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 4,
      textAlign: 'center',
    },
    subtitle: {
      color: theme.text,
      fontSize: 16,
      opacity: 0.8,
      textAlign: 'center',
      marginBottom: 16,
    },
    greeting: {
      color: theme.text,
      fontSize: 20,
      fontWeight: 'bold',
      marginHorizontal: 16,
      marginTop: 8,
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 12,
    },
    streakText: {
      color: theme.text,
      opacity: 0.8,
      fontSize: 14,
      marginLeft: 6,
    },
    countdownContainer: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    countdownContent: {
      flex: 1,
    },
    countdownText: {
      color: theme.text,
      fontSize: 16,
    },
    daysNumber: {
      color: theme.primary,
      fontSize: 24,
      fontWeight: 'bold',
    },
    timeLeftText: {
      color: theme.text,
      fontSize: 12,
      opacity: 0.7,
      marginTop: 6,
    },
    countdownIcon: {
      backgroundColor: `${theme.primary}20`,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 16,
    },
    progressContainer: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    progressHeader: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    progressTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: 'bold',
    },
    progressPercent: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: 'bold',
    },
    progressBar: {
      height: 10,
      width: '100%',
      backgroundColor: `${theme.primary}20`,
      borderRadius: 10,
      marginVertical: 10,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 10,
    },
    progressStats: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-around',
      marginTop: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: 'bold',
    },
    statLabel: {
      color: theme.text,
      fontSize: 12,
      opacity: 0.7,
    },
    quoteCard: {
      padding: 20,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
    quoteText: {
      fontSize: 16,
      fontStyle: 'italic',
      marginBottom: 8,
      lineHeight: 22,
    },
    quoteAuthor: {
      fontSize: 14,
      textAlign: 'right',
      fontWeight: 'bold',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    viewAllText: {
      color: theme.primary,
      fontSize: 14,
    },
    todayTasksCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: `${theme.text}10`,
    },
    taskLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    priorityIndicator: {
      width: 4,
      height: 36,
      borderRadius: 2,
      marginRight: 12,
    },
    taskCheckbox: {
      marginRight: 12,
    },
    taskTextContainer: {
      flex: 1,
    },
    taskText: {
      color: theme.text,
      fontSize: 16,
      flex: 1,
    },
    taskSubject: {
      fontSize: 12,
      opacity: 0.6,
      marginTop: 2,
    },
    emptyTaskText: {
      color: theme.text,
      fontSize: 16,
      textAlign: 'center',
      fontStyle: 'italic',
      padding: 8,
    },
    actionButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: 14,
      alignItems: 'center',
      marginTop: 12,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 16,
      marginLeft: 8,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginBottom: 24,
    },
    quickActionItem: {
      backgroundColor: theme.card,
      width: (width - 48) / 2,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      alignItems: 'center',
    },
    quickActionIcon: {
      backgroundColor: `${theme.primary}20`,
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    quickActionText: {
      color: theme.text,
      fontSize: 14,
      textAlign: 'center',
    },
    recentlyViewedSection: {
      marginBottom: 24,
    },
    recentItem: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      width: width * 0.75,
      marginRight: 12,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    recentItemTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    recentItemSubtitle: {
      color: theme.text,
      opacity: 0.7,
      fontSize: 14,
      marginBottom: 12,
    },
    recentItemFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    recentItemProgress: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    recentItemProgressText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: 'bold',
      marginLeft: 8,
    },
  });

  // Use a basic debugging screen to help diagnose
  if (!isComponentMounted) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background || '#FFFFFF' },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary || '#007AFF'} />
        <Text style={{ marginTop: 20, color: theme.text || '#000000' }}>
          Initializing Dashboard...
        </Text>
      </View>
    );
  }

  // Show loading screen with more info
  if (!isMounted || (isLoading && !hasError)) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.background || '#FFFFFF' },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary || '#007AFF'} />
        <Text style={{ marginTop: 20, color: theme.text || '#000000' }}>
          Loading your study dashboard...
        </Text>
      </View>
    );
  }

  console.log(
    'Rendering with theme:',
    theme.background,
    theme.text,
    'isLoading:',
    isLoading,
    'isMounted:',
    isComponentMounted,
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'right', 'left']}
    >
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
            progressBackgroundColor={theme.card}
          />
        }
      >
        {/* <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: 'red',
            padding: 5,
            zIndex: 9999,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: 'white' }}>DEBUG</Text>
        </View> */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
        >
          <Text style={[styles.greeting, { color: theme.text }]}>
            {getGreeting()}, Azim
          </Text>

          <View style={styles.streakContainer}>
            <Icon name="fire" size={18} color={theme.primary} />
            <Text style={styles.streakText}>
              {studyStreak} day study streak! Keep it up!
            </Text>
          </View>

          {/* Exam Countdown */}
          <View style={styles.countdownContainer}>
            <View style={styles.countdownContent}>
              <Text style={[styles.countdownText, { color: theme.text }]}>
                GATE Exam Countdown
              </Text>
              <Text style={styles.daysNumber}>{daysRemaining} days left</Text>
              <Text style={styles.timeLeftText}>{calculateTimeLeft()}</Text>
            </View>
            <View style={styles.countdownIcon}>
              <Icon name="calendar-clock" size={28} color={theme.primary} />
            </View>
          </View>

          {/* Overall Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressPercent}>{overallProgress}%</Text>
            </View>

            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>38</Text>
                <Text style={styles.statLabel}>Topics Covered</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>72</Text>
                <Text style={styles.statLabel}>Hours Studied</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>426</Text>
                <Text style={styles.statLabel}>Questions Solved</Text>
              </View>
            </View>
          </View>

          {/* Recently Viewed */}
          <View style={styles.recentlyViewedSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Continue Learning
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Syllabus')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingLeft: 16,
                paddingRight: 4,
                paddingVertical: 8,
              }}
            >
              {recentlyViewedItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recentItem}
                  onPress={() =>
                    navigation.navigate('SubjectDetail', {
                      subjectId: item.id,
                      title: item.title,
                    })
                  }
                >
                  <Text style={styles.recentItemTitle}>{item.title}</Text>
                  <Text style={styles.recentItemSubtitle}>{item.subtitle}</Text>

                  <View style={styles.recentItemFooter}>
                    <View style={styles.recentItemProgress}>
                      <Icon name="chart-line" size={16} color={theme.primary} />
                      <Text style={styles.recentItemProgressText}>
                        {item.progress}%
                      </Text>
                    </View>
                    <Text style={[styles.statLabel, { marginLeft: 0 }]}>
                      {item.duration}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Quote of the day */}
          {currentQuote && (
            <View style={[styles.quoteCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.quoteText, { color: theme.text }]}>
                "{currentQuote.text}"
              </Text>
              <Text style={[styles.quoteAuthor, { color: theme.primary }]}>
                - {currentQuote.author}
              </Text>
            </View>
          )}

          {/* Today's Tasks */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Today's Study Plan
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Planner')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.todayTasksCard}>
            {localTasks.length > 0 ? (
              <>
                {localTasks.map(task => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskItem}
                    onPress={() => toggleTaskCompletion(task.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.priorityIndicator,
                        { backgroundColor: getPriorityColor(task.priority) },
                      ]}
                    />

                    <View style={styles.taskLeft}>
                      <View style={styles.taskCheckbox}>
                        <Icon
                          name={
                            task.completed
                              ? 'checkbox-marked-circle'
                              : 'checkbox-blank-circle-outline'
                          }
                          size={24}
                          color={task.completed ? theme.primary : theme.text}
                        />
                      </View>

                      <View style={styles.taskTextContainer}>
                        <Text
                          style={[
                            styles.taskText,
                            task.completed && {
                              textDecorationLine: 'line-through',
                              opacity: 0.7,
                            },
                          ]}
                        >
                          {task.title}
                        </Text>

                        <Text
                          style={[styles.taskSubject, { color: theme.text }]}
                        >
                          {task.priority === 'high'
                            ? 'High Priority'
                            : task.priority === 'medium'
                            ? 'Medium Priority'
                            : 'Low Priority'}
                        </Text>
                      </View>
                    </View>

                    <Icon name="chevron-right" size={20} color={theme.text} />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.actionButton}>
                  <Icon name="plus" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Add New Task</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.emptyTaskText}>
                No tasks scheduled for today
              </Text>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Quick Actions
            </Text>
          </View>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Timer')}
            >
              <View style={styles.quickActionIcon}>
                <Icon name="play-circle" size={28} color={theme.primary} />
              </View>
              <Text style={styles.quickActionText}>Start Study Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Quiz')}
            >
              <View style={styles.quickActionIcon}>
                <Icon name="file-document" size={28} color={theme.primary} />
              </View>
              <Text style={styles.quickActionText}>Practice Quizzes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Analytics')}
            >
              <View style={styles.quickActionIcon}>
                <Icon name="chart-line" size={28} color={theme.primary} />
              </View>
              <Text style={styles.quickActionText}>View Analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Resources')}
            >
              <View style={styles.quickActionIcon}>
                <Icon
                  name="book-open-variant"
                  size={28}
                  color={theme.primary}
                />
              </View>
              <Text style={styles.quickActionText}>Study Resources</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
