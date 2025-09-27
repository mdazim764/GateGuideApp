import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import { useIsFocused } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { useData } from '../context/DataContext';

const { width } = Dimensions.get('window');

const TimerScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const isFocused = useIsFocused();
  const { subjects, loading: dataLoading, fetchSubjects } = useData();

  // Timer state
  const [timerMode, setTimerMode] = useState('focus'); // focus, shortBreak, longBreak
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes in seconds
  const [completedSessions, setCompletedSessions] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  // Session tracking state
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Stats state
  const [todayStats, setTodayStats] = useState({
    totalSessions: 0,
    totalTimeMinutes: 0,
    goalMinutes: 120,
    goalCompletionPercentage: 0,
    currentStreak: 0,
    longestStreak: 0,
    subjectBreakdown: [],
  });
  const [loading, setLoading] = useState({
    subjects: true,
    stats: true,
    recommendations: true,
    weeklyStats: true,
  });
  const [recommendations, setRecommendations] = useState([]);

  // Weekly stats for chart
  const [weeklyStats, setWeeklyStats] = useState([]);

  // Modal states
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [newGoalMinutes, setNewGoalMinutes] = useState('');
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasMore, setHistoryHasMore] = useState(true);

  // Animations
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Timer modes in seconds
  const timerModes = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  // Set default subject when subjects are available
  useEffect(() => {
    if (subjects && subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].name);
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubject]);

  // Fetch today's stats whenever screen is focused or sessions completed
  useEffect(() => {
    const fetchTodayStats = async () => {
      if (!isFocused) return;

      try {
        setLoading(prev => ({ ...prev, stats: true }));
        const response = await api.session.getTodaysStats();
        if (response.data) {
          setTodayStats(response.data);
          setCompletedSessions(response.data.totalSessions);
          // Initialize new goal value
          setNewGoalMinutes(String(response.data.goalMinutes));

          // Animate progress bar
          Animated.timing(progressAnimation, {
            toValue: Math.min(response.data.goalCompletionPercentage / 100, 1),
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start();
        }
      } catch (error) {
        console.error("Error fetching today's stats:", error);
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }
    };

    fetchTodayStats();
  }, [isFocused, completedSessions]);

  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isFocused) return;

      try {
        setLoading(prev => ({ ...prev, recommendations: true }));
        const response = await api.session.getRecommendations();
        if (response.data && response.data.recommendations) {
          setRecommendations(response.data.recommendations);
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(prev => ({ ...prev, recommendations: false }));
      }
    };

    fetchRecommendations();
  }, [isFocused]);

  // Fetch weekly stats for chart
  useEffect(() => {
    const fetchWeeklyStats = async () => {
      if (!isFocused) return;

      try {
        setLoading(prev => ({ ...prev, weeklyStats: true }));
        const response = await api.session.getWeeklyStats(2); // Get 2 weeks
        if (response.data && response.data.length > 0) {
          setWeeklyStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching weekly stats:', error);
      } finally {
        setLoading(prev => ({ ...prev, weeklyStats: false }));
      }
    };

    fetchWeeklyStats();
  }, [isFocused, completedSessions]);

  // Timer effect
  useEffect(() => {
    let timer;

    if (isRunning) {
      if (timeRemaining > 0) {
        timer = setTimeout(() => {
          setTimeRemaining(timeRemaining - 1);
          setElapsedTime(elapsedTime + 1);
        }, 1000);
      } else {
        handleTimerComplete();
      }
    }

    return () => {
      clearTimeout(timer);
    };
  }, [isRunning, timeRemaining, elapsedTime]);

  // Start session with backend
  const startSession = useCallback(async () => {
    if (!selectedSubjectId) {
      Alert.alert(
        'Subject Required',
        'Please select a subject before starting the timer.',
      );
      return false;
    }

    try {
      // Only start a session on the backend for focus sessions
      if (timerMode === 'focus') {
        setSessionStartTime(new Date());
        // We don't need to create a session in backend until completion
      }
      return true;
    } catch (error) {
      console.error('Error starting session:', error);
      Alert.alert('Error', 'Failed to start session. Please try again.');
      return false;
    }
  }, [selectedSubjectId, timerMode]);

  // Complete session with backend
  const completeSession = useCallback(async () => {
    try {
      if (timerMode === 'focus' && elapsedTime > 0) {
        // Only log completed focus sessions
        const sessionData = {
          duration: elapsedTime, // seconds
          subjectId: selectedSubjectId,
          type: 'FOCUS',
          notes: `Completed a ${formatTime(elapsedTime)} focus session`,
        };

        const response = await api.session.logSession(sessionData);
        if (response.data) {
          setCurrentSessionId(response.data.session.id);
          // Update local state with new completion
          setCompletedSessions(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error completing session:', error);
      Alert.alert('Error', 'Failed to save your session. Please try again.');
    }
  }, [timerMode, elapsedTime, selectedSubjectId, formatTime]);

  // Handle timer completion
  const handleTimerComplete = useCallback(async () => {
    // Play sound or vibration here

    // Complete the session in the backend
    await completeSession();

    // Reset elapsed time for next session
    setElapsedTime(0);

    if (timerMode === 'focus') {
      // After 4 focus sessions, take a long break
      if ((completedSessions + 1) % 4 === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      // After break, go back to focus mode
      switchMode('focus');
    }
  }, [timerMode, completedSessions, completeSession, switchMode]);

  // Switch timer mode
  const switchMode = useCallback(
    mode => {
      setTimerMode(mode);
      setTimeRemaining(timerModes[mode]);
      setIsRunning(false);
      setElapsedTime(0);
    },
    [timerModes],
  );

  // Toggle timer
  const toggleTimer = useCallback(async () => {
    if (!isRunning) {
      // Starting the timer
      const success = await startSession();
      if (success) {
        setIsRunning(true);
      }
    } else {
      // Pausing the timer
      setIsRunning(false);
    }
  }, [isRunning, startSession]);

  // Reset timer
  const resetTimer = useCallback(() => {
    setTimeRemaining(timerModes[timerMode]);
    setIsRunning(false);
    setElapsedTime(0);
  }, [timerMode, timerModes]);

  // Format time as MM:SS
  const formatTime = useCallback(seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }, []);

  // Handle subject selection
  const handleSubjectSelect = useCallback(subject => {
    setSelectedSubject(subject.name);
    setSelectedSubjectId(subject.id);
  }, []);

  // Update study goal
  const updateGoal = useCallback(async () => {
    const goalMins = parseInt(newGoalMinutes);

    if (isNaN(goalMins) || goalMins <= 0) {
      Alert.alert(
        'Invalid Goal',
        'Please enter a positive number for your daily study goal.',
      );
      return;
    }

    try {
      await api.session.updateStudyGoal({ goalMinutes: goalMins });

      // Refresh today's stats to show updated goal
      const response = await api.session.getTodaysStats();
      if (response.data) {
        setTodayStats(response.data);
      }

      setGoalModalVisible(false);
      Alert.alert('Success', 'Study goal updated successfully');
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update study goal. Please try again.');
    }
  }, [newGoalMinutes]);

  // Fetch session history
  const fetchSessionHistory = useCallback(async (page = 1, reset = false) => {
    try {
      setLoading(prev => ({ ...prev, history: true }));

      const response = await api.session.getSessionHistory({
        page,
        limit: 10,
      });

      if (response.data) {
        if (reset) {
          setSessionHistory(response.data.sessions || []);
        } else {
          setSessionHistory(prev => [
            ...prev,
            ...(response.data.sessions || []),
          ]);
        }

        // Check if there are more pages
        if (response.data.pagination) {
          setHistoryHasMore(
            response.data.pagination.page < response.data.pagination.pages,
          );
        } else {
          setHistoryHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error fetching session history:', error);
      Alert.alert('Error', 'Failed to load session history. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  }, []);

  // Load more history
  const loadMoreHistory = useCallback(() => {
    if (historyHasMore && !loading.history) {
      const nextPage = historyPage + 1;
      setHistoryPage(nextPage);
      fetchSessionHistory(nextPage);
    }
  }, [historyHasMore, loading.history, historyPage, fetchSessionHistory]);

  // Open history modal
  const openHistoryModal = useCallback(() => {
    setHistoryPage(1);
    setSessionHistory([]);
    setHistoryModalVisible(true);
    fetchSessionHistory(1, true);
  }, [fetchSessionHistory]);

  // Render recommendations
  const renderRecommendations = () => {
    if (loading.recommendations) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={{ color: theme.text, marginLeft: 8 }}>
            Loading recommendations...
          </Text>
        </View>
      );
    }

    if (recommendations.length === 0) {
      return (
        <Text
          style={{
            color: theme.text,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          No recommendations available yet. Start studying to get personalized
          recommendations.
        </Text>
      );
    }

    return recommendations.slice(0, 3).map(subject => (
      <TouchableOpacity
        key={subject.id}
        style={[styles.recommendationItem, { backgroundColor: theme.card }]}
        onPress={() => handleSubjectSelect(subject)}
      >
        <Icon
          name={subject.neglected ? 'alert-circle-outline' : 'school-outline'}
          size={24}
          color={subject.neglected ? '#E57373' : theme.primary}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.recommendationTitle, { color: theme.text }]}>
            {subject.name}
          </Text>
          <Text
            style={[
              styles.recommendationSubtitle,
              { color: theme.textSecondary },
            ]}
          >
            {subject.neglected
              ? 'Needs attention'
              : `${subject.totalMinutes} minutes studied`}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    ));
  };

  // Format date for display
  const formatDate = dateString => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Prepare weekly chart data
  const prepareWeeklyChartData = () => {
    if (!weeklyStats || weeklyStats.length === 0) {
      return {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: [
          {
            data: [0, 0, 0, 0, 0, 0, 0],
          },
        ],
      };
    }

    // Use most recent week
    const latestWeek = weeklyStats[0];

    return {
      labels: latestWeek.dailyLabels || [
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
      ],
      datasets: [
        {
          data: latestWeek.dailyMinutes || [0, 0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  // Get color of progress bar
  const getProgressColor = percentage => {
    if (percentage >= 100) return '#4CAF50'; // Green
    if (percentage >= 70) return theme.primary;
    return '#FF9800'; // Orange
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'right', 'left']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Focus Timer</Text>

          <View style={styles.streakContainer}>
            <Icon name="fire" size={20} color="#FFA000" />
            <Text
              style={[styles.subtitle, { color: theme.text, marginLeft: 8 }]}
            >
              {todayStats.currentStreak} day streak
            </Text>
          </View>
        </View>

        {/* Timer Modes */}
        <View style={[styles.modeSelector, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              timerMode === 'focus' && [
                styles.activeModeButton,
                { backgroundColor: theme.primary },
              ],
            ]}
            onPress={() => switchMode('focus')}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: timerMode === 'focus' ? '#FFFFFF' : theme.text },
              ]}
            >
              Focus
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              timerMode === 'shortBreak' && [
                styles.activeModeButton,
                { backgroundColor: theme.primary },
              ],
            ]}
            onPress={() => switchMode('shortBreak')}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: timerMode === 'shortBreak' ? '#FFFFFF' : theme.text },
              ]}
            >
              Short Break
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              timerMode === 'longBreak' && [
                styles.activeModeButton,
                { backgroundColor: theme.primary },
              ],
            ]}
            onPress={() => switchMode('longBreak')}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: timerMode === 'longBreak' ? '#FFFFFF' : theme.text },
              ]}
            >
              Long Break
            </Text>
          </TouchableOpacity>
        </View>

        {/* Timer Display */}
        <View style={[styles.timerContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.timerText, { color: theme.text }]}>
            {formatTime(timeRemaining)}
          </Text>

          {/* Timer actions */}
          <View style={styles.timerActions}>
            <TouchableOpacity
              style={[
                styles.timerButton,
                { backgroundColor: `${theme.primary}20` },
              ]}
              onPress={resetTimer}
            >
              <Icon name="refresh" size={24} color={theme.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timerMainButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={toggleTimer}
            >
              <Icon
                name={isRunning ? 'pause' : 'play'}
                size={32}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timerButton,
                { backgroundColor: `${theme.primary}20` },
              ]}
              onPress={() => {
                // Skip to next mode
                if (timerMode === 'focus') {
                  if (isRunning) {
                    // Complete current session if running
                    completeSession().then(() => switchMode('shortBreak'));
                  } else {
                    switchMode('shortBreak');
                  }
                } else {
                  switchMode('focus');
                }
              }}
            >
              <Icon name="skip-next" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Subject Selection */}
        <View style={styles.subjectSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            What are you studying?
          </Text>

          {dataLoading.subjects ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subjectOptions}
            >
              {subjects.map(subject => (
                <TouchableOpacity
                  key={subject.id}
                  style={[
                    styles.subjectButton,
                    { backgroundColor: theme.card },
                    selectedSubjectId === subject.id && {
                      backgroundColor: `${theme.primary}20`,
                      borderColor: theme.primary,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => handleSubjectSelect(subject)}
                >
                  <Text
                    style={[
                      styles.subjectButtonText,
                      { color: theme.text },
                      selectedSubjectId === subject.id && {
                        color: theme.primary,
                      },
                    ]}
                  >
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Today's Stats */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.text, marginBottom: 0 },
                ]}
              >
                Today's Stats
              </Text>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={openHistoryModal}
              >
                <Text style={{ color: theme.primary, fontSize: 14 }}>
                  View History
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.goalButton}
              onPress={() => setGoalModalVisible(true)}
            >
              <Icon name="pencil" size={16} color={theme.primary} />
              <Text style={[styles.goalButtonText, { color: theme.primary }]}>
                Set Goal
              </Text>
            </TouchableOpacity>
          </View>

          {/* Goal progress bar */}
          <View style={styles.goalProgressContainer}>
            <View style={styles.goalProgressBarContainer}>
              <Animated.View
                style={[
                  styles.goalProgressBar,
                  {
                    backgroundColor: getProgressColor(
                      todayStats.goalCompletionPercentage,
                    ),
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.goalProgressText, { color: theme.text }]}>
              {todayStats.totalTimeMinutes}/{todayStats.goalMinutes} min
              {todayStats.goalCompletionPercentage >= 100 && ' 🎉'}
            </Text>
          </View>

          {loading.stats ? (
            <View
              style={[
                styles.statsCard,
                {
                  backgroundColor: theme.card,
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 30,
                },
              ]}
            >
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : (
            <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
              <View style={styles.statItem}>
                <Icon name="clock-outline" size={24} color={theme.primary} />
                <View style={styles.statContent}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {formatTime(todayStats.totalTimeMinutes * 60)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.text }]}>
                    Focus Time
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: `${theme.text}20` },
                ]}
              />

              <View style={styles.statItem}>
                <Icon name="check-circle" size={24} color={theme.primary} />
                <View style={styles.statContent}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {todayStats.totalSessions}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.text }]}>
                    Sessions
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Weekly chart */}
          {!loading.weeklyStats && weeklyStats.length > 0 && (
            <View
              style={[styles.chartContainer, { backgroundColor: theme.card }]}
            >
              <Text style={[styles.chartTitle, { color: theme.text }]}>
                This Week
              </Text>

              <LineChart
                data={prepareWeeklyChartData()}
                width={width - 48}
                height={180}
                chartConfig={{
                  backgroundColor: theme.card,
                  backgroundGradientFrom: theme.card,
                  backgroundGradientTo: theme.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    `rgba(${
                      theme.isDark ? '255, 255, 255' : '0, 0, 0'
                    }, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '5',
                    strokeWidth: '2',
                    stroke: theme.primary,
                  },
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                bezier
              />

              <Text
                style={[styles.chartSubtitle, { color: theme.textSecondary }]}
              >
                {weeklyStats[0]?.totalMinutes || 0} minutes total this week
              </Text>
            </View>
          )}
        </View>

        {/* Recommended Subjects */}
        <View style={styles.recommendationsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recommended Subjects
          </Text>

          <View style={styles.recommendationsContainer}>
            {renderRecommendations()}
          </View>
        </View>
      </ScrollView>

      {/* Goal Setting Modal */}
      <Modal
        visible={goalModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Set Daily Study Goal
            </Text>

            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              How many minutes do you want to study each day?
            </Text>

            <TextInput
              style={[
                styles.goalInput,
                {
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderColor: `${theme.text}20`,
                },
              ]}
              value={newGoalMinutes}
              onChangeText={setNewGoalMinutes}
              placeholder="120"
              placeholderTextColor={`${theme.text}50`}
              keyboardType="number-pad"
              maxLength={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.primary }]}
                onPress={() => setGoalModalVisible(false)}
              >
                <Text style={{ color: theme.primary }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={updateGoal}
              >
                <Text style={{ color: '#FFFFFF' }}>Update Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Session History Modal */}
      <Modal
        visible={historyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View
          style={[
            styles.historyModalContainer,
            { backgroundColor: theme.background },
          ]}
        >
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: theme.text }]}>
              Study Session History
            </Text>

            <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {loading.history && sessionHistory.length === 0 ? (
            <View style={styles.centeredContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.text }]}>
                Loading session history...
              </Text>
            </View>
          ) : sessionHistory.length === 0 ? (
            <View style={styles.centeredContainer}>
              <Icon name="history" size={64} color={`${theme.text}30`} />
              <Text style={[styles.emptyStateText, { color: theme.text }]}>
                No study sessions found
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtext,
                  { color: theme.textSecondary },
                ]}
              >
                Start using the focus timer to track your study sessions
              </Text>
            </View>
          ) : (
            <FlatList
              data={sessionHistory}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              onEndReached={loadMoreHistory}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                loading.history ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.primary}
                    style={{ marginVertical: 16 }}
                  />
                ) : null
              }
              renderItem={({ item }) => (
                <View
                  style={[styles.historyItem, { backgroundColor: theme.card }]}
                >
                  <View style={styles.historyItemHeader}>
                    <Text
                      style={[
                        styles.historyItemSubject,
                        { color: theme.primary },
                      ]}
                    >
                      {item.subject?.name || 'Unknown Subject'}
                    </Text>
                    <Text
                      style={[
                        styles.historyItemDate,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {formatDate(item.startTime)}
                    </Text>
                  </View>

                  <View style={styles.historyItemContent}>
                    <Icon
                      name="clock-outline"
                      size={20}
                      color={theme.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.historyItemDuration,
                        { color: theme.text },
                      ]}
                    >
                      {formatTime(item.duration)}
                    </Text>

                    {item.topic && (
                      <View style={styles.topicChip}>
                        <Text style={styles.topicChipText}>
                          {item.topic.name}
                        </Text>
                      </View>
                    )}
                  </View>

                  {item.notes && (
                    <Text
                      style={[
                        styles.historyItemNotes,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {item.notes}
                    </Text>
                  )}
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 24,
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  modeSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeModeButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  modeButtonText: {
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 40,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  timerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  timerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  timerMainButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  subjectSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyButton: {
    marginLeft: 10,
    padding: 6,
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  goalButtonText: {
    marginLeft: 4,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subjectOptions: {
    paddingRight: 16,
  },
  subjectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
  },
  subjectButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  goalProgressContainer: {
    marginBottom: 16,
  },
  goalProgressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  goalProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  goalProgressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statContent: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 24,
  },
  recommendationsSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  recommendationsContainer: {
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  recommendationSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  // Chart styles
  chartContainer: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  chartSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 24,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  goalInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 8,
  },
  // History modal styles
  historyModalContainer: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '70%',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  historyItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemSubject: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyItemDate: {
    fontSize: 12,
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  historyItemDuration: {
    fontSize: 15,
    fontWeight: '500',
    marginRight: 12,
  },
  historyItemNotes: {
    fontSize: 14,
    marginTop: 8,
  },
  topicChip: {
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 'auto',
  },
  topicChipText: {
    fontSize: 12,
    color: '#4285F4',
  },
});

export default TimerScreen;
