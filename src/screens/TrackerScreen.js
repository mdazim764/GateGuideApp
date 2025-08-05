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

          <View style={[styles.statsRow, { backgroundColor: theme.card }]}>
            <StatBox
              icon="file-document"
              label="Total"
              value={yearData.total}
              theme={theme}
            />
            <StatBox
              icon="check-circle"
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

          <FlatList
            data={yearQuestions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.questionCard, { backgroundColor: theme.card }]}
                onPress={() => {
                  // Navigate to PYQ detail/practice
                  navigation.navigate('Quiz', {
                    mode: 'pyq',
                    subjectId: subject.id,
                    subjectName: subject.name,
                    year: selectedYear,
                    questionId: item.id,
                  });
                }}
              >
                <View style={styles.questionHeader}>
                  <View style={styles.questionDifficulty}>
                    <Text
                      style={[
                        styles.difficultyText,
                        {
                          color:
                            item.difficulty === 'Hard'
                              ? '#E53935'
                              : item.difficulty === 'Medium'
                              ? '#FB8C00'
                              : '#43A047',
                        },
                      ]}
                    >
                      {item.difficulty}
                    </Text>
                  </View>

                  {item.attempted && (
                    <View
                      style={[
                        styles.attemptedTag,
                        {
                          backgroundColor: item.isCorrect
                            ? `${theme.success}20`
                            : `${theme.error}20`,
                          borderColor: item.isCorrect
                            ? theme.success
                            : theme.error,
                        },
                      ]}
                    >
                      <Icon
                        name={item.isCorrect ? 'check' : 'close'}
                        size={14}
                        color={item.isCorrect ? theme.success : theme.error}
                      />
                      <Text
                        style={[
                          styles.attemptedText,
                          {
                            color: item.isCorrect ? theme.success : theme.error,
                          },
                        ]}
                      >
                        {item.isCorrect ? 'Correct' : 'Incorrect'}
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[styles.questionText, { color: theme.text }]}
                  numberOfLines={3}
                >
                  {item.question}
                </Text>

                <View style={styles.questionFooter}>
                  <TouchableOpacity
                    style={[
                      styles.solveButton,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={() => {
                      // Navigate to solve this specific PYQ
                      navigation.navigate('Quiz', {
                        mode: 'pyq',
                        subjectId: subject.id,
                        subjectName: subject.name,
                        year: selectedYear,
                        questionId: item.id,
                      });
                    }}
                  >
                    <Text style={styles.solveButtonText}>
                      {item.attempted ? 'Review' : 'Solve'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
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

        <View style={[styles.statsRow, { backgroundColor: theme.card }]}>
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

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Year-wise PYQs
        </Text>

        <FlatList
          data={subject.pyq.yearWiseAttempts}
          keyExtractor={item => item.year}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.yearCard, { backgroundColor: theme.card }]}
              onPress={() => setSelectedYear(item.year)}
            >
              <View style={styles.yearInfo}>
                <Text style={[styles.yearTitle, { color: theme.text }]}>
                  GATE {item.year}
                </Text>
                <Text style={[styles.yearProgress, { color: theme.text }]}>
                  {item.attempted}/{item.total} attempted
                </Text>
              </View>

              <View
                style={[
                  styles.yearProgressBar,
                  { backgroundColor: `${theme.primary}20` },
                ]}
              >
                <View
                  style={[
                    styles.yearProgressFill,
                    {
                      width: `${(item.attempted / item.total) * 100}%`,
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
              </View>

              <Icon name="chevron-right" size={24} color={theme.primary} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />

        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              // Navigate to a practice mode that combines questions from all years
              navigation.navigate('Quiz', {
                mode: 'pyq',
                subjectId: subject.id,
                subjectName: subject.name,
              });
            }}
          >
            <Icon name="play" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Practice All PYQs</Text>
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

        {/* PYQ Tab - Enhanced */}
        {selectedTab === 'pyq' && (
          <>
            <Text style={[styles.title, { color: theme.text }]}>
              PYQ Tracker
            </Text>
            
            {/* Enhanced Stats Row */}
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

            {/* Action Button with Fixed Styling */}
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { 
                  backgroundColor: theme.primary,
                  marginHorizontal: 16,
                  marginVertical: 8,
                  paddingVertical: 12
                }]}
                onPress={() => navigation.navigate('Quiz', {
                  quizType: 'pyq',
                  questionCount: 10,
                  difficulty: 'medium'
                })}
              >
                <Icon name="shuffle-variant" size={20} color="#FFFFFF" style={{marginRight: 8}} />
                <Text style={[styles.actionButtonText, {fontSize: 16, fontWeight: '500'}]}>
                  Random PYQ Practice
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 16 }]}>
              Subject-wise PYQs
            </Text>
            
            {/* Fixed Card Layout */}
            <FlatList
              data={pyqStats.subjects}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.subjectCard, { 
                    backgroundColor: theme.card,
                    marginBottom: 12,
                    padding: 16,
                    borderRadius: 12
                  }]}
                  onPress={() => setSelectedPyqSubject(item)}
                >
                  <View style={styles.subjectInfo}>
                    <Text style={[styles.subjectTitle, { 
                      color: theme.text, 
                      fontSize: 16,
                      fontWeight: 'bold',
                      marginBottom: 8 
                    }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.progressText, { color: theme.text }]}>
                      {item.pyq.attempted} attempted, {item.pyq.correct} correct, {item.pyq.incorrect} incorrect
                    </Text>
                    
                    {/* Topic Progress Section with Fixed Styling */}
                    <View style={[styles.topicProgressContainer, {marginTop: 12}]}>
                      {item.topics && item.topics.slice(0, 3).map(topic => (
                        <View key={topic.id} style={[styles.topicProgressItem, {marginBottom: 10}]}>
                          <View style={styles.topicProgressHeader}>
                            <Text style={[styles.topicProgressLabel, { color: theme.text }]}>
                              {topic.name}
                            </Text>
                            <Text style={[styles.topicProgressValue, { color: theme.primary }]}>
                              {topic.correctPercentage}%
                            </Text>
                          </View>
                          <View style={[styles.topicProgressBar, { 
                            backgroundColor: `${theme.primary}20`,
                            height: 6,
                            marginTop: 4 
                          }]}>
                            <View 
                              style={[styles.topicProgressFill, { 
                                backgroundColor: theme.primary,
                                width: `${topic.correctPercentage}%`,
                                height: '100%' 
                              }]} 
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Icon name="chevron-right" size={24} color={theme.primary} />
                </TouchableOpacity>
              )}
              scrollEnabled={true}
              contentContainerStyle={styles.list}
            />
          </>
        )}

        {/* Quizzes Tab - Enhanced */}
        {selectedTab === 'quizzes' && (
          <>
            <Text style={[styles.title, { color: theme.text }]}>
              Quizzes Tracker
            </Text>

            {/* Enhanced Action Button */}
            <View style={[styles.actionButtonContainer, {marginHorizontal: 16, marginBottom: 16}]}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { 
                    backgroundColor: theme.primary,
                    paddingVertical: 14,
                    borderRadius: 10
                  },
                ]}
                onPress={() => navigation.navigate('Quiz', {
                  quizType: 'ai',
                  questionCount: 10,
                  difficulty: 'medium'
                })}
              >
                <Icon name="plus" size={20} color="#FFFFFF" style={{marginRight: 8}} />
                <Text style={[styles.actionButtonText, {fontSize: 16, fontWeight: '500'}]}>
                  Take New Quiz
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Quiz Results
            </Text>

            {/* Enhanced Quiz Cards */}
            <FlatList
              data={quizzes}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.quizCard, { 
                    backgroundColor: theme.card,
                    marginHorizontal: 16,
                    marginBottom: 12,
                    padding: 16,
                    borderRadius: 12,
                    elevation: 3
                  }]}
                  onPress={() => navigation.navigate('QuizResult', {
                    result: {
                      quizId: item.id,
                      subject: item.subject,
                      score: item.score,
                      correctAnswers: item.correctCount,
                      totalQuestions: item.questionCount,
                      timeTaken: item.time,
                      date: item.date,
                      feedback: {
                        mentorAnalysis: item.mentorFeedback || "Good attempt on this quiz!",
                        questionByQuestionReview: item.questions || []
                      }
                    }
                  })}
                >
                  <View style={styles.quizInfo}>
                    <Text style={[styles.quizSubject, { 
                      color: theme.primary, 
                      fontSize: 16,
                      fontWeight: 'bold',
                      marginBottom: 6
                    }]}>
                      {item.subject}
                    </Text>
                    <Text style={[styles.quizScore, { 
                      color: theme.text,
                      fontSize: 15,
                      marginBottom: 6
                    }]}>
                      Score: {item.score}% ({item.correctCount}/{item.questionCount})
                    </Text>
                    <Text style={[styles.quizTopics, { color: theme.textSecondary }]}>
                      {item.topicsCovered.join(', ')}
                    </Text>
                    
                    {item.trend && (
                      <View style={[styles.trendContainer, {marginTop: 8}]}>
                        <Icon 
                          name={item.trend === 'up' ? 'trending-up' : item.trend === 'down' ? 'trending-down' : 'trending-neutral'} 
                          size={18} 
                          color={item.trend === 'up' ? '#4CAF50' : item.trend === 'down' ? '#F44336' : theme.textSecondary} 
                        />
                        <Text style={[
                          styles.trendText, 
                          { 
                            color: item.trend === 'up' ? '#4CAF50' : item.trend === 'down' ? '#F44336' : theme.textSecondary,
                            marginLeft: 6
                          }
                        ]}>
                          {item.trend === 'up' ? 'Improved' : item.trend === 'down' ? 'Declined' : 'Stable'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.quizMeta}>
                    <Text style={[styles.quizDate, { color: theme.textSecondary }]}>
                      {item.date}
                    </Text>
                    <Text style={[styles.quizTime, { color: theme.textSecondary, marginVertical: 4 }]}>
                      {item.time}
                    </Text>
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                </TouchableOpacity>
              )}
              scrollEnabled={true}
              contentContainerStyle={[styles.list, {paddingBottom: 20}]}
            />
          </>
        )}

        {/* Analytics Tab - Enhanced */}
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

            <View
              style={[
                styles.insightsContainer,
                {
                  backgroundColor: theme.card,
                  marginHorizontal: 16,
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                },
              ]}
            >
              <Text
                style={[
                  styles.insightsTitle,
                  {
                    color: theme.text,
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginBottom: 12,
                  },
                ]}
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

            <TouchableOpacity
              style={[
                styles.viewDetailButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={() => navigation.navigate('Analytics')}
            >
              <Text style={styles.viewDetailButtonText}>
                View Detailed Analytics
              </Text>
              <Icon name="arrow-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
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
    marginBottom: 4,
  },
  quizTopics: {
    fontSize: 12,
    opacity: 0.7,
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
  // New styles for PYQ section
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
  
  // New styles for Quiz section
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButtonContainer: {
    marginVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TrackerScreen;
