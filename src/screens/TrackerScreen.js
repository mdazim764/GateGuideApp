import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
import subjects from '../data/subjects';
import { useApp } from '../context/AppContext';

const TABS = [
  { key: 'syllabus', label: 'Syllabus' },
  { key: 'pyq', label: 'PYQ' },
  { key: 'quizzes', label: 'Quizzes' },
  { key: 'analytics', label: 'Analytics' },
];

const TrackerScreen = () => {
  const { theme } = useContext(ThemeContext);
  const { progress, updateProgress } = useApp();
  const [selectedTab, setSelectedTab] = useState('syllabus');
  const [selectedSubject, setSelectedSubject] = useState(null);

  // --- Progress Calculations ---
  const calculateProgress = () => {
    let totalTopics = 0;
    let completedTopics = 0;
    subjects.forEach(subject => {
      subject.topics.forEach(topic => {
        totalTopics++;
        if (
          progress[subject.id] &&
          progress[subject.id][topic.id] === 'completed'
        ) {
          completedTopics++;
        }
      });
    });
    return {
      percentage:
        totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      completed: completedTopics,
      total: totalTopics,
    };
  };

  const calculateSubjectProgress = subjectId => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return { percentage: 0, completed: 0, total: 0 };
    let completedTopics = 0;
    subject.topics.forEach(topic => {
      if (
        progress[subjectId] &&
        progress[subjectId][topic.id] === 'completed'
      ) {
        completedTopics++;
      }
    });
    return {
      percentage: Math.round((completedTopics / subject.topics.length) * 100),
      completed: completedTopics,
      total: subject.topics.length,
    };
  };

  // --- Tab UI ---
  const renderTabs = () => (
    <View style={[styles.tabsContainer, { backgroundColor: theme.card }]}>
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            selectedTab === tab.key && { backgroundColor: theme.primary },
          ]}
          onPress={() => {
            setSelectedTab(tab.key);
            setSelectedSubject(null);
          }}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === tab.key ? '#fff' : theme.text },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // --- Syllabus Tab ---
  const renderSubjectItem = ({ item }) => {
    const subjectProgress = calculateSubjectProgress(item.id);
    return (
      <TouchableOpacity
        style={[styles.subjectCard, { backgroundColor: theme.card }]}
        onPress={() => setSelectedSubject(item)}
      >
        <View style={styles.subjectInfo}>
          <Text style={[styles.subjectTitle, { color: theme.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.progressText, { color: theme.text }]}>
            {subjectProgress.completed}/{subjectProgress.total} topics completed
          </Text>
        </View>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${subjectProgress.percentage}%`,
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>
        <Icon name="chevron-right" size={24} color={theme.primary} />
      </TouchableOpacity>
    );
  };

  const toggleTopicStatus = (subjectId, topicId) => {
    const currentStatus = progress[subjectId]?.[topicId];
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    updateProgress(subjectId, topicId, newStatus);
  };

  // --- PYQ Tab (Mock Data) ---
  const pyqStats = {
    attempted: 120,
    correct: 98,
    incorrect: 22,
    subjects: subjects.map(s => ({
      ...s,
      pyq: {
        attempted: Math.floor(Math.random() * 30) + 10,
        correct: Math.floor(Math.random() * 25) + 5,
        incorrect: Math.floor(Math.random() * 10) + 1,
      },
    })),
  };

  // --- Quizzes Tab (Mock Data) ---
  const quizzes = [
    {
      id: '1',
      subject: 'Operating Systems',
      score: 85,
      date: '2025-07-20',
      time: '18m',
    },
    {
      id: '2',
      subject: 'Data Structures',
      score: 78,
      date: '2025-07-18',
      time: '22m',
    },
    {
      id: '3',
      subject: 'Computer Networks',
      score: 92,
      date: '2025-07-15',
      time: '15m',
    },
  ];

  // --- Analytics Tab (Mock Data) ---
  const analytics = {
    daily: { topics: 3, pyqs: 8, quizzes: 1 },
    weekly: { topics: 18, pyqs: 42, quizzes: 4 },
    monthly: { topics: 65, pyqs: 160, quizzes: 12 },
    overall: calculateProgress(),
  };

  // --- Subject Detail Modal ---
  if (selectedSubject) {
    const subjectProgress = calculateSubjectProgress(selectedSubject.id);
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => setSelectedSubject(null)}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {selectedSubject.name}
          </Text>
        </View>
        <FlatList
          data={selectedSubject.topics}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isCompleted =
              progress[selectedSubject.id]?.[item.id] === 'completed';
            return (
              <TouchableOpacity
                style={[
                  styles.topicItem,
                  {
                    backgroundColor: theme.card,
                    borderLeftWidth: 4,
                    borderLeftColor: isCompleted
                      ? theme.primary
                      : 'transparent',
                  },
                ]}
                onPress={() => toggleTopicStatus(selectedSubject.id, item.id)}
              >
                <View style={styles.topicContent}>
                  <Text style={[styles.topicName, { color: theme.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.weightageText, { color: theme.text }]}>
                    Weightage: {item.weightage}
                  </Text>
                </View>
                <Icon
                  name={isCompleted ? 'check-circle' : 'circle-outline'}
                  size={24}
                  color={isCompleted ? theme.primary : theme.text}
                />
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
        />
      </SafeAreaView>
    );
  }

  // --- Main Tracker Screen ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Add this heading section */}
      <View style={styles.screenHeader}>
        <Text style={[styles.screenHeaderText, { color: theme.text }]}>
          Study Progress Tracker
        </Text>
      </View>
      {renderTabs()}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Syllabus Tab */}
        {selectedTab === 'syllabus' && (
          <>
            <Text style={[styles.title, { color: theme.text }]}>
              Syllabus Tracker
            </Text>
            <View style={[styles.overallCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.overallTitle, { color: theme.text }]}>
                Overall Progress
              </Text>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${calculateProgress().percentage}%`,
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.overallText, { color: theme.text }]}>
                {calculateProgress().percentage}% -{' '}
                {calculateProgress().completed}/{calculateProgress().total}{' '}
                topics completed
              </Text>
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Subjects
            </Text>
            <FlatList
              data={subjects}
              keyExtractor={item => item.id}
              renderItem={renderSubjectItem}
              scrollEnabled={false}
              contentContainerStyle={styles.list}
            />
          </>
        )}

        {/* PYQ Tab */}
        {selectedTab === 'pyq' && (
          <>
            <Text style={[styles.title, { color: theme.text }]}>
              PYQ Tracker
            </Text>
            <View style={[styles.statsRow, { backgroundColor: theme.card }]}>
              <StatBox
                icon="check"
                label="Attempted"
                value={pyqStats.attempted}
                theme={theme}
              />
              <StatBox
                icon="check-circle"
                label="Correct"
                value={pyqStats.correct}
                theme={theme}
              />
              <StatBox
                icon="close-circle"
                label="Incorrect"
                value={pyqStats.incorrect}
                theme={theme}
              />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              By Subject
            </Text>
            <FlatList
              data={pyqStats.subjects}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View
                  style={[styles.subjectCard, { backgroundColor: theme.card }]}
                >
                  <View style={styles.subjectInfo}>
                    <Text style={[styles.subjectTitle, { color: theme.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.progressText, { color: theme.text }]}>
                      {item.pyq.attempted} attempted, {item.pyq.correct}{' '}
                      correct, {item.pyq.incorrect} incorrect
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={24} color={theme.primary} />
                </View>
              )}
              scrollEnabled={false}
              contentContainerStyle={styles.list}
            />
          </>
        )}

        {/* Quizzes Tab */}
        {selectedTab === 'quizzes' && (
          <>
            <Text style={[styles.title, { color: theme.text }]}>
              Quizzes Tracker
            </Text>
            <FlatList
              data={quizzes}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View
                  style={[styles.quizCard, { backgroundColor: theme.card }]}
                >
                  <View style={styles.quizInfo}>
                    <Text
                      style={[styles.quizSubject, { color: theme.primary }]}
                    >
                      {item.subject}
                    </Text>
                    <Text style={[styles.quizScore, { color: theme.text }]}>
                      Score: {item.score}%
                    </Text>
                  </View>
                  <View style={styles.quizMeta}>
                    <Text style={[styles.quizDate, { color: theme.text }]}>
                      {item.date}
                    </Text>
                    <Text style={[styles.quizTime, { color: theme.text }]}>
                      {item.time}
                    </Text>
                  </View>
                </View>
              )}
              scrollEnabled={false}
              contentContainerStyle={styles.list}
            />
          </>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <>
            <Text style={[styles.title, { color: theme.text }]}>
              Progress Analytics
            </Text>
            <View style={styles.analyticsGrid}>
              <AnalyticsBox
                label="Daily"
                data={analytics.daily}
                theme={theme}
              />
              <AnalyticsBox
                label="Weekly"
                data={analytics.weekly}
                theme={theme}
              />
              <AnalyticsBox
                label="Monthly"
                data={analytics.monthly}
                theme={theme}
              />
              <AnalyticsBox
                label="Overall"
                data={analytics.overall}
                theme={theme}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Helper Components ---
