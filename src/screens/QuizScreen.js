import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const QuizScreen = () => {
  const { theme } = useContext(ThemeContext);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const questions = [
    {
      id: 1,
      question: 'Which of the following scheduling algorithms is non-preemptive?',
      options: [
        { id: 'A', text: 'Round Robin' },
        { id: 'B', text: 'First Come First Served' },
        { id: 'C', text: 'Shortest Remaining Time First' },
        { id: 'D', text: 'Priority Scheduling (Preemptive version)' }
      ],
      correctAnswer: 'B',
      explanation: 'First Come First Served (FCFS) is a non-preemptive scheduling algorithm where the process that arrives first gets executed first completely before any other process.'
    },
    {
      id: 2,
      question: 'What is the worst-case time complexity of quicksort?',
      options: [
        { id: 'A', text: 'O(n)' },
        { id: 'B', text: 'O(n log n)' },
        { id: 'C', text: 'O(n²)' },
        { id: 'D', text: 'O(n log² n)' }
      ],
      correctAnswer: 'C',
      explanation: 'The worst-case time complexity of quicksort is O(n²), which occurs when the pivot is consistently chosen as the smallest or largest element, resulting in extremely unbalanced partitions.'
    },
    // More questions...
  ];

  const currentQuestion = questions[currentQuestionIndex];
  
  const handleSelectOption = (optionId) => {
    setSelectedOption(optionId);
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(null);
      setShowExplanation(false);
    }
  };
  
  const handleCheckAnswer = () => {
    setShowExplanation(true);
  };

  const getOptionStyle = (optionId) => {
    if (!showExplanation) {
      return {
        backgroundColor: selectedOption === optionId ? `${theme.primary}20` : theme.card,
        borderColor: selectedOption === optionId ? theme.primary : 'transparent',
      };
    } else {
      if (optionId === currentQuestion.correctAnswer) {
        return {
          backgroundColor: '#E7F8EF',
          borderColor: '#2ECC71',
        };
      } else if (optionId === selectedOption) {
        return {
          backgroundColor: '#FDEDEC',
          borderColor: '#E74C3C',
        };
      } else {
        return {
          backgroundColor: theme.card,
          borderColor: 'transparent',
        };
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'right', 'left']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Practice Quiz</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>Operating Systems</Text>
      </View>
      
      <View style={[styles.progressContainer, { backgroundColor: `${theme.primary}10` }]}>
        <View style={styles.progressTextContainer}>
          <Text style={[styles.progressText, { color: theme.text }]}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <Text style={[styles.timeText, { color: theme.primary }]}>
            Time: 15:30
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: `${theme.primary}20` }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: theme.primary,
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` 
              }
            ]} 
          />
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionContainer}>
          <Text style={[styles.questionText, { color: theme.text }]}>
            {currentQuestion.question}
          </Text>
        </View>
        
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionItem,
                getOptionStyle(option.id),
              ]}
              onPress={() => !showExplanation && handleSelectOption(option.id)}
              disabled={showExplanation}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.optionBadge, 
                  { 
                    backgroundColor: showExplanation && option.id === currentQuestion.correctAnswer 
                      ? '#2ECC71' 
                      : showExplanation && option.id === selectedOption && option.id !== currentQuestion.correctAnswer
                        ? '#E74C3C'
                        : selectedOption === option.id 
                          ? theme.primary 
                          : '#E0E0E0' 
                  }
                ]}>
                  <Text style={[
                    styles.optionBadgeText, 
                    { 
                      color: (showExplanation && (option.id === currentQuestion.correctAnswer || 
                              (option.id === selectedOption && option.id !== currentQuestion.correctAnswer))) || 
                              selectedOption === option.id 
                        ? '#FFFFFF' 
                        : '#555555' 
                    }
                  ]}>
                    {option.id}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: theme.text }]}>
                  {option.text}
                </Text>
              </View>
              
              {showExplanation && option.id === currentQuestion.correctAnswer && (
                <Icon name="check-circle" size={24} color="#2ECC71" />
              )}
              
              {showExplanation && option.id === selectedOption && option.id !== currentQuestion.correctAnswer && (
                <Icon name="close-circle" size={24} color="#E74C3C" />
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {showExplanation && (
          <View style={[styles.explanationContainer, { backgroundColor: `${theme.primary}10` }]}>
            <Text style={[styles.explanationTitle, { color: theme.primary }]}>Explanation</Text>
            <Text style={[styles.explanationText, { color: theme.text }]}>
              {currentQuestion.explanation}
            </Text>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.navigationButton, 
            styles.prevButton,
            { backgroundColor: theme.card },
            currentQuestionIndex === 0 && styles.disabledButton
          ]}
          onPress={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Icon name="chevron-left" size={24} color={currentQuestionIndex === 0 ? '#999' : theme.primary} />
          <Text style={[
            styles.navigationButtonText, 
            { color: currentQuestionIndex === 0 ? '#999' : theme.primary }
          ]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        {!showExplanation ? (
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              { backgroundColor: theme.primary },
              !selectedOption && styles.disabledButton
            ]}
            onPress={handleCheckAnswer}
            disabled={!selectedOption}
          >
            <Text style={styles.actionButtonText}>Check Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleNextQuestion}
          >
            <Text style={styles.actionButtonText}>
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  progressContainer: {
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
  questionContainer: {
    padding: 16,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 26,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  optionItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  explanationContainer: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  prevButton: {
    marginRight: 8,
    justifyContent: 'center',
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default QuizScreen;