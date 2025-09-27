import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
// import subjects from '../data/subjects';
import { useApp } from '../context/AppContext';
import CustomHeader from '../components/CustomHeader';
import api from '../services/api';
import { useData } from '../context/DataContext';

const TABS = [
  { key: 'syllabus', label: 'Syllabus' },
  { key: 'pyq', label: 'PYQ' },
  { key: 'quizzes', label: 'Quizzes' },
  { key: 'analytics', label: 'Analytics' },
];

const TrackerScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const { progress, updateProgress } = useApp();
  const {
    syllabusWithProgress,
    subjects,
    loading: dataLoading,
    errors: dataErrors,
    fetchSyllabusWithProgress,
    fetchSubjects,
  } = useData();

  // Add safe destructuring with defaults
  const {
    topic,
    subjectName,
    initialTab = 'syllabus',
    selectedSubjectId,
    selectedTopicId,
  } = route.params || {};

  const [isLoading, setIsLoading] = useState({
    subjects: false,
    analytics: false,
    quizzes: false,
    pyqs: false,
    pyqQuestions: false,
  });
  const [completedSubtopics, setCompletedSubtopics] = useState(() => {
    // Create a set of all completed subtopic IDs by scanning through the data
    const completedSet = new Set();

    // We'll populate this when data is loaded - initially empty
    return completedSet;
  });
  const [loading, setLoading] = useState({});
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedPyqSubject, setSelectedPyqSubject] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [pyqQuestions, setPyqQuestions] = useState([]);
  const [subjectsData, setSubjectsData] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

  // --- Progress Calculations ---
  const calculateProgress = () => {
    let totalTopics = dashboardData?.totalSubtopics || 0;
    let completedTopics = dashboardData?.completedSubtopics || 0;

    return {
      percentage:
        totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      completed: completedTopics,
      total: totalTopics,
    };
  };

  // MOVE ALL STATE DEFINITIONS HERE
  const [analytics, setAnalytics] = useState({
    daily: { topics: 0, pyqs: 0, quizzes: 0 },
    weekly: { topics: 0, pyqs: 0, quizzes: 0 },
    monthly: { topics: 0, pyqs: 0, quizzes: 0 },
    overall: calculateProgress(),
    strengths: [],
    weaknesses: [],
    improvement: [],
  });

  const [pyqStats, setPyqStats] = useState({
    attempted: 0,
    correct: 0,
    incorrect: 0,
    subjects: [],
  });
  const [quizzes, setQuizzes] = useState([]);

  const calculateSubjectProgressFromData = subject => {
    if (!subject || !subject.units) {
      return { percentage: 0, completed: 0, total: 0 };
    }

    console.log('Calculating progress for subject:', subject.name);

    // Calculate totals from topics that have API-provided progress values
    let totalTopics = 0;
    let completedTopicsValue = 0;
    let totalSubtopics = 0;
    let completedSubtopics = 0;

    subject.units.forEach(unit => {
      if (unit.topics) {
        unit.topics.forEach(topic => {
          if (topic.subtopics && topic.subtopics.length > 0) {
            totalSubtopics += topic.subtopics.length;
            // Use completedCount provided by API if available
            if (topic.completedCount !== undefined) {
              completedSubtopics += topic.completedCount;
            } else {
              completedSubtopics += topic.subtopics.filter(
                st => st.status === 'completed',
              ).length;
            }
            // Also track topic-level completion
            totalTopics++;
            if (topic.progress === 100) {
              completedTopicsValue++;
            }
          }
        });
      }
    });

    // Calculate percentage based on subtopics
    const percentage =
      totalSubtopics > 0
        ? Math.round((completedSubtopics / totalSubtopics) * 100)
        : 0;

    console.log(
      `Subject: ${subject.name}, Completed Subtopics: ${completedSubtopics}, Total Subtopics: ${totalSubtopics}, Percentage: ${percentage}%`,
    );
    return {
      percentage,
      completed: completedSubtopics,
      total: totalSubtopics,
      completedTopics: completedTopicsValue,
      totalTopics: totalTopics,
    };
  };

  // Change calculateTopicProgress to use the API-provided progress
  const calculateTopicProgress = topic => {
    // Use the progress value directly provided by the API
    if (topic && topic.progress !== undefined) {
      console.log('Topic progress from API:', topic.progress);
      return typeof topic.progress === 'number' ? topic.progress : 0;
    }

    // Fallback calculation only if API doesn't provide progress
    if (!topic || !topic.subtopics || topic.subtopics.length === 0) {
      return 0;
    }

    const completedCount = topic.subtopics.filter(
      st => st.status === 'completed' || completedSubtopics.has(st.id),
    ).length;

    return Math.round((completedCount / topic.subtopics.length) * 100);
  };

  const toggleSubtopicStatus = async subtopicId => {
    setLoading(prev => ({ ...prev, [subtopicId]: true }));

    try {
      // Find subtopic in current topic
      const subtopic = selectedTopic.subtopics.find(s => s.id === subtopicId);
      if (!subtopic) return;

      // Determine current completion status - using API response data
      const isCurrentlyCompleted = subtopic.status === 'completed';
      const newStatus = isCurrentlyCompleted ? 'not_started' : 'completed';

      console.log(`Updating subtopic ${subtopicId} to ${newStatus}...`);

      // Update API
      await api.progress.markSubtopicCompleted(subtopicId, newStatus);

      console.log(
        `Successfully updated subtopic ${subtopicId} to ${newStatus}`,
      );

      // Update local subtopic state immediately for better UX
      setSelectedTopic(prevTopic => ({
        ...prevTopic,
        subtopics: prevTopic.subtopics.map(s =>
          s.id === subtopicId ? { ...s, status: newStatus } : s,
        ),
        // Also update topic's progress and completedCount
        completedCount: isCurrentlyCompleted
          ? prevTopic.completedCount - 1
          : prevTopic.completedCount + 1,
        progress: Math.round(
          ((isCurrentlyCompleted
            ? prevTopic.completedCount - 1
            : prevTopic.completedCount + 1) /
            prevTopic.subtopics.length) *
            100,
        ),
      }));

      // Update completedSubtopics set
      setCompletedSubtopics(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyCompleted) {
          newSet.delete(subtopicId);
        } else {
          newSet.add(subtopicId);
        }
        return newSet;
      });

      // Refresh all data to ensure consistency
      setTimeout(() => {
        loadData();
      }, 500); // Small delay to ensure API has processed the update
    } catch (error) {
      console.error('Error updating subtopic progress:', error);
      Alert.alert(
        'Error',
        'Failed to update subtopic progress. Please try again.',
      );
    } finally {
      setLoading(prev => ({ ...prev, [subtopicId]: false }));
    }
  };

  // Temporary debugging - add this inside your component
  React.useEffect(() => {
    console.log('Available API modules:', Object.keys(api));
    console.log('API PYQ module:', api.pyq);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // Find the subject if an ID was provided
  React.useEffect(() => {
    if (selectedSubjectId) {
      const foundSubject = subjects.find(s => s.id === selectedSubjectId);
      if (foundSubject) {
        setSelectedSubject(foundSubject);
      }
    }
  }, [selectedSubjectId]);

  React.useEffect(() => {
    if (selectedTopic && selectedTopic.subtopics) {
      // Update completedSubtopics based on the current topic's subtopics
      const topicCompletedSubtopics = new Set();

      selectedTopic.subtopics.forEach(subtopic => {
        if (subtopic.status === 'completed' || subtopic.completed) {
          topicCompletedSubtopics.add(subtopic.id);
        }
      });

      // Update the completedSubtopics set with these completed subtopics
      setCompletedSubtopics(prev => {
        const newSet = new Set(prev);
        topicCompletedSubtopics.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [selectedTopic]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Screen focused, refreshing data');
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  // Call this in a useEffect
  React.useEffect(() => {
    loadData();
  }, [selectedTab]);

  React.useEffect(() => {
    // This runs whenever subjectsData changes (API data refreshes)
    if (subjectsData.length > 0) {
      updateCompletedSubtopicsFromData(subjectsData);

      // If we have a selected subject, make sure its data is fresh
      if (selectedSubject) {
        const freshSubject = subjectsData.find(
          s => s.id === selectedSubject.id,
        );
        if (freshSubject) {
          setSelectedSubject(freshSubject);
        }
      }
    }
  }, [subjectsData]);

  const updateCompletedSubtopicsFromData = data => {
    const completedSet = new Set();

    // Process the whole syllabus structure to find completed subtopics
    if (data && data.length > 0) {
      data.forEach(subject => {
        if (subject.units) {
          subject.units.forEach(unit => {
            if (unit.topics) {
              unit.topics.forEach(topic => {
                if (topic.subtopics) {
                  topic.subtopics.forEach(subtopic => {
                    // Mark as completed if status is 'completed'
                    if (subtopic.status === 'completed') {
                      completedSet.add(subtopic.id);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    console.log(`Found ${completedSet.size} completed subtopics from API data`);
    setCompletedSubtopics(completedSet);
  };

  // Add a loadData function
  const loadData = async () => {
    if (selectedTab === 'syllabus') {
      setIsLoading(prev => ({ ...prev, subjects: true }));
      try {
        // First get dashboard summary
        const summaryResponse = await api.dashboard.getSummary();
        setDashboardData(summaryResponse.data);

        // Use cached syllabus data or fetch if not available
        if (!syllabusWithProgress) {
          await fetchSyllabusWithProgress();
        } else {
          // Update completed subtopics from cached data
          updateCompletedSubtopicsFromData(syllabusWithProgress);
          setSubjectsData(syllabusWithProgress);
        }

        // Refresh specific subject data if selected
        if (selectedSubject) {
          const freshSubject = syllabusWithProgress?.find(
            s => s.id === selectedSubject.id,
          );
          if (freshSubject) {
            setSelectedSubject(freshSubject);
          }
        }
      } catch (err) {
        console.error('Error loading syllabus data:', err);
      } finally {
        setIsLoading(prev => ({ ...prev, subjects: false }));
      }
    } else if (selectedTab === 'pyq') {
      setIsLoading(prev => ({ ...prev, pyqs: true }));
      try {
        // Check if the API module exists before calling it
        if (!api.pyq || !api.pyq.getAllPyqStats) {
          throw new Error('PYQ API not available');
        }

        // Fetch PYQ statistics from the real API
        const response = await api.pyq.getAllPyqStats();
        console.log('PYQ stats fetched:', response.data);

        if (response.data) {
          setPyqStats(response.data);
        }
      } catch (err) {
        console.error('Error loading PYQ data:', err);

        // Show an informative error message
        Alert.alert(
          'Failed to Load',
          'Could not load PYQ data. The API endpoint may not be implemented yet.',
          [
            {
              text: 'OK',
              style: 'cancel',
            },
            {
              text: 'Use Mock Data',
              onPress: () => {
                // Create mock PYQ data as a fallback
                const mockPyqStats = {
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
                setPyqStats(mockPyqStats);
              },
            },
          ],
        );
      } finally {
        setIsLoading(prev => ({ ...prev, pyqs: false }));
      }
    }
  };

  // Add this function to fetch PYQ questions
  const fetchPyqQuestions = async (subjectId, year = null) => {
    setIsLoading(prev => ({ ...prev, pyqQuestions: true }));

    try {
      let response;
      if (year) {
        // Fetch questions for specific year and subject
        response = await api.pyq.getPyqQuestionsBySubjectAndYear(
          subjectId,
          year,
        );
      } else {
        // Fetch all questions for subject
        response = await api.pyq.getPyqQuestionsBySubject(subjectId);
      }

      console.log('PYQ questions fetched:', response.data);
      setPyqQuestions(response.data);
    } catch (err) {
      console.error('Error loading PYQ questions:', err);
      Alert.alert('Failed to Load', 'Could not load PYQ questions.');
    } finally {
      setIsLoading(prev => ({ ...prev, pyqQuestions: false }));
    }
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
  const toggleSubtopic = async subtopic => {
    if (!subtopic) return; // Safety check

    const subtopicId = subtopic.id;
    const newCompletedState = !completedSubtopics.has(subtopicId);

    // Start loading state for this item
    setLoading(prev => ({ ...prev, [subtopicId]: true }));

    try {
      // Call API to update progress
      await api.progress.markSubtopicCompleted(subtopicId);

      // Update local state
      const newCompletedSubtopics = new Set(completedSubtopics);
      if (newCompletedState) {
        newCompletedSubtopics.add(subtopicId);
      } else {
        newCompletedSubtopics.delete(subtopicId);
      }
      setCompletedSubtopics(newCompletedSubtopics);
    } catch (error) {
      console.error('Error updating progress:', error);
      Alert.alert(
        'Update Failed',
        'Could not update your progress. Please try again.',
      );
    } finally {
      // Stop loading state for this item
      setLoading(prev => ({ ...prev, [subtopicId]: false }));
    }
  };

  const handleTopicPress = (subjectId, unitId, topicId) => {
    // Find the topic in the data
    const subject = subjectsData.find(s => s.id === subjectId);
    if (!subject) return;

    const unit = subject.units.find(u => u.id === unitId);
    if (!unit) return;

    const topic = unit.topics.find(t => t.id === topicId);
    if (!topic) return;

    // If topic has subtopics, show them
    if (topic.subtopics && topic.subtopics.length > 0) {
      console.log('Topic selected with subtopics:', topic);
      setSelectedTopic(topic);
    } else {
      // If no subtopics, toggle completion status
      toggleTopicStatus(subjectId, unitId, topicId);
    }
  };

  // Add the topic detail view
  // Update the topic detail view to match SubjectDetailScreen's subtopic handling
  if (selectedTopic && selectedTab === 'syllabus') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <CustomHeader
          title={selectedTopic.name}
          navigation={navigation}
          onBack={() => setSelectedTopic(null)}
        />
        {/* Overall topic progress */}
        <View
          style={[
            styles.overallCard,
            {
              backgroundColor: theme.card,
              margin: 16,
              padding: 16,
              borderRadius: 12,
            },
          ]}
        >
          <Text style={[styles.overallTitle, { color: theme.text }]}>
            Subtopics Progress
          </Text>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${calculateTopicProgress(selectedTopic) || 0}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.overallText, { color: theme.text }]}>
            {(selectedTopic?.progress / 100) * selectedTopic?.subtopics.length}/
            {selectedTopic.subtopics.length} subtopics completed
          </Text>
        </View>
        // In the FlatList renderItem for subtopics
        <FlatList
          data={selectedTopic.subtopics}
          keyExtractor={item => item.id}
          renderItem={({ item: subtopic }) => {
            const isCompleted = subtopic?.progress === 'completed';

            return (
              <TouchableOpacity
                style={[
                  styles.subtopicItem,
                  {
                    backgroundColor: theme.card,
                    padding: 16,
                    borderRadius: 8,
                    marginHorizontal: 16,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderLeftWidth: 4,
                    borderLeftColor: isCompleted
                      ? theme.primary
                      : 'transparent',
                  },
                ]}
                onPress={() => toggleSubtopicStatus(subtopic.id)}
              >
                <Text
                  style={[
                    styles.subtopicName,
                    {
                      color: theme.text,
                      flex: 1,
                      textDecorationLine: isCompleted ? 'line-through' : 'none',
                      opacity: isCompleted ? 0.7 : 1,
                    },
                  ]}
                >
                  {subtopic.name}
                </Text>

                {loading[subtopic.id] ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Icon
                    name={
                      isCompleted
                        ? 'checkbox-marked-circle'
                        : 'checkbox-blank-circle-outline'
                    }
                    size={24}
                    color={isCompleted ? theme.primary : theme.text}
                  />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  }

  // Update renderSubjectItem to handle the 4-layer structure
  const renderSubjectItem = ({ item }) => {
    // Calculate progress using the API data
    const subjectProgress = calculateSubjectProgressFromData(item);

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

  // --- Subject Detail for Syllabus ---
  if (selectedSubject && selectedTab === 'syllabus') {
    return (
      <>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <CustomHeader
            title={selectedSubject.name}
            navigation={navigation}
            onBack={() => setSelectedSubject(null)}
          />

          {/* Overall subject progress */}
          <View
            style={[
              styles.overallCard,
              {
                backgroundColor: theme.card,
                margin: 16,
                padding: 16,
                borderRadius: 12,
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
                    width: `${selectedSubject?.progress || 0}%`,
                    backgroundColor: theme.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.overallText, { color: theme.text }]}>
              {selectedSubject?.progress || 0}% Complete
            </Text>
          </View>

          {/* Units List */}
          <FlatList
            data={selectedSubject.units || []}
            keyExtractor={item => item.id}
            renderItem={({ item: unit }) => (
              <View
                style={[
                  styles.unitContainer,
                  { marginBottom: 16, paddingHorizontal: 16 },
                ]}
              >
                <Text
                  style={[
                    styles.unitTitle,
                    {
                      color: theme.text,
                      fontSize: 18,
                      fontWeight: 'bold',
                      marginBottom: 8,
                    },
                  ]}
                >
                  {unit.name}
                </Text>

                {/* Topics within this unit */}
                {unit.topics &&
                  unit.topics.map(topic => (
                    <TouchableOpacity
                      key={topic.id}
                      style={[
                        styles.topicItem,
                        {
                          backgroundColor: theme.card,
                          borderLeftWidth: 4,
                          borderLeftColor:
                            calculateTopicProgress(topic) === 100
                              ? theme.primary
                              : 'transparent',
                          marginBottom: 8,
                          borderRadius: 8,
                        },
                      ]}
                      onPress={() => {
                        if (topic.subtopics && topic.subtopics.length > 0) {
                          setSelectedTopic(topic);
                        }
                      }}
                    >
                      <View style={styles.topicContent}>
                        <Text
                          style={[
                            styles.topicName,
                            { color: theme.text, fontWeight: '500' },
                          ]}
                        >
                          {topic.name}
                        </Text>

                        {/* Progress bar based on subtopics */}
                        <View style={styles.progressContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              {
                                width: `${calculateTopicProgress(topic) || 0}%`,
                                backgroundColor: theme.primary,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.subtopicCount,
                            {
                              color: theme.textSecondary,
                              fontSize: 12,
                              marginTop: 4,
                            },
                          ]}
                        >
                          {topic.subtopics
                            ? `${Math.round(
                                ((topic?.progress || 0) / 100) *
                                  (topic?.subtopics?.length || 0),
                              )}/${topic.subtopics.length} subtopics`
                            : 'No subtopics'}
                        </Text>
                      </View>

                      {/* Show appropriate icon based on subtopics */}
                      <Icon
                        name={
                          topic.subtopics && topic.subtopics.length > 0
                            ? 'chevron-right'
                            : 'circle-outline'
                        }
                        size={24}
                        color={
                          calculateTopicProgress(topic) === 100
                            ? theme.primary
                            : theme.text
                        }
                      />
                    </TouchableOpacity>
                  ))}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="book-outline" size={64} color={`${theme.text}20`} />
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  No units found in this subject
                </Text>
              </View>
            }
          />
        </View>
      </>
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
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <CustomHeader
            title={`${subject.name} - ${selectedYear} PYQs`}
            navigation={navigation}
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
        </View>
      );
    }

    // Subject years list view
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <CustomHeader
          title={`${subject.name} PYQs`}
          navigation={navigation}
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
      </View>
    );
  }

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

  // --- Main Tracker Screen ---
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomHeader
        title="Study Progress Tracker"
        navigation={navigation}
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
                      width: `${dashboardData?.overallProgress || 0}%`,
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.overallText, { color: theme.text }]}>
                {dashboardData?.overallProgress}% -{' '}
                {dashboardData?.completedSubtopics}/
                {dashboardData?.totalSubtopics} topics completed
              </Text>
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Subjects
            </Text>

            {/* Use the fetched data instead of static data */}
            {isLoading.subjects ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>
                  Loading syllabus data...
                </Text>
              </View>
            ) : (
              <FlatList
                data={subjectsData.length > 0 ? subjectsData : subjects}
                keyExtractor={item => item.id}
                renderItem={renderSubjectItem}
                scrollEnabled={false}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon
                      name="book-outline"
                      size={64}
                      color={`${theme.text}20`}
                    />
                    <Text
                      style={[styles.emptyText, { color: theme.textSecondary }]}
                    >
                      No subjects found. Pull down to refresh.
                    </Text>
                  </View>
                }
              />
            )}

            {/* Add refresh capability */}
            <TouchableOpacity
              style={[
                styles.refreshButton,
                {
                  backgroundColor: theme.primary,
                  marginHorizontal: 16,
                  marginTop: 8,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                },
              ]}
              onPress={loadData}
              disabled={isLoading.subjects}
            >
              <Icon
                name="refresh"
                size={20}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: '#FFF', fontWeight: '600' }}>
                Refresh Data
              </Text>
            </TouchableOpacity>
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
                      mode: 'pyq',
                      subjectId: subject.id,
                      subjectName: subject.name,
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

        {/* Add this conditional rendering for loading states */}
        {isLoading[selectedTab] && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading {selectedTab} data...
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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

const AnalyticsBox = ({ label, data, theme }) => {
  // Safely access data properties
  const topics = data?.topics ?? data?.completed ?? 0;
  const pyqs = data?.pyqs ?? 0;
  const quizzes = data?.quizzes ?? 0;
  const percentage = data?.percentage;

  return (
    <View style={[styles.analyticsBox, { backgroundColor: theme.card }]}>
      <Text style={[styles.analyticsLabel, { color: theme.primary }]}>
        {label}
      </Text>
      <Text style={[styles.analyticsText, { color: theme.text }]}>
        Topics: {topics}
      </Text>
      <Text style={[styles.analyticsText, { color: theme.text }]}>
        PYQs: {pyqs}
      </Text>
      <Text style={[styles.analyticsText, { color: theme.text }]}>
        Quizzes: {quizzes}
      </Text>
      {percentage !== undefined && (
        <Text style={[styles.analyticsText, { color: theme.text }]}>
          Completion: {percentage}%
        </Text>
      )}
    </View>
  );
};

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
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    // marginBottom: 8,
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
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  refreshButton: {
    paddingVertical: 12,
    marginVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
});

export default TrackerScreen;
