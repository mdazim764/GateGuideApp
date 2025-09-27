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
  StatusBar,
  Button,
  SafeAreaView as RNSafeAreaView, // Fallback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNotification } from '../context/NotificationContext'; // Add this import

// Import your components
import QuoteCard from '../components/quotes/QuoteCard';
import NotificationBadge from '../components/NotificationBadge'; // Add this import
import crashlytics from '@react-native-firebase/crashlytics';
const { width } = Dimensions.get('window');

// Default theme fallback to prevent undefined errors
const defaultTheme = {
  background: '#FFFFFF',
  text: '#000000',
  primary: '#007AFF',
  card: '#F5F5F5',
};

// Import static quotes for fallback
const staticQuotes = [
  {
    text: 'The expert in anything was once a beginner.',
    author: 'Helen Hayes',
    type: 'motivation',
  },
  {
    text: 'The beautiful thing about learning is that no one can take it away from you.',
    author: 'B.B. King',
    type: 'education',
  },
  {
    text: 'Education is the passport to the future.',
    author: 'Malcolm X',
    type: 'education',
  },
  {
    text: 'The more that you read, the more things you will know.',
    author: 'Dr. Seuss',
    type: 'learning',
  },
  {
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    type: 'motivation',
  },
];

const HomeScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const { unreadCount } = useNotification(); // Add this line
  // Extract the quote functions at the component level
  const { fetchDailyQuote, fetchRandomQuote: appFetchRandomQuote } = useApp();

  // States for data
  const [dashboardData, setDashboardData] = useState(null);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [studyStreak, setStudyStreak] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [isMounted, setIsMounted] = useState(false);

  // Add loading state for quotes
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Add a flag to track if we've already loaded the daily quote
  const [dailyQuoteLoaded, setDailyQuoteLoaded] = useState(false);

  // Calculate remaining days until deadline (Feb 1, 2026)
  const calculateRemainingDays = () => {
    const today = new Date();
    const deadline = new Date('2026-02-01');
    const timeDiff = deadline.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(0, daysDiff);
  };

  const [remainingDays, setRemainingDays] = useState(calculateRemainingDays());

  // Animation for entrance
  useEffect(() => {
    console.log('Running entrance animations');
    setIsMounted(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('Animation complete');
    });
  }, []);

  // Add a state for the current quote
  const [currentQuote, setCurrentQuote] = useState({
    text: 'Learning is not attained by chance, it must be sought for with ardor and diligence.',
    author: 'Abigail Adams',
    type: 'daily',
  });

  // Improved fetchQuote function that prioritizes daily quote from database
  const fetchQuote = async (forceRefresh = false) => {
    try {
      // If we've already loaded the daily quote and don't need to refresh, skip API call
      if (dailyQuoteLoaded && !forceRefresh) {
        return;
      }

      setQuoteLoading(true);

      // First try to get the daily quote
      try {
        const response = await api.quotes.getToday();
        if (response.data) {
          setCurrentQuote({
            ...response.data,
            type: response.data.type || 'daily',
          });
          console.log('Daily quote response:', response);
          setDailyQuoteLoaded(true);
          return;
        }
      } catch (dailyError) {
        console.log('Error fetching daily quote:', dailyError);

        // Fall back to personalized quote
        try {
          const response = await api.quotes.getPersonalized();
          if (response.data) {
            setCurrentQuote({
              ...response.data,
              type: response.data.type || 'personalized',
            });
            console.log('Personalized quote response:', response);
            setDailyQuoteLoaded(true);
            return;
          }
        } catch (personalizedError) {
          console.log('Error fetching personalized quote:', personalizedError);

          // Finally fall back to static quotes
          const randomIndex = Math.floor(Math.random() * staticQuotes.length);
          setCurrentQuote(staticQuotes[randomIndex]);
          setDailyQuoteLoaded(true);
        }
      }
    } catch (error) {
      console.log('Error fetching quote:', error);

      // Final fallback to static quotes if all else fails
      const randomIndex = Math.floor(Math.random() * staticQuotes.length);
      setCurrentQuote(staticQuotes[randomIndex]);
    } finally {
      setQuoteLoading(false);
    }
  };

  // Function to load data from API
  const loadDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      // Implement separate try/catch blocks for each API call
      // so one failure doesn't prevent others from loading

      // 1. Load summary data
      try {
        const summaryResponse = await api.dashboard.getSummary();
        setDashboardData(summaryResponse.data);
      } catch (summaryError) {
        console.log('Error loading summary:', summaryError);
        // Set default empty data
        setDashboardData({
          overallProgress: 0,
          completedSubtopics: 0,
          totalSubtopics: 0,
          quizzesTaken: 0,
          averageScore: 0,
          totalHoursStudied: 0,
        });
      }

      // 2. Load recent quizzes
      try {
        const quizzesResponse = await api.dashboard.getRecentQuizzes();
        setRecentQuizzes(quizzesResponse.data);
      } catch (quizzesError) {
        console.log('Error loading quizzes:', quizzesError);
        setRecentQuizzes([]);
      }

      // 3. Load study streak
      try {
        const streakResponse = await api.dashboard.getStudyStreak();
        setStudyStreak(streakResponse.data);
      } catch (streakError) {
        console.log('Error loading streak:', streakError);
        setStudyStreak({
          currentStreak: 0,
          longestStreak: 0,
        });
      }

      // Update remaining days calculation
      setRemainingDays(calculateRemainingDays());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Could not load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchQuote(false); // Get quote without forcing refresh
    loadDashboardData();
  }, []);

  // Inside your MainScreen component:
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Set status bar color properly
      if (theme.background === '#121212') {
        StatusBar.setBackgroundColor('#121212');
        StatusBar.setBarStyle('light-content');
      } else {
        StatusBar.setBackgroundColor('#FFFFFF');
        StatusBar.setBarStyle('dark-content');
      }

      // Use the recommended approach for navigation bar color
      const setNavigationBarColor = async () => {
        try {
          if (theme.background === '#121212') {
            await changeNavigationBarColor('#121212', false);
          } else {
            await changeNavigationBarColor('#FFFFFF', false);
          }
          // await changeNavigationBarColor('#0284c7', false);
        } catch (e) {
          console.log(e);
        }
      };

      setNavigationBarColor();
    }
  }, []);

  // Pull-to-refresh handler
  const handleRefresh = () => {
    loadDashboardData(true);
    // Don't refresh quote on pull-to-refresh
  };

  if (loading && !refreshing) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* <Button
        title="Test Crash"
        onPress={() => {
          console.log('Forcing a crash!');
          crashlytics().crash();
        }}
      /> */}
      {theme.background === '#121212' && Platform.OS === 'android'
        ? (console.log(
            'Rendering dark mode status bar for Android',
            theme.background,
          ),
          (
            <StatusBar
              backgroundColor={'#BB86FC'}
              barStyle={'light-content'}
              translucent={true}
            />
          ))
        : (console.log(
            'Rendering light mode status bar for Android',
            theme.background,
          ),
          (
            <StatusBar
              backgroundColor={'#FFFFFF'}
              barStyle={'dark-content'}
              // translucent={true}
            />
          ))}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: theme.card,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View>
          <Text style={[styles.greeting, { color: theme.text }]}>
            Hello, {user?.name || 'Student'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Add notification and settings buttons */}
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Icon name="bell-outline" size={24} color={theme.text} />
            <NotificationBadge
              count={unreadCount}
              size="small"
              containerStyle={{ position: 'absolute', top: 0, right: 0 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              navigation.navigate('MoreTab', { screen: 'Settings' })
            }
          >
            <Icon name="cog" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle-outline" size={48} color="#E53935" />
            <Text style={[styles.errorText, { color: theme.text }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={() => loadDashboardData()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Progress Overview */}
            <Animated.View
              style={[
                styles.section,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Your Progress
              </Text>
              <View style={styles.progressCards}>
                <View
                  style={[styles.progressCard, { backgroundColor: theme.card }]}
                >
                  <Icon
                    name="book-open-variant"
                    size={24}
                    color={theme.primary}
                  />
                  <Text style={[styles.progressValue, { color: theme.text }]}>
                    {dashboardData?.overallProgress || 0}%
                  </Text>
                  <Text
                    style={[
                      styles.progressLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Overall Syllabus
                  </Text>
                </View>

                <View
                  style={[styles.progressCard, { backgroundColor: theme.card }]}
                >
                  <Icon name="fire" size={24} color="#FF9800" />
                  <Text style={[styles.progressValue, { color: theme.text }]}>
                    {studyStreak?.currentStreak || 0}
                  </Text>
                  <Text
                    style={[
                      styles.progressLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Day Streak
                  </Text>
                </View>

                <View
                  style={[styles.progressCard, { backgroundColor: theme.card }]}
                >
                  <Icon name="check-circle" size={24} color="#4CAF50" />
                  <Text style={[styles.progressValue, { color: theme.text }]}>
                    {dashboardData?.completedSubtopics || 0}/
                    {dashboardData?.totalSubtopics || 0}
                  </Text>
                  <Text
                    style={[
                      styles.progressLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Topics Done
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* GATE Countdown */}
            <Animated.View
              style={[
                styles.section,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                GATE Countdown
              </Text>
              <View
                style={[styles.countdownCard, { backgroundColor: theme.card }]}
              >
                <Icon name="calendar-clock" size={32} color={theme.primary} />
                <View style={styles.countdownDetails}>
                  <Text style={[styles.daysCount, { color: theme.text }]}>
                    {remainingDays}
                  </Text>
                  <Text
                    style={[styles.daysLabel, { color: theme.textSecondary }]}
                  >
                    days remaining
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.planButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() =>
                    navigation.navigate('MoreTab', { screen: 'Planner' })
                  }
                >
                  <Text style={styles.planButtonText}>View Plan</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Quick Actions */}
            <Animated.View
              style={[
                styles.section,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Quick Actions
              </Text>
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.card }]}
                  onPress={() => navigation.navigate('Quiz')}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: '#E3F2FD' },
                    ]}
                  >
                    <Icon name="help-circle" size={24} color="#2196F3" />
                  </View>
                  <Text style={[styles.actionText, { color: theme.text }]}>
                    Take Quiz
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.card }]}
                  onPress={() => {
                    // Fix 1: For SyllabusStack navigation
                    navigation.navigate('Syllabus', {
                      screen: 'Syllabus',
                    });
                  }}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: '#E8F5E9' },
                    ]}
                  >
                    <Icon name="book-open-variant" size={24} color="#4CAF50" />
                  </View>
                  <Text style={[styles.actionText, { color: theme.text }]}>
                    Syllabus
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.card }]}
                  onPress={() => {
                    // Fix 2: For AIGuide navigation
                    navigation.navigate('AiGuide');
                  }}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: '#FFF3E0' },
                    ]}
                  >
                    <Icon name="robot" size={24} color="#FF9800" />
                  </View>
                  <Text style={[styles.actionText, { color: theme.text }]}>
                    AI Guide
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.card }]}
                  onPress={() => navigation.navigate('Analytics')}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: '#F3E5F5' },
                    ]}
                  >
                    <Icon name="chart-line" size={24} color="#9C27B0" />
                  </View>
                  <Text style={[styles.actionText, { color: theme.text }]}>
                    Analytics
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Recent Quiz Results */}
            <Animated.View
              style={[
                styles.section,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Recent Quiz Results
              </Text>
              {recentQuizzes && recentQuizzes.length > 0 ? (
                recentQuizzes.map((quiz, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.quizCard, { backgroundColor: theme.card }]}
                    onPress={() =>
                      navigation.navigate('QuizResult', { quizId: quiz.id })
                    }
                  >
                    <View style={styles.quizInfo}>
                      <Text
                        style={[styles.quizTitle, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {quiz.title}
                      </Text>
                      <Text
                        style={[
                          styles.quizDate,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {new Date(quiz.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.scoreContainer}>
                      <Text
                        style={[
                          styles.score,
                          {
                            color:
                              quiz.score >= 70
                                ? '#4CAF50'
                                : quiz.score >= 40
                                ? '#FF9800'
                                : '#F44336',
                          },
                        ]}
                      >
                        {quiz.score}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View
                  style={[styles.emptyState, { backgroundColor: theme.card }]}
                >
                  <Icon
                    name="clipboard-text-outline"
                    size={48}
                    color={`${theme.text}30`}
                  />
                  <Text
                    style={[styles.emptyText, { color: theme.textSecondary }]}
                  >
                    No quizzes taken yet
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.startButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => navigation.navigate('Quiz')}
                  >
                    <Text style={styles.startButtonText}>
                      Take Your First Quiz
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>

            {/* Motivational Quote */}
            <Animated.View
              style={[
                styles.section,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.sectionTitleContainer}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Daily Inspiration
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Quotes')}
                  style={styles.refreshQuoteButton}
                >
                  <Icon name="arrow-right" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>

              {quoteLoading ? (
                <View
                  style={[
                    styles.quoteLoadingContainer,
                    { backgroundColor: theme.card },
                  ]}
                >
                  <ActivityIndicator size="small" color={theme.primary} />
                </View>
              ) : (
                <View
                  style={[styles.quoteCard, { backgroundColor: theme.card }]}
                >
                  {currentQuote.type && (
                    <View style={styles.quoteTypeContainer}>
                      <Text
                        style={[
                          styles.quoteType,
                          {
                            backgroundColor: theme.primary + '20',
                            color: '#FFFFFF',
                            width: 'auto',
                            fontSize: 10,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 10,
                            overflow: 'hidden',
                          },
                        ]}
                      >
                        {currentQuote.type?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.quoteText, { color: theme.text }]}>
                    "{currentQuote.text}"
                  </Text>
                  <Text style={[styles.quoteAuthor, { color: theme.primary }]}>
                    - {currentQuote.author}
                  </Text>

                  <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={() => navigation.navigate('Quotes')}
                  >
                    <Text style={{ color: theme.primary }}>
                      View more quotes
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function for determining quote tag color
const getTypeColor = (type, theme) => {
  if (!type) return theme.textSecondary + '80';

  switch (type.toLowerCase()) {
    case 'daily':
      return theme.success + 'CC';
    case 'personalized':
      return theme.primary + 'CC';
    case 'motivation':
      return '#FF9800CC';
    case 'education':
      return '#2196F3CC';
    case 'learning':
      return '#9C27B0CC';
    case 'random':
      return theme.accent + 'CC';
    default:
      return theme.textSecondary + '80';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  countdownCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownDetails: {
    flex: 1,
    marginLeft: 16,
  },
  daysCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  daysLabel: {
    fontSize: 14,
  },
  planButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  planButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 12,
    fontWeight: '500',
  },
  quizCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  quizDate: {
    fontSize: 12,
    marginTop: 4,
  },
  scoreContainer: {
    backgroundColor: '#F5F5F5',
    height: 48,
    width: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  score: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  startButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshQuoteButton: {
    padding: 8,
  },
  quoteLoadingContainer: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  quoteCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  quoteTypeContainer: {
    marginBottom: 8,
  },
  quoteType: {
    backgroundColor: '#E3F2FD',
    color: '#2196F3',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  viewMoreButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
});

export default HomeScreen;