const StatBox = ({ icon, label, value, theme }) => (
  <View style={styles.statBox}>
    <Icon name={icon} size={24} color={theme.primary} />
    <Text style={[styles.statLabel, { color: theme.text }]}>{label}</Text>
    <Text style={[styles.statValue, { color: theme.primary }]}>{value}</Text>
  </View>
);

const AnalyticsBox = ({ label, data, theme }) => (
  <View style={[styles.analyticsBox, { backgroundColor: theme.card }]}>
    <Text style={[styles.analyticsLabel, { color: theme.primary }]}>
      {label}
    </Text>
    <Text style={[styles.analyticsText, { color: theme.text }]}>
      Topics: {data.topics ?? data.completed ?? 0}
    </Text>
    <Text style={[styles.analyticsText, { color: theme.text }]}>
      PYQs: {data.pyqs ?? 0}
    </Text>
    <Text style={[styles.analyticsText, { color: theme.text }]}>
      Quizzes: {data.quizzes ?? 0}
    </Text>
    {data.percentage !== undefined && (
      <Text style={[styles.analyticsText, { color: theme.text }]}>
        Completion: {data.percentage}%
      </Text>
    )}
  </View>
);

// --- Styles ---
const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    margin: 16,
    marginBottom: 0,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    margin: 16,
    marginBottom: 8,
  },
  overallCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  overallTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  overallText: {
    fontSize: 14,
    marginTop: 8,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  subjectInfo: {
    flex: 1,
    marginRight: 8,
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  topicContent: {
    flex: 1,
  },
  topicName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  weightageText: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  quizCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  quizInfo: {
    flex: 1,
  },
  quizSubject: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quizScore: {
    fontSize: 14,
  },
  quizMeta: {
    alignItems: 'flex-end',
  },
  quizDate: {
    fontSize: 13,
    marginBottom: 2,
  },
  quizTime: {
    fontSize: 13,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
  },
  analyticsBox: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  analyticsLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  analyticsText: {
    fontSize: 14,
  },
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  screenHeaderText: {
    fontSize: 26,
    fontWeight: 'bold',
  },
});

export default TrackerScreen;
