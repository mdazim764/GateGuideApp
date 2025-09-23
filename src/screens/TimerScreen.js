import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const TimerScreen = () => {
  const { theme } = useContext(ThemeContext);
  const isFocused = useIsFocused();

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
  });
  const [subjects, setSubjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Timer modes in seconds
  const timerModes = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(prev => ({ ...prev, subjects: true }));
        const response = await api.academic.getSubjects();
        if (response.data && response.data.length > 0) {
          setSubjects(response.data);
          // Set first subject as default if none selected
          if (!selectedSubject && response.data.length > 0) {
            setSelectedSubject(response.data[0].name);
            setSelectedSubjectId(response.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(prev => ({ ...prev, subjects: false }));
      }
    };

    fetchSubjects();
  }, []);

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
        }
      } catch (error) {
        console.error('Error fetching today\'s stats:', error);
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
      Alert.alert('Subject Required', 'Please select a subject before starting the timer.');
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
  }, [timerMode, elapsedTime, selectedSubjectId]);

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
  }, [timerMode, completedSessions, completeSession]);

  // Switch timer mode
  const switchMode = useCallback((mode) => {
    setTimerMode(mode);
    setTimeRemaining(timerModes[mode]);
    setIsRunning(false);
    setElapsedTime(0);
  }, [timerModes]);

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
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle subject selection
  const handleSubjectSelect = useCallback((subject) => {
    setSelectedSubject(subject.name);
    setSelectedSubjectId(subject.id);
  }, []);

  // Update study goal
  const updateGoal = useCallback(async (newGoal) => {
    try {
      await api.session.updateStudyGoal({ goalMinutes: newGoal });
      
      // Refresh today's stats to show updated goal
      const response = await api.session.getTodaysStats();
      if (response.data) {
        setTodayStats(response.data);
      }
      
      Alert.alert('Success', 'Study goal updated successfully');
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update study goal. Please try again.');
    }
  }, []);

  // Render recommendations
  const renderRecommendations = () => {
    if (loading.recommendations) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={{ color: theme.text, marginLeft: 8 }}>Loading recommendations...</Text>
        </View>
      );
    }

    if (recommendations.length === 0) {
      return (
        <Text style={{ color: theme.text, textAlign: 'center', fontStyle: 'italic' }}>
          No recommendations available yet. Start studying to get personalized recommendations.
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
          name={subject.neglected ? "alert-circle-outline" : "school-outline"} 
          size={24} 
          color={subject.neglected ? "#E57373" : theme.primary} 
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.recommendationTitle, { color: theme.text }]}>{subject.name}</Text>
          <Text style={[styles.recommendationSubtitle, { color: theme.textSecondary }]}>
            {subject.neglected 
              ? "Needs attention" 
              : `${subject.totalMinutes} minutes studied`}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    ));
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
            <Text style={[styles.subtitle, { color: theme.text, marginLeft: 8 }]}>
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

          {loading.subjects ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <View style={styles.subjectOptions}>
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
                      selectedSubjectId === subject.id && { color: theme.primary },
                    ]}
                  >
                    {subject.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Today's Stats */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Today's Stats
            </Text>
            
            {/* Goal progress bar */}
            <View style={styles.goalProgressContainer}>
              <View style={styles.goalProgressBarContainer}>
                <View 
                  style={[
                    styles.goalProgressBar, 
                    { 
                      backgroundColor: theme.primary,
                      width: `${Math.min(todayStats.goalCompletionPercentage, 100)}%`,
                    }
                  ]}
                />
              </View>
              <Text style={[styles.goalProgressText, { color: theme.text }]}>
                {todayStats.totalTimeMinutes}/{todayStats.goalMinutes} min
              </Text>
            </View>
          </View>

          {loading.stats ? (
            <View style={[styles.statsCard, { backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center' }]}>
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subjectOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  subjectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
    marginBottom: 8,
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
    width: '60%',
  },
  goalProgressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 4,
  },
  goalProgressBar: {
    height: '100%',
    borderRadius: 3,
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
});

export default TimerScreen;
