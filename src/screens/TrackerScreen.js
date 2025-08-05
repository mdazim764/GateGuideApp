import React, { useState, useContext, useEffect } from 'react';
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
import CustomHeader from '../components/CustomHeader';

const TABS = [
  { key: 'syllabus', label: 'Syllabus' },
  { key: 'pyq', label: 'PYQ' },
  { key: 'quizzes', label: 'Quizzes' },
  { key: 'analytics', label: 'Analytics' },
];

const TrackerScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const { progress, updateProgress } = useApp();

  // Get initial tab and selection from params if they exist
  const initialTab = route.params?.initialTab || 'syllabus';
  const initialSubjectId = route.params?.selectedSubjectId;
  const initialTopicId = route.params?.selectedTopicId;

  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedPyqSubject, setSelectedPyqSubject] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  // Find the subject if an ID was provided
  useEffect(() => {
    if (initialSubjectId) {
      const foundSubject = subjects.find(s => s.id === initialSubjectId);
      if (foundSubject) {
        setSelectedSubject(foundSubject);
      }
    }
  }, [initialSubjectId]);

  // If a topic ID was provided, scroll to it or highlight it
  useEffect(() => {
    if (initialSubjectId && initialTopicId) {
      // Future implementation: scroll to specific topic
    }
  }, [initialSubjectId, initialTopicId]);

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
            setSelectedPyqSubject(null);
            setSelectedYear(null);
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

  // --- PYQ Tab (Enhanced) ---
  // Mock data for PYQ years
  const pyqYears = [
    '2023',
    '2022',
    '2021',
    '2020',
    '2019',
    '2018',
    '2017',
    '2016',
    '2015',
    '2014',
  ];

  // Mock data for PYQ questions
  const mockPyqQuestions = [
    {
      id: '1',
      year: '2022',
      question:
        'Which of the following scheduling algorithms may lead to starvation?',
      options: [
        'Round Robin',
        'First Come First Serve',
        'Priority Scheduling',
        'Shortest Job First',
      ],
      answer: 2, // Priority Scheduling
      explanation:
        'Priority scheduling may lead to starvation if lower priority processes keep waiting because higher priority processes are continuously arriving.',
      difficulty: 'Medium',
      attempted: true,
      userAnswer: 2,
      isCorrect: true,
    },
    {
      id: '2',
      year: '2022',
      question:
        'Consider a virtual memory system with FIFO page replacement policy. For an arbitrary page access pattern, increasing the number of page frames in main memory will',
      options: [
        'Always decrease the number of page faults',
        'Always increase the number of page faults',
        'Sometimes increase the number of page faults',
        'Never affect the number of page faults',
      ],
      answer: 2, // Sometimes increase
      explanation:
        "This is known as Belady's Anomaly, which occurs with FIFO replacement policy. Increasing the page frames can sometimes lead to more page faults.",
      difficulty: 'Hard',
      attempted: true,
      userAnswer: 0,
      isCorrect: false,
    },
    {
      id: '3',
      year: '2022',
      question: "Which of the following is true about the Banker's algorithm?",
      options: [
        'It is a deadlock detection algorithm',
        'It is a deadlock prevention algorithm',
        'It is a deadlock avoidance algorithm',
        'It is a deadlock recovery algorithm',
      ],
      answer: 2, // Avoidance
      explanation:
        "Banker's algorithm is a deadlock avoidance algorithm that ensures the system never enters an unsafe state where deadlock might occur.",
      difficulty: 'Medium',
      attempted: false,
      userAnswer: null,
      isCorrect: null,
    },
  ];

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
        questions: mockPyqQuestions,
        yearWiseAttempts: pyqYears.map(year => ({
          year,
          attempted: Math.floor(Math.random() * 20),
          correct: Math.floor(Math.random() * 15),
          total: 20 + Math.floor(Math.random() * 10),
        })),
      },
      topics: s.topics
        ? s.topics.map(topic => ({
            ...topic,
            correctPercentage: Math.floor(Math.random() * 100),
          }))
        : [],
    })),
  };

  // --- Quizzes Tab (Enhanced) ---
  const quizzes = [
    {
      id: '1',
      subject: 'Operating Systems',
      score: 85,
      date: '2025-07-20',
      time: '18m',
      questionCount: 15,
      correctCount: 13,
      topicsCovered: [
        'Process Scheduling',
        'Memory Management',
        'File Systems',
      ],
      trend: 'up',
    },
    {
      id: '2',
      subject: 'Data Structures',
      score: 78,
      date: '2025-07-18',
      time: '22m',
      questionCount: 20,
      correctCount: 16,
      topicsCovered: ['Arrays', 'Linked Lists', 'Trees', 'Graphs'],
      trend: 'down',
    },
    {
      id: '3',
      subject: 'Computer Networks',
      score: 92,
      date: '2025-07-15',
      time: '15m',
      questionCount: 12,
      correctCount: 11,
      topicsCovered: ['OSI Model', 'TCP/IP', 'Routing'],
      trend: 'up',
    },
  ];

  // --- Analytics Tab (Mock Data) ---
  const analytics = {
    daily: { topics: 3, pyqs: 8, quizzes: 1 },
    weekly: { topics: 18, pyqs: 42, quizzes: 4 },
    monthly: { topics: 65, pyqs: 160, quizzes: 12 },
    overall: calculateProgress(),
    strengths: ['Operating Systems', 'Database Systems'],
    weaknesses: ['Computer Networks', 'Theory of Computation'],
    improvement: ['Discrete Mathematics', 'Algorithm Analysis'],
    studyTime: {
      mon: 4.5,
      tue: 3.2,
      wed: 5.0,
      thu: 2.5,
      fri: 4.0,
      sat: 6.0,
      sun: 3.5,
    },
  };

  // --- Subject Detail for Syllabus ---
  if (selectedSubject && selectedTab === 'syllabus') {
    const subjectProgress = calculateSubjectProgress(selectedSubject.id);
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <CustomHeader
          title={selectedSubject.name}
          onBack={() => setSelectedSubject(null)}
        />
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

  // --- PYQ Subject Detail ---
  if (selectedPyqSubject) {
    const subject = pyqStats.subjects.find(s => s.id === selectedPyqSubject.id);

    // Year detail view
    if (selectedYear) {
      const yearData = subject.pyq.yearWiseAttempts.find(
        y => y.year === selectedYear,
      );
      const yearQuestions = mockPyqQuestions.filter(
        q => q.year === selectedYear,
      );

      return (
        <SafeAreaView
          style={[styles.container, { backgroundColor: theme.background }]}
        >
          <CustomHeader
            title={`${subject.name} - ${selectedYear} PYQs`}
            onBack={() => setSelectedYear(null)}
          />

          {/* Enhanced Stats Card */}
          <View
            style={[
              styles.statsCard,
              {
                backgroundColor: theme.card,
                marginHorizontal: 16,
                marginBottom: 16,
                borderRadius: 12,
                padding: 16,
                elevation: 3,
              },
            ]}
          >
            <StatBox
              icon="file-document"
              label="Total"
              value={yearData.total}
              theme={theme}
            />
            <StatBox
              icon="check"
              label="Attempted"
              value={yearData.attempted}
              theme={theme}
            />
            <StatBox
              icon="check-decagram"
              label="Correct"
              value={yearData.correct}
              theme={theme}
            />
          </View>

          {/* Enhanced Question Cards */}
          <FlatList
            data={yearQuestions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.questionCard,
                  {
                    backgroundColor: theme.card,
                    marginHorizontal: 16,
                    marginBottom: 16,
                    padding: 16,
                    borderRadius: 12,
                    elevation: 2,
                  },
                ]}
              >
                {/* Difficulty Tag + Correct/Incorrect Status */}
                <View style={styles.questionHeader}>
                  {/* Difficulty Badge */}
                  <View
                    style={[
                      styles.difficultyBadge,
                      {
                        backgroundColor:
                          item.difficulty === 'Hard'
                            ? 'rgba(229, 57, 53, 0.1)'
                            : item.difficulty === 'Medium'
                            ? 'rgba(251, 140, 0, 0.1)'
                            : 'rgba(67, 160, 71, 0.1)',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          item.difficulty === 'Hard'
                            ? '#E53935'
                            : item.difficulty === 'Medium'
                            ? '#FB8C00'
                            : '#43A047',
                        fontWeight: '600',
                        fontSize: 12,
                      }}
                    >
                      {item.difficulty}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  {item.attempted && (
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: item.isCorrect
                            ? 'rgba(67, 160, 71, 0.1)'
                            : 'rgba(229, 57, 53, 0.1)',
                        },
                      ]}
                    >
                      <Icon
                        name={item.isCorrect ? 'check' : 'close'}
                        size={14}
                        color={item.isCorrect ? '#43A047' : '#E53935'}
                      />
                      <Text
                        style={{
                          color: item.isCorrect ? '#43A047' : '#E53935',
                          fontWeight: '500',
                          fontSize: 12,
                          marginLeft: 4,
                        }}
                      >
                        {item.isCorrect ? 'Correct' : 'Incorrect'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Question Text */}
                <Text
                  style={[
                    styles.questionText,
                    {
                      color: theme.text,
                      fontSize: 15,
                      marginVertical: 12,
                      lineHeight: 22,
                    },
                  ]}
                  numberOfLines={3}
                >
                  {item.question}
                </Text>

                {/* Review Button */}
                <TouchableOpacity
                  style={[
                    styles.reviewButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => {
                    navigation.navigate('MoreTab', {
                      screen: 'Quiz',
                      params: {
                        mode: 'pyq',
                        subjectId: subject.id,
                        subjectName: subject.name,
                        year: selectedYear,
                        questionId: item.id,
                      },
                    });
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontWeight: '600',
                      fontSize: 14,
                    }}
                  >
                    Review
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={[styles.list, { paddingBottom: 24 }]}
          />
        </SafeAreaView>
      );
    }

    // Subject years list view
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <CustomHeader
          title={`${subject.name} PYQs`}
          onBack={() => setSelectedPyqSubject(null)}
        />

        {/* Enhanced Stats Card */}
        <View
          style={[
            styles.statsCard,
            {
              backgroundColor: theme.card,
              margin: 16,
              marginBottom: 16,
              borderRadius: 12,
              padding: 16,
              elevation: 3,
            },
          ]}
        >
          <StatBox
            icon="check"
            label="Attempted"
            value={subject.pyq.attempted}
            theme={theme}
          />
          <StatBox
            icon="check-circle"
            label="Correct"
            value={subject.pyq.correct}
            theme={theme}
          />
          <StatBox
            icon="close-circle"
            label="Incorrect"
            value={subject.pyq.incorrect}
            theme={theme}
          />
        </View>

        <Text
          style={[
            styles.sectionTitle,
            { color: theme.text, marginLeft: 16, marginBottom: 8 },
          ]}
        >
          Year-wise PYQs
        </Text>

        {/* Enhanced Year Cards */}
        <FlatList
          data={subject.pyq.yearWiseAttempts}
          keyExtractor={item => item.year}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.yearCard,
                {
                  backgroundColor: theme.card,
                  marginHorizontal: 16,
                  marginBottom: 12,
                  padding: 16,
                  borderRadius: 12,
                  elevation: 2,
                  borderLeftWidth: 4,
                  borderLeftColor: theme.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                },
              ]}
              onPress={() => setSelectedYear(item.year)}
            >
              <View>
                <Text
                  style={[
                    styles.yearTitle,
                    { color: theme.text, fontWeight: 'bold', fontSize: 16 },
                  ]}
                >
                  GATE {item.year}
                </Text>
                <Text
                  style={[
                    styles.yearStats,
                    { color: theme.textSecondary, marginTop: 4 },
                  ]}
                >
                  {item.attempted}/{item.total} attempted
                </Text>
              </View>

              <Icon name="chevron-right" size={24} color={theme.primary} />
            </TouchableOpacity>
          )}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
        />

        {/* Practice All Button */}
        <View style={{ padding: 16, paddingTop: 8 }}>
          <TouchableOpacity
            style={[
              styles.practiceAllButton,
              {
                backgroundColor: theme.primary,
                paddingVertical: 16,
                borderRadius: 12,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 3,
              },
            ]}
            onPress={() => {
              // Navigate to a practice mode that combines questions from all years
              navigation.navigate('MoreTab', {
                screen: 'Quiz',
                params: {
                  mode: 'pyq',
                  subjectId: subject.id,
                  subjectName: subject.name,
                },
              });
            }}
          >
            <Icon
              name="play"
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Practice All PYQs
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- Main Tracker Screen ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <CustomHeader
        title="Study Progress Tracker"
        onBack={() => navigation.goBack()}
      />
      {renderTabs()}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Syllabus Tab */}
        {selectedTab === 'syllabus' && (
          <>
            <Text style={[styles.title, { color: theme.text }]}>
              Syllabus Tracker
            </Text>
            <View
              style={[
                styles.overallCard,
                {
                  backgroundColor: theme.card,
                  marginHorizontal: 16,
                  borderRadius: 12,
                  padding: 16,
                  elevation: 3,
                },
              ]}
            >
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

        {/* PYQ Tab - Enhanced */}
        {selectedTab === 'pyq' && (
          <>
            <Text style={[styles.title, { color: theme.text }]}>
              PYQ Tracker
            </Text>

            {/* Enhanced Stats Card */}
            <View
              style={[
                styles.statsCard,
                {
                  backgroundColor: theme.card,
                  marginHorizontal: 16,
                  marginBottom: 16,
                  borderRadius: 12,
                  padding: 16,
                  elevation: 3,
                },
              ]}
            >
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

            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, marginTop: 16, marginLeft: 16 },
              ]}
            >
              Subject-wise PYQs
            </Text>

            {/* Fixed Card Layout */}
            <FlatList
              data={pyqStats.subjects}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.subjectCard,
                    {
                      backgroundColor: theme.card,
                      marginHorizontal: 16,
                      marginBottom: 12,
                      padding: 16,
                      borderRadius: 12,
                      elevation: 2,
                      borderLeftWidth: 4,
                      borderLeftColor: theme.primary,
                    },
                  ]}
                  onPress={() => setSelectedPyqSubject(item)}
                >
                  <View style={styles.subjectInfo}>
                    <Text
                      style={[
                        styles.subjectTitle,
                        {
                          color: theme.text,
                          fontSize: 16,
                          fontWeight: 'bold',
                          marginBottom: 8,
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.progressText, { color: theme.text }]}>
                      {item.pyq.attempted} attempted, {item.pyq.correct}{' '}
                      correct, {item.pyq.incorrect} incorrect
                    </Text>

                    {/* Topic Progress Section with Fixed Styling */}
                    <View
                      style={[styles.topicProgressContainer, { marginTop: 12 }]}
                    >
                      {item.topics &&
                        item.topics.slice(0, 3).map(topic => (
                          <View
                            key={topic.id}
                            style={[
                              styles.topicProgressItem,
                              { marginBottom: 10 },
                            ]}
                          >
                            <View style={styles.topicProgressHeader}>
                              <Text
                                style={[
                                  styles.topicProgressLabel,
                                  { color: theme.text },
                                ]}
                              >
                                {topic.name}
                              </Text>
                              <Text
                                style={[
                                  styles.topicProgressValue,
                                  { color: theme.primary },
                                ]}
                              >
                                {topic.correctPercentage || 0}%
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.topicProgressBar,
                                {
                                  backgroundColor: `${theme.primary}20`,
                                  height: 6,
                                  marginTop: 4,
                                },
                              ]}
                            >
                              <View
                                style={[
                                  styles.topicProgressFill,
                                  {
                                    backgroundColor: theme.primary,
                                    width: `${topic.correctPercentage || 0}%`,
                                    height: '100%',
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        ))}
                    </View>
                  </View>
                  <Icon name="chevron-right" size={24} color={theme.primary} />
                </TouchableOpacity>
              )}
              scrollEnabled={false}
              contentContainerStyle={styles.list}
            />

            {/* PYQ Practice Button */}
            <View style={{ padding: 16, paddingTop: 0 }}>
              <TouchableOpacity
                style={[
                  styles.practiceAllButton,
                  {
                    backgroundColor: theme.primary,
                    paddingVertical: 16,
                    borderRadius: 12,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 3,
                  },
                ]}
                onPress={() => {
                  navigation.navigate('MoreTab', {
                    screen: 'Quiz',
                    params: {
                      quizType: 'pyq',
                      questionCount: 10,
                      difficulty: 'medium',
                    },
                  });
                }}
              >
                <Icon
                  name="shuffle-variant"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Random PYQ Practice
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Quizzes Tab - Enhanced */}
        {selectedTab === 'quizzes' && (
          <>
            <Text style={[styles.title, { color: theme.text }]}>
              Quizzes Tracker
            </Text>

            {/* Enhanced Take New Quiz Button */}
            <View style={{ padding: 16 }}>
              <TouchableOpacity
                style={[
                  styles.newQuizButton,
                  {
                    backgroundColor: theme.primary,
                    paddingVertical: 16,
                    borderRadius: 12,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 3,
                  },
                ]}
                onPress={() => {
                  navigation.navigate('MoreTab', {
                    screen: 'Quiz',
                    params: {
                      quizType: 'ai',
                      questionCount: 10,
                      difficulty: 'medium',
                    },
                  });
                }}
              >
                <Icon
                  name="plus"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Take New Quiz
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.sectionTitle,
                { color: theme.text, marginLeft: 16 },
              ]}
            >
              Recent Quiz Results
            </Text>

            {/* Enhanced Quiz Cards */}
            <FlatList
              data={quizzes}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.quizCard,
                    {
                      backgroundColor: theme.card,
                      marginHorizontal: 16,
                      marginBottom: 16,
                      borderRadius: 12,
                      overflow: 'hidden',
                      elevation: 3,
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate('QuizResult', {
                      result: {
                        quizId: item.id,
                        subject: item.subject,
                        score: item.score,
                        correctAnswers: item.correctCount,
                        totalQuestions: item.questionCount,
                        timeTaken: item.time,
                        date: item.date,
                        feedback: {
                          mentorAnalysis:
                            item.mentorFeedback || 'Good attempt on this quiz!',
                          questionByQuestionReview: item.questions || [],
                        },
                      },
                    })
                  }
                >
                  <View style={{ flexDirection: 'row' }}>
                    {/* Left color accent */}
                    <View
                      style={{
                        width: 6,
                        backgroundColor: theme.primary,
                      }}
                    />

                    {/* Content */}
                    <View style={{ flex: 1, padding: 16 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}
                      >
                        {/* Left side: Subject & score */}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: theme.primary,
                              fontSize: 16,
                              fontWeight: 'bold',
                            }}
                          >
                            {item.subject}
                          </Text>
                          <Text
                            style={{
                              color: theme.text,
                              fontSize: 14,
                              marginTop: 6,
                              marginBottom: 4,
                            }}
                          >
                            Score: {item.score}% ({item.correctCount}/
                            {item.questionCount})
                          </Text>
                          <Text
                            style={{
                              color: theme.textSecondary,
                              fontSize: 13,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.topicsCovered.join(', ')}
                          </Text>

                          {/* Trend indicator */}
                          {item.trend && (
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 8,
                              }}
                            >
                              <Icon
                                name={
                                  item.trend === 'up'
                                    ? 'trending-up'
                                    : item.trend === 'down'
                                    ? 'trending-down'
                                    : 'trending-neutral'
                                }
                                size={16}
                                color={
                                  item.trend === 'up'
                                    ? '#4CAF50'
                                    : item.trend === 'down'
                                    ? '#F44336'
                                    : theme.textSecondary
                                }
                              />
                              <Text
                                style={{
                                  marginLeft: 4,
                                  color:
                                    item.trend === 'up'
                                      ? '#4CAF50'
                                      : item.trend === 'down'
                                      ? '#F44336'
                                      : theme.textSecondary,
                                  fontSize: 12,
                                  fontWeight: '500',
                                }}
                              >
                                {item.trend === 'up'
                                  ? 'Improved'
                                  : item.trend === 'down'
                                  ? 'Declined'
                                  : 'Stable'}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Right side: Date, time & icon */}
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text
                            style={{
                              color: theme.textSecondary,
                              fontSize: 13,
                            }}
                          >
                            {item.date}
                          </Text>
                          <Text
                            style={{
                              color: theme.textSecondary,
                              fontSize: 13,
                              marginVertical: 4,
                            }}
                          >
                            {item.time}
                          </Text>
                          <Icon
                            name="chevron-right"
                            size={20}
                            color={theme.primary}
                            style={{ marginTop: 4 }}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
              contentContainerStyle={[styles.list, { paddingBottom: 20 }]}
            />
          </>
        )}

        {/* Analytics Tab - Enhanced */}
        {selectedTab === 'analytics' && (
          <>
            <Text style={[styles.title, { color: theme.text }]}>
              Progress Analytics
            </Text>

            {/* Analytics Grid */}
            <View
              style={[
                styles.analyticsGrid,
                {
                  marginHorizontal: 16,
                  marginTop: 8,
                  marginBottom: 16,
                },
              ]}
            >
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

            {/* Study Insights Card */}
            <View
              style={[
                styles.insightsCard,
                {
                  backgroundColor: theme.card,
                  marginHorizontal: 16,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  elevation: 3,
                },
              ]}
            >
              <Text
                style={{
                  color: theme.text,
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginBottom: 12,
                }}
              >
                Study Insights
              </Text>

              <InsightItem
                title="Strengths"
                items={analytics.strengths}
                iconName="trending-up"
                theme={theme}
                color="#43A047"
              />

              <InsightItem
                title="Needs Improvement"
                items={analytics.weaknesses}
                iconName="trending-down"
                theme={theme}
                color="#E53935"
              />

              <InsightItem
                title="Most Improved"
                items={analytics.improvement}
                iconName="star"
                theme={theme}
                color="#FB8C00"
              />
            </View>

            {/* View Detailed Analytics Button */}
            <View style={{ padding: 16, paddingTop: 0 }}>
              <TouchableOpacity
                style={[
                  styles.detailedAnalyticsButton,
                  {
                    backgroundColor: theme.primary,
                    paddingVertical: 16,
                    borderRadius: 12,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 3,
                  },
                ]}
                onPress={() => navigation.navigate('Analytics')}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '600',
                    marginRight: 8,
                  }}
                >
                  View Detailed Analytics
                </Text>
                <Icon name="arrow-right" size={20} color="#FFFFFF" />
              </TouchableOpacity>
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

