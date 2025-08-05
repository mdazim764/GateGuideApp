import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  SafeAreaView
} from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/CustomHeader';
import Slider from '@react-native-community/slider';

const QuizScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const initialParams = route.params || {};
  
  // Quiz setup state
  const [setupMode, setSetupMode] = useState(true);
  const [quizType, setQuizType] = useState(initialParams.quizType || 'ai');
  const [selectedSubject, setSelectedSubject] = useState(initialParams.subjectId || null);
  const [selectedTopic, setSelectedTopic] = useState(initialParams.topicId || null);
  const [questionCount, setQuestionCount] = useState(initialParams.questionCount || 10);
  const [difficulty, setDifficulty] = useState(initialParams.difficulty || 'medium');
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timeLimit, setTimeLimit] = useState(initialParams.timeLimit || 0); // 0 means no limit
  
  // Quiz progress state
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [remainingTime, setRemainingTime] = useState(timeLimit * 60); // in seconds
  
  const timerRef = useRef(null);
  
  // Subject and topic data
  const subjects = [
    { id: 'os', name: 'Operating Systems' },
    { id: 'ds', name: 'Data Structures' },
    { id: 'algo', name: 'Algorithms' },
    { id: 'dbms', name: 'Database Management' },
    { id: 'cn', name: 'Computer Networks' },
    { id: 'coa', name: 'Computer Organization & Architecture' },
    { id: 'toc', name: 'Theory of Computation' },
    { id: 'cg', name: 'Computer Graphics' },
    { id: 'se', name: 'Software Engineering' },
  ];
  
  const topics = {
    'os': [
      { id: 'os_proc', name: 'Process Management' },
      { id: 'os_sched', name: 'CPU Scheduling' },
      { id: 'os_mem', name: 'Memory Management' },
      { id: 'os_file', name: 'File Systems' },
      { id: 'os_io', name: 'I/O Systems' },
    ],
    'ds': [
      { id: 'ds_arrays', name: 'Arrays & Strings' },
      { id: 'ds_linkedlist', name: 'Linked Lists' },
      { id: 'ds_stack', name: 'Stacks & Queues' },
      { id: 'ds_tree', name: 'Trees' },
      { id: 'ds_graph', name: 'Graphs' },
      { id: 'ds_hash', name: 'Hash Tables' },
    ],
    // Add topics for other subjects as needed
  };
  
  // Timer setup
  useEffect(() => {
    if (!setupMode && quiz && timerEnabled) {
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
        
        if (timeLimit > 0) {
          setRemainingTime(prev => {
            if (prev <= 1) {
              // Time's up - auto submit the quiz
              clearInterval(timerRef.current);
              handleSubmitQuiz();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [setupMode, quiz, timerEnabled]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleStartQuiz = async () => {
    // Validate selections
    if (!selectedSubject) {
      // Show error - subject required
      return;
    }
    
    setLoading(true);
    
    try {
      // Here you would connect to your backend API
      // For now, we'll simulate with mock data
      setTimeout(() => {
        const mockQuiz = generateMockQuiz();
        setQuiz(mockQuiz);
        setQuizStartTime(Date.now());
        setSetupMode(false);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setLoading(false);
      // Show error message
    }
  };
  
  const generateMockQuiz = () => {
    // This would be replaced by your API call to the backend
    const questions = [];
    
    for (let i = 0; i < questionCount; i++) {
      questions.push({
        id: `q${i}`,
        text: `Sample question ${i+1} about ${selectedTopic ? topics[selectedSubject].find(t => t.id === selectedTopic).name : subjects.find(s => s.id === selectedSubject).name}?`,
        options: [
          `Option A for question ${i+1}`,
          `Option B for question ${i+1}`,
          `Option C for question ${i+1}`,
          `Option D for question ${i+1}`,
        ],
        correctAnswer: `Option ${String.fromCharCode(65 + Math.floor(Math.random() * 4))} for question ${i+1}`
      });
    }
    
    return {
      id: 'quiz1',
      title: `${quizType === 'ai' ? 'AI-Generated' : 'PYQ'} Quiz on ${selectedTopic ? topics[selectedSubject].find(t => t.id === selectedTopic).name : subjects.find(s => s.id === selectedSubject).name}`,
      subject: subjects.find(s => s.id === selectedSubject).name,
      topic: selectedTopic ? topics[selectedSubject].find(t => t.id === selectedTopic).name : 'All Topics',
      difficulty,
      questions
    };
  };
  
  const handleSelectAnswer = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
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
  
  const handleSubmitQuiz = () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Calculate results
    let correctCount = 0;
    const reviewData = quiz.questions.map(question => {
      const isCorrect = selectedAnswers[question.id] === question.correctAnswer;
      if (isCorrect) correctCount++;
      
      return {
        questionId: question.id,
        question: question.text,
        correctAnswer: question.correctAnswer,
        yourAnswer: selectedAnswers[question.id] || 'Not answered',
        isCorrect
      };
    });
    
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    
    // Navigate to results screen
    navigation.replace('QuizResult', {
      result: {
        quizId: quiz.id,
        title: quiz.title,
        subject: quiz.subject,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        score,
        correctAnswers: correctCount,
        totalQuestions: quiz.questions.length,
        timeTaken: timeSpent,
        feedback: {
          mentorAnalysis: generateMockAnalysis(score, quiz.subject, quiz.topic),
          questionByQuestionReview: reviewData
        }
      }
    });
  };
  
  const generateMockAnalysis = (score, subject, topic) => {
    if (score >= 80) {
      return `Excellent work! You've shown a strong understanding of ${subject} ${topic !== 'All Topics' ? `especially in ${topic}` : ''}. Keep up the great work!`;
    } else if (score >= 60) {
      return `Good job! You have a solid grasp of ${subject} ${topic !== 'All Topics' ? `specifically ${topic}` : ''}. Some concepts could use more review.`;
    } else {
      return `You've made a good start with ${subject} ${topic !== 'All Topics' ? `particularly ${topic}` : ''}, but this area needs more attention. Consider reviewing the core concepts again.`;
    }
  };
  
  const renderQuizSetup = () => {
    return (
      <ScrollView style={styles.setupContainer}>
        <View style={[styles.setupCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.setupTitle, { color: theme.text }]}>Quiz Type</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentedButton,
                quizType === 'ai' && { backgroundColor: theme.primary },
              ]}
              onPress={() => setQuizType('ai')}
            >
              <Text style={[
                styles.segmentedButtonText,
                { color: quizType === 'ai' ? '#fff' : theme.text }
              ]}>
                AI-Generated
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentedButton,
                quizType === 'pyq' && { backgroundColor: theme.primary },
              ]}
              onPress={() => setQuizType('pyq')}
            >
              <Text style={[
                styles.segmentedButtonText,
                { color: quizType === 'pyq' ? '#fff' : theme.text }
              ]}>
                Previous Year Questions
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.setupTitle, { color: theme.text, marginTop: 20 }]}>Subject</Text>
          <View style={styles.subjectGrid}>
            {subjects.map(subject => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectItem,
                  { backgroundColor: selectedSubject === subject.id ? `${theme.primary}20` : `${theme.text}10` }
                ]}
                onPress={() => {
                  setSelectedSubject(subject.id);
                  setSelectedTopic(null); // Reset topic when subject changes
                }}
              >
                <Text style={[
                  styles.subjectItemText,
                  { color: selectedSubject === subject.id ? theme.primary : theme.text }
                ]}>
                  {subject.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {selectedSubject && topics[selectedSubject] && (
            <>
              <Text style={[styles.setupTitle, { color: theme.text, marginTop: 20 }]}>Topic (Optional)</Text>
              <View style={styles.topicGrid}>
                <TouchableOpacity
                  style={[
                    styles.topicItem,
                    { backgroundColor: selectedTopic === null ? `${theme.primary}20` : `${theme.text}10` }
                  ]}
                  onPress={() => setSelectedTopic(null)}
                >
                  <Text style={[
                    styles.topicItemText,
                    { color: selectedTopic === null ? theme.primary : theme.text }
                  ]}>
                    All Topics
                  </Text>
                </TouchableOpacity>
                
                {topics[selectedSubject].map(topic => (
                  <TouchableOpacity
                    key={topic.id}
                    style={[
                      styles.topicItem,
                      { backgroundColor: selectedTopic === topic.id ? `${theme.primary}20` : `${theme.text}10` }
                    ]}
                    onPress={() => setSelectedTopic(topic.id)}
                  >
                    <Text style={[
                      styles.topicItemText,
                      { color: selectedTopic === topic.id ? theme.primary : theme.text }
                    ]}>
                      {topic.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          
          <Text style={[styles.setupTitle, { color: theme.text, marginTop: 20 }]}>Number of Questions</Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderValue, { color: theme.text }]}>{questionCount}</Text>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={30}
              step={5}
              value={questionCount}
              onValueChange={setQuestionCount}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={`${theme.text}30`}
              thumbTintColor={theme.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>5</Text>
              <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>30</Text>
            </View>
          </View>
          
          <Text style={[styles.setupTitle, { color: theme.text, marginTop: 20 }]}>Difficulty</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentedButton,
                difficulty === 'easy' && { backgroundColor: theme.primary },
              ]}
              onPress={() => setDifficulty('easy')}
            >
              <Text style={[
                styles.segmentedButtonText,
                { color: difficulty === 'easy' ? '#fff' : theme.text }
              ]}>
                Easy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentedButton,
                difficulty === 'medium' && { backgroundColor: theme.primary },
              ]}
              onPress={() => setDifficulty('medium')}
            >
              <Text style={[
                styles.segmentedButtonText,
                { color: difficulty === 'medium' ? '#fff' : theme.text }
              ]}>
                Medium
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentedButton,
                difficulty === 'hard' && { backgroundColor: theme.primary },
              ]}
              onPress={() => setDifficulty('hard')}
            >
              <Text style={[
                styles.segmentedButtonText,
                { color: difficulty === 'hard' ? '#fff' : theme.text }
              ]}>
                Hard
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.setupTitle, { color: theme.text, marginTop: 20 }]}>Timer</Text>
          <View style={styles.timerSetting}>
            <View style={styles.timerToggle}>
              <Text style={[styles.timerLabel, { color: theme.text }]}>Enable Timer</Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  { backgroundColor: timerEnabled ? theme.primary : `${theme.text}30` }
                ]}
                onPress={() => setTimerEnabled(!timerEnabled)}
              >
                <View style={[
                  styles.toggleKnob,
                  { 
                    backgroundColor: '#fff',
                    transform: [{ translateX: timerEnabled ? 22 : 2 }]
                  }
                ]} />
              </TouchableOpacity>
            </View>
            
            {timerEnabled && (
              <View style={styles.timeLimitContainer}>
                <Text style={[styles.timerLabel, { color: theme.text }]}>Time Limit (minutes)</Text>
                <View style={styles.timeLimitInput}>
                  <TouchableOpacity
                    style={[styles.timeButton, { backgroundColor: `${theme.text}10` }]}
                    onPress={() => setTimeLimit(prev => Math.max(0, prev - 5))}
                  >
                    <Icon name="minus" size={20} color={theme.text} />
                  </TouchableOpacity>
                  
                  <Text style={[styles.timeValue, { color: theme.text }]}>
                    {timeLimit === 0 ? 'No Limit' : `${timeLimit} min`}
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.timeButton, { backgroundColor: `${theme.text}10` }]}
                    onPress={() => setTimeLimit(prev => prev + 5)}
                  >
                    <Icon name="plus" size={20} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: theme.primary }]}
            onPress={handleStartQuiz}
            disabled={!selectedSubject || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="play" size={20} color="#fff" />
                <Text style={styles.startButtonText}>Start Quiz</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };
  
  const renderQuizContent = () => {
    if (!quiz) return null;
    
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isAnswered = selectedAnswers[currentQuestion.id] !== undefined;
    
    return (
      <View style={styles.quizContainer}>
        {timerEnabled && (
          <View style={[styles.timerBar, { backgroundColor: theme.card }]}>
            <Icon name="clock-outline" size={20} color={theme.primary} />
            <Text style={[styles.timerText, { color: theme.text }]}>
              {timeLimit > 0 
                ? `Time Remaining: ${formatTime(remainingTime)}`
                : `Time Elapsed: ${formatTime(timeSpent)}`}
            </Text>
          </View>
        )}
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                backgroundColor: theme.primary,
                width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` 
              }
            ]} 
          />
        </View>
        
        <ScrollView style={styles.questionContainer}>
          <Text style={[styles.questionNumber, { color: theme.textSecondary }]}>
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </Text>
          
          <Text style={[styles.questionText, { color: theme.text }]}>
            {currentQuestion.text}
          </Text>
          
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionItem,
                  { 
                    backgroundColor: selectedAnswers[currentQuestion.id] === option 
                      ? `${theme.primary}20` 
                      : theme.card 
                  }
                ]}
                onPress={() => handleSelectAnswer(currentQuestion.id, option)}
              >
                <View style={[
                  styles.optionDot,
                  { 
                    borderColor: theme.primary,
                    backgroundColor: selectedAnswers[currentQuestion.id] === option 
                      ? theme.primary 
                      : 'transparent' 
                  }
                ]} />
                <Text style={[
                  styles.optionText, 
                  { color: theme.text }
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentQuestionIndex === 0 && styles.disabledButton,
              { backgroundColor: currentQuestionIndex === 0 ? `${theme.text}20` : theme.card }
            ]}
            onPress={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <Icon name="chevron-left" size={24} color={currentQuestionIndex === 0 ? theme.textSecondary : theme.primary} />
            <Text style={[
              styles.navButtonText,
              { color: currentQuestionIndex === 0 ? theme.textSecondary : theme.primary }
            ]}>
              Previous
            </Text>
          </TouchableOpacity>
          
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.card }]}
              onPress={handleNextQuestion}
            >
              <Text style={[styles.navButtonText, { color: theme.primary }]}>
                Next
              </Text>
              <Icon name="chevron-right" size={24} color={theme.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.submitButton, 
                { 
                  backgroundColor: isQuizComplete() ? theme.primary : `${theme.primary}50`,
                  opacity: isQuizComplete() ? 1 : 0.7
                }
              ]}
              onPress={handleSubmitQuiz}
              disabled={!isQuizComplete()}
            >
              <Text style={styles.submitButtonText}>Submit Quiz</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomHeader
        title={setupMode ? "Create Quiz" : quiz?.title || "Quiz"}
        onBack={() => {
          if (!setupMode) {
            // Show confirmation dialog before exiting quiz
            if (confirm("Are you sure you want to exit the quiz? All progress will be lost.")) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
              }
              navigation.goBack();
            }
          } else {
            navigation.goBack();
          }
        }}
      />
      
      {setupMode ? renderQuizSetup() : renderQuizContent()}
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
  setupCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentedButtonText: {
    fontWeight: '500',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  subjectItem: {
    width: '48%',
    margin: '1%',
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
    width: '48%',
    margin: '1%',
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
    borderRadius: 3,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  questionContainer: {
    flex: 1,
    padding: 16,
    marginBottom: 12,
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
    paddingHorizontal: 16,
    marginTop: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
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
});

export default QuizScreen;