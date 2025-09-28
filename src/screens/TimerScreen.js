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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import { useIsFocused } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { useData } from '../context/DataContext';
import DropDownPicker from 'react-native-dropdown-picker';

const { width } = Dimensions.get('window');

const TimerScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const isFocused = useIsFocused();
  const { subjects, loading: dataLoading, fetchSubjects } = useData();

  // Timer state
  const [timerMode, setTimerMode] = useState('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [topicItems, setTopicItems] = useState([]);
  const [topicOpen, setTopicOpen] = useState(false);

  // Session tracking state
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerCompleted, setTimerCompleted] = useState(false); // Flag to prevent double submission

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
    history: false,
    topics: false, // Add this
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

  // Custom session modal
  const [customSessionVisible, setCustomSessionVisible] = useState(false);
  const [customDuration, setCustomDuration] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [customNotes, setCustomNotes] = useState('');

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

      // Also fetch topics for the default subject
      if (subjects[0].id) {
        fetchTopicsForSubject(subjects[0].id);
      }
    }
  }, [subjects, selectedSubject]);

  // Fetch topics when subject changes
  const fetchTopicsForSubject = useCallback(async subjectId => {
    try {
      // Use getSubjectDetail instead of getSubject
      const response = await api.academic.getSubjectDetail(subjectId);

      if (response.data && response.data.units) {
        // Extract all topics from all units
        const allTopics = response.data.units.flatMap(unit =>
          unit.topics.map(topic => ({
            label: topic.name,
            value: topic.id,
          })),
        );

        setTopicItems([
          { label: 'General (No specific topic)', value: null },
          ...allTopics,
        ]);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchTopicsForSubject(selectedSubjectId);
    }
  }, [selectedSubjectId, fetchTopicsForSubject]);

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
        console.error('Error fetching today stats:', error);
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
        if (response.data) {
          setRecommendations(response.data.recommendations || []);
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
      } else if (!timerCompleted && timeRemaining === 0) {
        // Only handle completion if not already completed
        setTimerCompleted(true);
        handleTimerComplete();
      }
    }

    return () => {
      clearTimeout(timer);
    };
  }, [
    isRunning,
    timeRemaining,
    elapsedTime,
    timerCompleted,
    handleTimerComplete,
  ]);

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
      if (timerMode === 'focus') {
        setSessionStartTime(new Date());
        setTimerCompleted(false); // Reset completed flag when starting a new session
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
          topicId: selectedTopicId,
          type: 'FOCUS',
          notes: `Focus session: ${formatTime(elapsedTime)}`,
        };

        const response = await api.session.logSession(sessionData);

        if (response.data) {
          console.log('Session logged successfully:', response.data);
          setCompletedSessions(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error completing session:', error);
      Alert.alert('Error', 'Failed to log study session');
    }
  }, [timerMode, elapsedTime, selectedSubjectId, selectedTopicId, formatTime]);

  // Handle timer completion
  const handleTimerComplete = useCallback(async () => {
    if (timerCompleted) return; // Already completed, prevent double submission

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
  }, [
    timerMode,
    timerCompleted,
    completedSessions,
    completeSession,
    switchMode,
  ]);

  // Submit custom session
  const handleSubmitCustomSession = useCallback(async () => {
    // Validate input
    if (!selectedSubjectId) {
      Alert.alert('Error', 'Please select a subject');
      return;
    }

    const hours = parseInt(customDuration) || 0;
    const minutes = parseInt(customMinutes) || 0;

    if (hours === 0 && minutes === 0) {
      Alert.alert('Error', 'Please enter a valid duration');
      return;
    }

    const totalSeconds = hours * 60 * 60 + minutes * 60;

    try {
      const sessionData = {
        duration: totalSeconds,
        subjectId: selectedSubjectId,
        topicId: selectedTopicId,
        type: 'FOCUS',
        notes: customNotes || `Manual entry: ${hours}h ${minutes}m`,
      };

      const response = await api.session.logSession(sessionData);

      if (response.data) {
        // Reset form
        setCustomDuration('');
        setCustomMinutes('');
        setCustomNotes('');
        setCustomSessionVisible(false);

        // Refresh stats
        setCompletedSessions(prev => prev + 1);

        Alert.alert('Success', 'Study session logged successfully');
      }
    } catch (error) {
      console.error('Error submitting custom session:', error);
      Alert.alert('Error', 'Failed to log custom session');
    }
  }, [
    selectedSubjectId,
    selectedTopicId,
    customDuration,
    customMinutes,
    customNotes,
  ]);

  // Switch timer mode
  const switchMode = useCallback(
    mode => {
      setTimerMode(mode);
      setTimeRemaining(timerModes[mode]);
      setIsRunning(false);
      setElapsedTime(0);
      setTimerCompleted(false); // Reset completed flag when switching modes
      setManualTimerMode(false); // Switch back to pomodoro mode if in manual
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
    setTimerCompleted(false); // Reset completed flag when resetting timer
  }, [timerMode, timerModes]);

  // Format time as MM:SS
  const formatTime = useCallback(seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }, []);

  // Format time in HH:MM:SS format
  const formatTimeHMS = useCallback(seconds => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle subject selection
  const handleSubjectSelect = useCallback(
    subject => {
      setSelectedSubject(subject.name);
      setSelectedSubjectId(subject.id);
      setSelectedTopicId(null); // Reset topic selection when subject changes

      // Fetch topics for the selected subject
      fetchTopicsForSubject(subject.id);
    },
    [fetchTopicsForSubject],
  );

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
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading recommendations...
          </Text>
        </View>
      );
    }

    if (recommendations.length === 0) {
      return (
        <View style={styles.emptyRecommendationsContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No recommendations available
          </Text>
        </View>
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
            color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
            strokeWidth: 2,
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
    if (percentage >= 70) return '#8BC34A'; // Light Green
    return '#FF9800'; // Orange
  };

  // Add this state for manual timer
  const [manualTimerMode, setManualTimerMode] = useState(false);
  const [manualElapsedTime, setManualElapsedTime] = useState(0);
  const [manualTimerRunning, setManualTimerRunning] = useState(false);

  // Add this effect for the manual timer
  useEffect(() => {
    let timer;

    if (manualTimerRunning) {
      timer = setInterval(() => {
        setManualElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [manualTimerRunning]);

  // Add these functions to control the manual timer
  const startManualTimer = () => {
    setManualTimerRunning(true);
  };

  const pauseManualTimer = () => {
    setManualTimerRunning(false);
  };

  const resetManualTimer = () => {
    setManualElapsedTime(0);
    setManualTimerRunning(false);
  };

  const submitManualSession = async () => {
    if (manualElapsedTime === 0 || !selectedSubjectId) {
      Alert.alert(
        'Error',
        'Please select a subject and record some time before submitting',
      );
      return;
    }

    try {
      const sessionData = {
        duration: manualElapsedTime,
        subjectId: selectedSubjectId,
        topicId: selectedTopicId,
        type: 'FOCUS',
        notes: `Manual session: ${formatTime(manualElapsedTime)}`,
      };

      const response = await api.session.logSession(sessionData);

      if (response.data) {
        Alert.alert('Success', 'Study session logged successfully');
        resetManualTimer();
        setCompletedSessions(prev => prev + 1);
        // Refresh stats after submission
        // fetchTodayStats();
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Error logging manual session:', error);
      Alert.alert('Error', 'Failed to log study session');
    }
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
              manualTimerMode && { backgroundColor: theme.primary },
            ]}
            onPress={() => setManualTimerMode(true)}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: manualTimerMode ? '#FFFFFF' : theme.text },
              ]}
            >
              Manual
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              timerMode === 'focus' &&
                !manualTimerMode && [
                  styles.activeModeButton,
                  { backgroundColor: theme.primary },
                ],
            ]}
            onPress={() => switchMode('focus')}
          >
            <Text
              style={[
                styles.modeButtonText,
                {
                  color:
                    timerMode === 'focus' && !manualTimerMode
                      ? '#FFFFFF'
                      : theme.text,
                },
              ]}
            >
              Focus
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              timerMode === 'shortBreak' &&
                !manualTimerMode && [
                  styles.activeModeButton,
                  { backgroundColor: theme.primary },
                ],
            ]}
            onPress={() => switchMode('shortBreak')}
          >
            <Text
              style={[
                styles.modeButtonText,
                {
                  color:
                    timerMode === 'shortBreak' && !manualTimerMode
                      ? '#FFFFFF'
                      : theme.text,
                },
              ]}
            >
              Short Break
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              timerMode === 'longBreak' &&
                !manualTimerMode && [
                  styles.activeModeButton,
                  { backgroundColor: theme.primary },
                ],
            ]}
            onPress={() => switchMode('longBreak')}
          >
            <Text
              style={[
                styles.modeButtonText,
                {
                  color:
                    timerMode === 'longBreak' && !manualTimerMode
                      ? '#FFFFFF'
                      : theme.text,
                },
              ]}
            >
              Long Break
            </Text>
          </TouchableOpacity>
        </View>

        {/* Timer Display */}

        {/* Manual timer UI */}
        {manualTimerMode && (
          <View
            style={[styles.timerContainer, { backgroundColor: theme.card }]}
          >
            <Text style={[styles.timerText, { color: theme.text }]}>
              {formatTimeHMS(manualElapsedTime)}
            </Text>

            <Text style={[styles.elapsedText, { color: theme.textSecondary }]}>
              Time elapsed
            </Text>

            <View style={styles.timerActions}>
              <TouchableOpacity
                style={[
                  styles.timerButton,
                  { backgroundColor: `${theme.primary}20` },
                ]}
                onPress={resetManualTimer}
              >
                <Icon name="refresh" size={24} color={theme.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.timerMainButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={
                  manualTimerRunning ? pauseManualTimer : startManualTimer
                }
              >
                <Icon
                  name={manualTimerRunning ? 'pause' : 'play'}
                  size={32}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.timerButton,
                  { backgroundColor: `${theme.primary}20` },
                ]}
                onPress={submitManualSession}
              >
                <Icon name="check" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Original pomodoro timer UI - wrap this in conditional rendering */}
        {!manualTimerMode && (
          <View
            style={[styles.timerContainer, { backgroundColor: theme.card }]}
          >
            {/* Main timer (countdown) */}
            <Text style={[styles.timerText, { color: theme.text }]}>
              {formatTime(timeRemaining)}
            </Text>

            {/* Elapsed time display */}
            {elapsedTime > 0 && (
              <Text
                style={[styles.elapsedText, { color: theme.textSecondary }]}
              >
                Elapsed: {formatTimeHMS(elapsedTime)}
              </Text>
            )}

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
                  if (isRunning) {
                    // First stop the timer
                    setIsRunning(false);
                  }

                  // Skip to next mode
                  if (timerMode === 'focus') {
                    // Complete the current focus session if elapsed time > 0
                    if (elapsedTime > 0 && !timerCompleted) {
                      setTimerCompleted(true); // Set flag to prevent double submission
                      completeSession().then(() => {
                        // After 4 focus sessions, take a long break
                        if ((completedSessions + 1) % 4 === 0) {
                          switchMode('longBreak');
                        } else {
                          switchMode('shortBreak');
                        }
                      });
                    } else {
                      // No elapsed time or already completed, just switch
                      if ((completedSessions + 1) % 4 === 0) {
                        switchMode('longBreak');
                      } else {
                        switchMode('shortBreak');
                      }
                    }
                  } else {
                    // After break, switch to focus
                    switchMode('focus');
                  }
                }}
              >
                <Icon name="skip-next" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Subject and Topic Selection - Enhanced version */}
        <View style={styles.subjectSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              What are you studying?
            </Text>

            {/* Custom time entry button */}
            <TouchableOpacity
              style={[
                styles.customLogButton,
                { backgroundColor: `${theme.primary}20` },
              ]}
              onPress={() => setCustomSessionVisible(true)}
            >
              <Icon name="pencil-plus" size={16} color={theme.primary} />
              <Text
                style={{ color: theme.primary, fontSize: 14, marginLeft: 4 }}
              >
                Custom Entry
              </Text>
            </TouchableOpacity>
          </View>

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

          {/* Enhanced Topic Selection - similar to PlannerScreen */}
          {selectedSubjectId && (
            <View style={styles.topicContainer}>
              <Text style={[styles.topicLabel, { color: theme.text }]}>
                Topic (optional)
              </Text>

              {/* Show loading indicator while fetching topics */}
              {loading.topics ? (
                <ActivityIndicator
                  size="small"
                  color={theme.primary}
                  style={{ marginVertical: 10 }}
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.topicSelector}
                >
                  <TouchableOpacity
                    style={[
                      styles.topicOption,
                      { borderColor: `${theme.text}30` },
                      !selectedTopicId && {
                        backgroundColor: `${theme.primary}20`,
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => setSelectedTopicId(null)}
                  >
                    <Text
                      style={[
                        styles.topicText,
                        {
                          color: !selectedTopicId ? theme.primary : theme.text,
                        },
                      ]}
                    >
                      None
                    </Text>
                  </TouchableOpacity>

                  {topicItems.map(topic => (
                    <TouchableOpacity
                      key={topic.value}
                      style={[
                        styles.topicOption,
                        { borderColor: `${theme.text}30` },
                        selectedTopicId === topic.value && {
                          backgroundColor: `${theme.primary}20`,
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => setSelectedTopicId(topic.value)}
                    >
                      <Text
                        style={[
                          styles.topicText,
                          {
                            color:
                              selectedTopicId === topic.value
                                ? theme.primary
                                : theme.text,
                          },
                        ]}
                      >
                        {topic.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
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

      {/* Custom Session Entry Modal */}
      <Modal
        visible={customSessionVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomSessionVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.card, width: '90%', maxWidth: 400 },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Add Custom Study Session
              </Text>

              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                How long did you study?
              </Text>

              <View style={styles.customTimeRow}>
                <View style={styles.customTimeInputContainer}>
                  <TextInput
                    style={[
                      styles.customTimeInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.background,
                        borderColor: `${theme.text}20`,
                      },
                    ]}
                    value={customDuration}
                    onChangeText={setCustomDuration}
                    placeholder="0"
                    placeholderTextColor={`${theme.text}50`}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={[styles.customTimeLabel, { color: theme.text }]}>
                    hours
                  </Text>
                </View>

                <View style={styles.customTimeInputContainer}>
                  <TextInput
                    style={[
                      styles.customTimeInput,
                      {
                        color: theme.text,
                        backgroundColor: theme.background,
                        borderColor: `${theme.text}20`,
                      },
                    ]}
                    value={customMinutes}
                    onChangeText={setCustomMinutes}
                    placeholder="30"
                    placeholderTextColor={`${theme.text}50`}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text style={[styles.customTimeLabel, { color: theme.text }]}>
                    minutes
                  </Text>
                </View>
              </View>

              {selectedSubjectId && (
                <View style={styles.customSessionTopicContainer}>
                  <Text
                    style={[
                      styles.modalSubtitle,
                      { color: theme.text, marginBottom: 8 },
                    ]}
                  >
                    Topic (optional)
                  </Text>
                  <DropDownPicker
                    open={topicOpen}
                    value={selectedTopicId}
                    items={topicItems}
                    setOpen={setTopicOpen}
                    setValue={setSelectedTopicId}
                    setItems={setTopicItems}
                    placeholder="Select a topic"
                    style={[
                      styles.topicDropdown,
                      { backgroundColor: theme.background },
                    ]}
                    textStyle={{ color: theme.text }}
                    dropDownContainerStyle={{
                      backgroundColor: theme.background,
                      borderColor: `${theme.text}30`,
                    }}
                    placeholderStyle={{ color: `${theme.text}70` }}
                    zIndex={5000}
                    zIndexInverse={1000}
                  />
                </View>
              )}

              <Text
                style={[
                  styles.modalSubtitle,
                  { color: theme.text, marginTop: 16, marginBottom: 8 },
                ]}
              >
                Notes (optional)
              </Text>
              <TextInput
                style={[
                  styles.customNotesInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.background,
                    borderColor: `${theme.text}20`,
                  },
                ]}
                value={customNotes}
                onChangeText={setCustomNotes}
                placeholder="What did you study?"
                placeholderTextColor={`${theme.text}50`}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: theme.primary }]}
                  onPress={() => setCustomSessionVisible(false)}
                >
                  <Text style={{ color: theme.primary }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={handleSubmitCustomSession}
                >
                  <Text style={{ color: '#FFFFFF' }}>Save Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
                      {formatTimeHMS(item.duration)}
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
  elapsedText: {
    fontSize: 18,
    marginTop: 8,
    marginBottom: 8,
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
  customLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
  topicContainer: {
    marginTop: 8,
    zIndex: 1000,
  },
  topicLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  topicDropdown: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderColor: 'rgba(0,0,0,0.1)',
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
  emptyRecommendationsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
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
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '500',
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
    marginTop: 20,
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
  // Custom time entry styles
  customTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customTimeInputContainer: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  customTimeInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
    width: '100%',
    marginBottom: 4,
  },
  customTimeLabel: {
    fontSize: 14,
  },
  customNotesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minHeight: 80,
  },
  customSessionTopicContainer: {
    zIndex: 3000,
    marginTop: 12,
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
  timerModeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    // backgroundColor: `${theme.text}10`,
    borderRadius: 8,
    padding: 4,
  },
  timerModeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  timerModeButtonText: {
    fontWeight: '500',
    fontSize: 14,
  },
  topicSelector: {
    flexDirection: 'row',
    marginTop: 8,
    paddingBottom: 16,
  },
  topicOption: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  topicText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default TimerScreen;