const InsightItem = ({ title, items, iconName, theme, color }) => (
  <View style={{ marginBottom: 12 }}>
    <View
      style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
    >
      <Icon name={iconName} size={18} color={color} />
      <Text style={{ fontWeight: '500', marginLeft: 6, color: theme.text }}>
        {title}
      </Text>
    </View>
    <Text style={{ color: theme.text, paddingLeft: 24 }}>
      {items.join(', ')}
    </Text>
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
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
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
    borderRadius: 12,
    marginBottom: 16,
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
  // Stats card and boxes
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 12,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 4,
  },
  statLabel: {
    fontSize: 13,
    marginTop: 6,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  // Topic progress
  topicProgressContainer: {
    marginTop: 10,
  },
  topicProgressItem: {
    marginBottom: 8,
  },
  topicProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  topicProgressLabel: {
    fontSize: 13,
    opacity: 0.8,
  },
  topicProgressValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  topicProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  topicProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Year cards
  yearCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  yearTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  yearStats: {
    fontSize: 14,
    marginTop: 4,
  },
  // Question cards
  questionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  questionText: {
    fontSize: 15,
    marginVertical: 12,
    lineHeight: 22,
  },
  reviewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  // Quiz cards
  quizCard: {
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
  },
  // Analytics
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsBox: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
  },
  analyticsLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  analyticsText: {
    fontSize: 14,
    marginBottom: 4,
  },
  insightsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  // Buttons
  practiceAllButton: {
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 3,
  },
  newQuizButton: {
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 3,
  },
  detailedAnalyticsButton: {
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 3,
  },
});

export default TrackerScreen;
