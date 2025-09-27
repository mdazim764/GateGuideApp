import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/CustomHeader';
import Slider from '@react-native-community/slider';
import DropDownPicker from 'react-native-dropdown-picker';
import api from '../services/api';

const { width } = Dimensions.get('window');

const QuizScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const initialParams = route.params || {};

  // State for subjects and topics that will be fetched from the API
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Quiz setup state
  const [setupMode, setSetupMode] = useState(true);
  const [quizType, setQuizType] = useState(initialParams.quizType || 'ai');
  const [selectedSubject, setSelectedSubject] = useState(
    initialParams.subjectId || null,
  );
  const [selectedTopic, setSelectedTopic] = useState(
    initialParams.topicId || null,
  );

  // Dropdown state
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [subjectItems, setSubjectItems] = useState([
    { label: 'All Subjects', value: 'all' },
  ]);
  const [topicItems, setTopicItems] = useState([
    { label: 'All Topics', value: 'all' },
  ]);

  // Quiz configuration
  const [questionCount, setQuestionCount] = useState(
    initialParams.questionCount || 10,
  );
  const [difficulty, setDifficulty] = useState(
    initialParams.difficulty || 'medium',
  );
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timeLimit, setTimeLimit] = useState(initialParams.timeLimit || 30);

  // Quiz state
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [remainingTime, setRemainingTime] = useState(timeLimit * 60);
  const [submitting, setSubmitting] = useState(false);

  // New state for generating quiz
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const timerRef = useRef(null);

  // Fetch subjects from the API
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await api.academic.getSyllabusTree();

        // Map the response to the format expected by the dropdown
        const subjectsData = response.data.map(subject => ({
          id: subject.id,
          name: subject.name,
          topics: subject.units.flatMap(unit =>
            unit.topics.map(topic => ({
              id: topic.id,
              name: topic.name,
            })),
          ),
        }));

        setSubjects(subjectsData);

        // Create a topics object organized by subject ID
        const topicsObj = {};
        subjectsData.forEach(subject => {
          topicsObj[subject.id] = subject.topics;
        });
        setTopics(topicsObj);

        // Update dropdown items
        setSubjectItems([
          { label: 'All Subjects', value: 'all' },
          ...subjectsData.map(subject => ({
            label: subject.name,
            value: subject.id,
          })),
        ]);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setApiError('Failed to load subjects. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Timer setup
  useEffect(() => {
    if (!setupMode && quiz && timerEnabled) {
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Set up the timer based on time limit or elapsed time tracking
      timerRef.current = setInterval(() => {
        if (timeLimit > 0) {
          // Countdown timer
          setRemainingTime(prev => {
            if (prev <= 1) {
              // Time's up, submit the quiz
              clearInterval(timerRef.current);
              submitQuizOnTimeout();
              return 0;
            }
            return prev - 1;
          });
        } else {
          // Elapsed time counter
          setTimeSpent(prev => prev + 1);
        }
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [setupMode, quiz, timerEnabled, timeLimit]);

  // Update topics when subject changes
  useEffect(() => {
    if (selectedSubject && selectedSubject !== 'all') {
      const topicsForSubject = getTopicsForSubject(selectedSubject);
      setTopicItems([
        { label: 'All Topics', value: 'all' },
        ...topicsForSubject.map(topic => ({
          label: topic.name,
          value: topic.id,
        })),
      ]);
    } else {
      setTopicItems([{ label: 'All Topics', value: 'all' }]);
    }
  }, [selectedSubject]);

  // Handle dropdown conflicts
  useEffect(() => {
    if (subjectOpen) setTopicOpen(false);
  }, [subjectOpen]);

  useEffect(() => {
    if (topicOpen) setSubjectOpen(false);
  }, [topicOpen]);

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Generate quiz from API
  const handleStartQuiz = useCallback(async () => {
    try {
      setLoading(true);
      setGeneratingQuiz(true); // Set the generating quiz state

      // Prepare quiz options
      const quizOptions = {
        subjectIds: selectedSubject === 'all' ? [] : [selectedSubject],
        topicIds: selectedTopic === 'all' ? [] : [selectedTopic],
        quizType: quizType.toUpperCase(),
        difficulty: difficulty,
        questionCount: questionCount,
        isFullSyllabusTest: selectedSubject === 'all',
      };

      // Show a message that quiz generation might take time for specific topics
      if (selectedTopic && selectedTopic !== 'all') {
        Alert.alert(
          'Generating Quiz',
          'Creating a specialized quiz may take some time. Please wait...',
          [{ text: 'OK' }],
        );
      }

      // Call the API to generate a quiz
      const response = await api.quizzes.generate(quizOptions);

      // Reset quiz state
      setQuiz(response.data);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setTimeSpent(0);
      setRemainingTime(timeLimit * 60);
      setSetupMode(false);
    } catch (error) {
      console.error('Error generating quiz:', error);

      // More detailed error handling
      if (error.message === 'Network Error') {
        Alert.alert(
          'Connection Issue',
          'The quiz is taking longer than expected to generate. Please try again or select a broader topic.',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert(
          'Quiz Generation Failed',
          error.response?.data?.message ||
            'Failed to generate quiz. Please try again.',
          [{ text: 'OK' }],
        );
      }
    } finally {
      setLoading(false);
      setGeneratingQuiz(false); // Reset the generating quiz state
    }
  }, [
    quizType,
    selectedSubject,
    selectedTopic,
    questionCount,
    difficulty,
    timeLimit,
  ]);

  // Helper function to check if quiz can be started
  const canStartQuiz = useCallback(() => {
    return (
      selectedSubject !== null &&
      (selectedSubject === 'all' || selectedTopic !== null)
    );
  }, [selectedSubject, selectedTopic]);

  const handleSelectAnswer = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const isQuizComplete = () => {
    return Object.keys(selectedAnswers).length === quiz.questions.length;
  };

  // Submit quiz to API
  const handleSubmitQuiz = useCallback(async () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      setSubmitting(true);

      // Prepare submission data
      const submissionData = {
        answers: Object.entries(selectedAnswers).map(
          ([questionId, answer]) => ({
            questionId,
            selectedAnswer: answer,
          }),
        ),
        timeTaken: timeSpent,
      };

      // Submit the quiz
      const response = await api.quizzes.submitQuiz(quiz.id, submissionData);

      // Navigate to results screen with the attempt ID
      navigation.replace('QuizResult', { attemptId: response.data.attemptId });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert(
        'Submission Failed',
        error.response?.data?.message ||
          'Failed to submit quiz. Please try again.',
        [{ text: 'OK' }],
      );
      setSubmitting(false);
    }
  }, [quiz, selectedAnswers, timeSpent, navigation]);

  const submitQuizOnTimeout = () => {
    if (!quiz) return;

    // Handle the same as manual submission
    handleSubmitQuiz();
  };

  const getTopicsForSubject = subjectId => {
    const selectedSubjectData = subjects.find(s => s.id === subjectId);
    return selectedSubjectData?.topics || [];
  };

  const getSelectedSubjectName = () => {
    if (!selectedSubject) return 'General';
    if (selectedSubject === 'all') return 'Multiple Subjects';

    const subject = subjects.find(s => s.id === selectedSubject);
    return subject ? subject.name : 'General';
  };

  const getSelectedTopicName = () => {
    if (!selectedTopic) return 'All Topics';
    if (selectedTopic === 'all') return 'Multiple Topics';

    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject || !subject.topics) return 'All Topics';

    const topic = subject.topics.find(t => t.id === selectedTopic);
    return topic ? topic.name : 'All Topics';
  };

  // UI rendering
  const renderQuizSetup = () => {
    return (
      <ScrollView style={styles.setupContainer}>
        {/* Quiz Type Tab Selection */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              quizType === 'ai' && {
                backgroundColor: theme.primary,
                borderTopLeftRadius: 12,
                borderBottomLeftRadius: 12,
              },
            ]}
            onPress={() => setQuizType('ai')}
          >
            <Icon
              name="robot"
              size={18}
              color={quizType === 'ai' ? '#FFFFFF' : theme.text}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                { color: quizType === 'ai' ? '#FFFFFF' : theme.text },
              ]}
            >
              AI Quiz
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              quizType === 'pyq' && {
                backgroundColor: theme.primary,
                borderTopRightRadius: 12,
                borderBottomRightRadius: 12,
              },
            ]}
            onPress={() => setQuizType('pyq')}
          >
            <Icon
              name="history"
              size={18}
              color={quizType === 'pyq' ? '#FFFFFF' : theme.text}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                { color: quizType === 'pyq' ? '#FFFFFF' : theme.text },
              ]}
            >
              PYQ Test
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quiz Type Description */}
        <View
          style={[
            styles.descriptionCard,
            { backgroundColor: `${theme.primary}15` },
          ]}
        >
          <Icon
            name={quizType === 'ai' ? 'robot' : 'history'}
            size={20}
            color={theme.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: theme.text, fontSize: 14 }}>
            {quizType === 'ai'
              ? 'AI-generated questions tailored to your skill level'
              : 'Practice with questions from previous GATE exams'}
          </Text>
        </View>

        {/* Subject Selection - Required - Now a Dropdown */}
        <View
          style={[
            styles.setupCard,
            { backgroundColor: theme.card, zIndex: 3000 },
          ]}
        >
          <Text style={[styles.setupTitle, { color: theme.text }]}>
            Select Subject <Text style={{ color: theme.primary }}>*</Text>
          </Text>
          <DropDownPicker
            open={subjectOpen}
            value={selectedSubject}
            items={subjectItems}
            setOpen={setSubjectOpen}
            setValue={setSelectedSubject}
            setItems={setSubjectItems}
            placeholder="Select a subject"
            searchable={true}
            searchPlaceholder="Search subjects..."
            listMode="SCROLLVIEW"
            style={[styles.dropdown, { backgroundColor: `${theme.text}05` }]}
            textStyle={{ color: theme.text }}
            dropDownContainerStyle={[
              styles.dropdownContainer,
              { backgroundColor: theme.card, borderColor: `${theme.text}30` },
            ]}
            searchContainerStyle={{ borderBottomColor: `${theme.text}20` }}
            searchTextInputStyle={{ color: theme.text }}
            onChangeValue={value => {
              setSelectedSubject(value);
              setSelectedTopic('all'); // Reset to "All Topics" when subject changes
            }}
          />
        </View>

        {/* Topic Selection - Required - Now a Dropdown */}
        <View
          style={[
            styles.setupCard,
            { backgroundColor: theme.card, zIndex: 2000 },
          ]}
        >
          <Text style={[styles.setupTitle, { color: theme.text }]}>
            Select Topic <Text style={{ color: theme.primary }}>*</Text>
          </Text>
          <DropDownPicker
            open={topicOpen}
            value={selectedTopic}
            items={topicItems}
            setOpen={setTopicOpen}
            setValue={setSelectedTopic}
            setItems={setTopicItems}
            placeholder="Select a topic"
            searchable={true}
            searchPlaceholder="Search topics..."
            listMode="SCROLLVIEW"
            disabled={!selectedSubject || selectedSubject === 'all'}
            disabledStyle={{ opacity: 0.7 }}
            style={[styles.dropdown, { backgroundColor: `${theme.text}05` }]}
            textStyle={{ color: theme.text }}
            dropDownContainerStyle={[
              styles.dropdownContainer,
              { backgroundColor: theme.card, borderColor: `${theme.text}30` },
            ]}
            searchContainerStyle={{ borderBottomColor: `${theme.text}20` }}
            searchTextInputStyle={{ color: theme.text }}
          />
          {selectedSubject === 'all' && (
            <Text
              style={[
                styles.infoText,
                { color: theme.textSecondary, marginTop: 8 },
              ]}
            >
              Topic selection is disabled when "All Subjects" is selected
            </Text>
          )}
        </View>

        {/* Question Count */}
        <View style={[styles.setupCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.setupTitle, { color: theme.text }]}>
            Number of Questions
          </Text>
          <Text style={[styles.sliderValue, { color: theme.primary }]}>
            {questionCount}
          </Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={quizType === 'pyq' ? 30 : 50}
              step={5}
              value={questionCount}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={`${theme.text}20`}
              thumbTintColor={theme.primary}
              onValueChange={value => setQuestionCount(value)}
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: theme.text }]}>5</Text>
              <Text style={[styles.sliderLabel, { color: theme.text }]}>
                {quizType === 'pyq' ? '30' : '50'}
              </Text>
            </View>
          </View>
        </View>

        {/* Difficulty Selection - only show for AI quiz type */}
        {quizType === 'ai' && (
          <View style={[styles.setupCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.setupTitle, { color: theme.text }]}>
              Difficulty Level
            </Text>
            <View
              style={[
                styles.segmentedControl,
                { backgroundColor: `${theme.text}15` },
              ]}
            >
              {['Easy', 'Medium', 'Hard', 'Auto'].map(level => {
                const isSelected = difficulty === level.toLowerCase();
                const difficultyColor =
                  level === 'Easy'
                    ? '#43A047'
                    : level === 'Medium'
                    ? '#FB8C00'
                    : level === 'Hard'
                    ? '#E53935'
                    : theme.primary;

                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.segmentedButton,
                      {
                        backgroundColor: isSelected
                          ? difficultyColor
                          : 'transparent',
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: isSelected
                          ? 'transparent'
                          : `${theme.text}30`,
                      },
                    ]}
                    onPress={() => setDifficulty(level.toLowerCase())}
                  >
                    <Text
                      style={[
                        styles.segmentedButtonText,
                        { color: isSelected ? '#FFFFFF' : theme.text },
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Explanation for Auto difficulty */}
            {difficulty === 'auto' && (
              <View style={styles.autoDifficultyInfo}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Icon
                    name="auto-fix"
                    size={16}
                    color={theme.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: theme.primary, fontWeight: '500' }}>
                    Adaptive Difficulty
                  </Text>
                </View>
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  Questions will adapt based on your performance in previous
                  quizzes. You'll get easier questions when you struggle and
                  harder ones when you excel.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Timer Settings */}
        <View style={[styles.setupCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.setupTitle, { color: theme.text }]}>
            Timer Settings
          </Text>
          <View style={styles.timerToggle}>
            <Text style={[styles.timerLabel, { color: theme.text }]}>
              Enable Timer
            </Text>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  backgroundColor: timerEnabled
                    ? theme.primary
                    : `${theme.text}30`,
                },
              ]}
              onPress={() => setTimerEnabled(prev => !prev)}
            >
              <View
                style={[
                  styles.toggleKnob,
                  {
                    backgroundColor: '#FFFFFF',
                    transform: [{ translateX: timerEnabled ? 22 : 0 }],
                  },
                ]}
              />
            </TouchableOpacity>
          </View>

          {timerEnabled && (
            <View style={styles.timeLimitContainer}>
              <Text style={[styles.timerLabel, { color: theme.text }]}>
                Time Limit (minutes)
              </Text>
              <View style={styles.timeLimitInput}>
                <TouchableOpacity
                  style={[
                    styles.timeButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setTimeLimit(prev => Math.max(5, prev - 5))}
                >
                  <Icon name="minus" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={[styles.timeValue, { color: theme.text }]}>
                  {timeLimit} min
                </Text>
                <TouchableOpacity
                  style={[
                    styles.timeButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setTimeLimit(prev => Math.min(120, prev + 5))}
                >
                  <Icon name="plus" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Required Fields Notice */}
        <Text style={[styles.requiredNotice, { color: theme.textSecondary }]}>
          * Required fields
        </Text>

        {/* Start Quiz Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            {
              backgroundColor:
                canStartQuiz() && !generatingQuiz
                  ? theme.primary
                  : `${theme.primary}50`,
              opacity: canStartQuiz() && !generatingQuiz ? 1 : 0.7,
            },
          ]}
          onPress={handleStartQuiz}
          disabled={!canStartQuiz() || generatingQuiz}
        >
          <Icon
            name={generatingQuiz ? 'loading' : 'play'}
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.startButtonText}>
            {generatingQuiz ? 'Generating Quiz...' : 'Start Quiz'}
          </Text>
          {(loading || generatingQuiz) && (
            <ActivityIndicator
              color="#FFFFFF"
              size="small"
              style={{ marginLeft: 8 }}
            />
          )}
        </TouchableOpacity>

        {!canStartQuiz() && (
          <Text style={[styles.errorText, { color: theme.error || '#E53935' }]}>
            Please select both a subject and topic to continue
          </Text>
        )}
      </ScrollView>
    );
  };

  // When rendering quiz content, use the actual quiz data from API
  const renderQuizContent = () => {
    if (!quiz || !quiz.questions || !quiz.questions.length) {
      return (
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: theme.background },
          ]}
        >
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading quiz...
          </Text>
        </View>
      );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isAnswered = selectedAnswers[currentQuestion.id] !== undefined;

    if (!currentQuestion) return null;

    return (
      <View style={styles.quizContainer}>
        {timerEnabled && (
          <View style={[styles.timerBar, { backgroundColor: theme.card }]}>
            <View style={styles.timerContent}>
              <Icon name="clock-outline" size={20} color={theme.primary} />
              <Text style={[styles.timerText, { color: theme.text }]}>
                {timeLimit > 0
                  ? `Time Remaining: ${formatTime(remainingTime)}`
                  : `Time Elapsed: ${formatTime(timeSpent)}`}
              </Text>
            </View>
            {timeLimit > 0 && (
              <View style={styles.timerProgressContainer}>
                <View
                  style={[
                    styles.timerProgress,
                    {
                      backgroundColor: theme.primary,
                      width: `${(remainingTime / (timeLimit * 60)) * 100}%`,
                      backgroundColor:
                        remainingTime < 60 ? '#FF5252' : theme.primary,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        )}

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary,
                  width: `${
                    ((currentQuestionIndex + 1) / quiz.questions.length) * 100
                  }%`,
                },
              ]}
            />
          </View>
          <View style={styles.progressIndicators}>
            {quiz.questions.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentQuestionIndex(index)}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      index <= currentQuestionIndex
                        ? theme.primary
                        : `${theme.primary}30`,
                    transform: [
                      { scale: index === currentQuestionIndex ? 1.2 : 1 },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView style={styles.questionContainer}>
          <View style={[styles.questionCard, { backgroundColor: theme.card }]}>
            <Text
              style={[styles.questionNumber, { color: theme.textSecondary }]}
            >
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </Text>

            <Text style={[styles.questionText, { color: theme.text }]}>
              {currentQuestion.text}
            </Text>

            <View style={styles.optionsContainer}>
              {(currentQuestion.options || []).map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor:
                        selectedAnswers[currentQuestion.id] === option
                          ? `${theme.primary}20`
                          : `${theme.text}05`,
                    },
                  ]}
                  onPress={() => handleSelectAnswer(currentQuestion.id, option)}
                >
                  <View
                    style={[
                      styles.optionDot,
                      {
                        borderColor: theme.primary,
                        backgroundColor:
                          selectedAnswers[currentQuestion.id] === option
                            ? theme.primary
                            : 'transparent',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: theme.text,
                        fontWeight:
                          selectedAnswers[currentQuestion.id] === option
                            ? '600'
                            : '400',
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentQuestionIndex === 0 && styles.disabledButton,
              {
                backgroundColor:
                  currentQuestionIndex === 0 ? `${theme.text}10` : theme.card,
              },
            ]}
            onPress={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <Icon
              name="chevron-left"
              size={22}
              color={
                currentQuestionIndex === 0 ? theme.textSecondary : theme.primary
              }
            />
            <Text
              style={[
                styles.navButtonText,
                {
                  color:
                    currentQuestionIndex === 0
                      ? theme.textSecondary
                      : theme.primary,
                },
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.questionCounter,
              { backgroundColor: `${theme.primary}15` },
            ]}
          >
            <Text style={{ color: theme.primary, fontWeight: 'bold' }}>
              {currentQuestionIndex + 1}/{quiz.questions.length}
            </Text>
          </View>

          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.card }]}
              onPress={handleNextQuestion}
            >
              <Text style={[styles.navButtonText, { color: theme.primary }]}>
                Next
              </Text>
              <Icon name="chevron-right" size={22} color={theme.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: isQuizComplete()
                    ? theme.primary
                    : `${theme.primary}50`,
                  opacity: isQuizComplete() ? 1 : 0.7,
                },
              ]}
              onPress={handleSubmitQuiz}
              disabled={!isQuizComplete()}
            >
              <Text style={styles.submitButtonText}>Submit Quiz</Text>
              {isQuizComplete() && (
                <Icon
                  name="check"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginLeft: 8 }}
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <CustomHeader
        title={
          setupMode
            ? quizType === 'ai'
              ? 'Create AI Quiz'
              : 'Create PYQ Test'
            : quiz?.topicName || 'Quiz'
        }
        navigation={navigation}
        onBack={() => {
          if (setupMode) {
            navigation.goBack(navigation);
          } else {
            Alert.alert(
              'Exit Quiz',
              'Are you sure you want to exit this quiz? Your progress will be lost.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Exit', onPress: () => navigation.goBack() },
              ],
            );
          }
        }}
      />

      {setupMode ? renderQuizSetup() : renderQuizContent()}

      {apiError && (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: `${theme.error}20` },
          ]}
        >
          <Text style={[styles.errorText, { color: theme.error }]}>
            {apiError}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  setupContainer: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  setupCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedButtonText: {
    fontWeight: '500',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    maxHeight: 200,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  subjectItem: {
    width: (width - 64) / 2,
    margin: 4,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectItemText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  topicItem: {
    width: (width - 64) / 2,
    margin: 4,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicItemText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  requiredNotice: {
    fontSize: 12,
    marginBottom: 12,
    marginTop: -8,
    textAlign: 'right',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  sliderContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabel: {
    fontSize: 14,
  },
  timerSetting: {
    marginTop: 8,
  },
  timerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 16,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  timeLimitContainer: {
    marginTop: 8,
  },
  timeLimitInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  timeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 100,
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  quizContainer: {
    flex: 1,
    paddingBottom: 16,
  },
  timerBar: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerProgressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 8,
  },
  timerProgress: {
    height: '100%',
    borderRadius: 2,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  progressContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 12,
  },
  progressIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    margin: 4,
  },
  questionContainer: {
    flex: 1,
    padding: 16,
    marginBottom: 12,
  },
  questionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionNumber: {
    fontSize: 14,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  optionDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionCounter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  autoDifficultyInfo: {
    marginTop: 12,
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  infoText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  dropdown: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dropdownContainer: {
    borderRadius: 8,
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    padding: 10,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    textAlign: 'center',
  },
});

export default QuizScreen;
