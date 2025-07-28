import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const TimerScreen = () => {
  const { theme } = useContext(ThemeContext);
  
  const [timerMode, setTimerMode] = useState('focus'); // focus, shortBreak, longBreak
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes in seconds
  const [completedSessions, setCompletedSessions] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('Operating Systems');
  
  // Timer modes in seconds
  const timerModes = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };
  
  // Subject options
  const subjects = [
    'Operating Systems',
    'Data Structures',
    'Computer Networks',
    'Theory of Computation',
    'Database Management',
    'Digital Logic',
  ];
  
  useEffect(() => {
    let timer;
    
    if (isRunning && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (isRunning && timeRemaining === 0) {
      handleTimerComplete();
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [isRunning, timeRemaining]);
  
  const handleTimerComplete = () => {
    // Play sound or vibration here
    
    if (timerMode === 'focus') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // After 4 focus sessions, take a long break
      if (newCompletedSessions % 4 === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      // After break, go back to focus mode
      switchMode('focus');
    }
  };
  
  const switchMode = (mode) => {
    setTimerMode(mode);
    setTimeRemaining(timerModes[mode]);
    setIsRunning(false);
  };
  
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };
  
  const resetTimer = () => {
    setTimeRemaining(timerModes[timerMode]);
    setIsRunning(false);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'right', 'left']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Focus Timer</Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            {completedSessions} sessions completed today
          </Text>
        </View>
        
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              timerMode === 'focus' && [styles.activeModeButton, { backgroundColor: theme.primary }]
            ]}
            onPress={() => switchMode('focus')}
          >
            <Text style={[
              styles.modeButtonText, 
              { color: timerMode === 'focus' ? '#FFFFFF' : theme.text }
            ]}>
              Focus
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              timerMode === 'shortBreak' && [styles.activeModeButton, { backgroundColor: theme.primary }]
            ]}
            onPress={() => switchMode('shortBreak')}
          >
            <Text style={[
              styles.modeButtonText, 
              { color: timerMode === 'shortBreak' ? '#FFFFFF' : theme.text }
            ]}>
              Short Break
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              timerMode === 'longBreak' && [styles.activeModeButton, { backgroundColor: theme.primary }]
            ]}
            onPress={() => switchMode('longBreak')}
          >
            <Text style={[
              styles.modeButtonText, 
              { color: timerMode === 'longBreak' ? '#FFFFFF' : theme.text }
            ]}>
              Long Break
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.timerContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.timerText, { color: theme.text }]}>
            {formatTime(timeRemaining)}
          </Text>
          
          <View style={styles.timerActions}>
            <TouchableOpacity
              style={[styles.timerButton, { backgroundColor: `${theme.primary}20` }]}
              onPress={resetTimer}
            >
              <Icon name="refresh" size={24} color={theme.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.timerMainButton, { backgroundColor: theme.primary }]}
              onPress={toggleTimer}
            >
              <Icon name={isRunning ? 'pause' : 'play'} size={32} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.timerButton, { backgroundColor: `${theme.primary}20` }]}
              onPress={() => {
                // Skip to next mode
                if (timerMode === 'focus') {
                  switchMode('shortBreak');
                } else {
                  switchMode('focus');
                }
              }}
            >
              <Icon name="skip-next" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.subjectSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>What are you studying?</Text>
          
          <View style={styles.subjectOptions}>
            {subjects.map(subject => (
              <TouchableOpacity
                key={subject}
                style={[
                  styles.subjectButton,
                  { backgroundColor: theme.card },
                  selectedSubject === subject && { 
                    backgroundColor: `${theme.primary}20`,
                    borderColor: theme.primary,
                    borderWidth: 1,
                  }
                ]}
                onPress={() => setSelectedSubject(subject)}
              >
                <Text style={[
                  styles.subjectButtonText, 
                  { color: theme.text },
                  selectedSubject === subject && { color: theme.primary }
                ]}>
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Stats</Text>
          
          <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
            <View style={styles.statItem}>
              <Icon name="clock-outline" size={24} color={theme.primary} />
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: theme.text }]}>01:15:00</Text>
                <Text style={[styles.statLabel, { color: theme.text }]}>Focus Time</Text>
              </View>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: `${theme.text}20` }]} />
            
            <View style={styles.statItem}>
              <Icon name="check-circle" size={24} color={theme.primary} />
              <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: theme.text }]}>{completedSessions}</Text>
                <Text style={[styles.statLabel, { color: theme.text }]}>Sessions</Text>
              </View>
            </View>
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
});

export default TimerScreen;
