//GateGuideApp\src\screens\QuizResultScreen.js
import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/CustomHeader';

const QuizResultScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  // In a real implementation, you'd get this from route.params.result
  // For now, we'll use mock data
  const result = {
    score: 75,
    correctAnswers: 15,
    totalQuestions: 20,
    timeTaken: '12:30',
    feedback: {
      mentorAnalysis:
        "Great effort, Azim! You've shown excellent understanding of process scheduling concepts. Focus more on memory management algorithms where you missed a few questions.",
      questionByQuestionReview: [
        {
          questionId: '1',
          question:
            'Which of the following scheduling algorithms is most suitable for time-sharing systems?',
          correctAnswer: 'Round Robin',
          yourAnswer: 'Round Robin',
          isCorrect: true,
          explanation:
            'Round Robin is designed specifically for time-sharing systems as it allocates a small unit of time (called a quantum) to each process in a cyclic manner.',
        },
        {
          questionId: '2',
          question: 'What is thrashing in memory management?',
          correctAnswer:
            'A state where the system spends more time in page swapping than execution',
          yourAnswer: 'Excessive page faults causing system slowdown',
          isCorrect: false,
          explanation:
            'Thrashing occurs when a system spends more time swapping pages between main memory and disk than executing actual processes, drastically reducing CPU utilization.',
        },
      ],
    },
  };

  // Calculate percentage for progress circle
  const scorePercentage = (result.correctAnswers / result.totalQuestions) * 100;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: 16,
    },
    scoreContainer: {
      alignItems: 'center',
      marginVertical: 24,
    },
    scoreCircle: {
      width: 150,
      height: 150,
      borderRadius: 75,
      borderWidth: 10,
      borderColor:
        scorePercentage >= 70
          ? '#4CAF50'
          : scorePercentage >= 40
          ? '#FF9800'
          : '#F44336',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scoreText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text,
    },
    scoreSubtext: {
      fontSize: 16,
      color: theme.text,
      marginTop: 4,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: 16,
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    statLabel: {
      fontSize: 14,
      color: theme.text,
      opacity: 0.7,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginTop: 24,
      marginBottom: 12,
    },
    feedbackCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    feedbackText: {
      fontSize: 16,
      color: theme.text,
      lineHeight: 24,
    },
    reviewCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    question: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 8,
    },
    answerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    answerLabel: {
      fontSize: 14,
      color: theme.text,
      opacity: 0.7,
      width: 110,
    },
    answerText: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
    },
    correctIcon: {
      width: 20,
      alignItems: 'center',
    },
    explanation: {
      fontSize: 14,
      color: theme.text,
      backgroundColor: `${theme.text}10`,
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    buttonContainer: {
      marginTop: 24,
      marginBottom: 40,
    },
    button: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    buttonSecondary: {
      backgroundColor: `${theme.primary}20`,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    buttonTextSecondary: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Quiz Results" onBack={() => navigation.goBack()} />
      <ScrollView>
        <View style={styles.content}>
          {/* Score Circle */}
          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreText}>{result.score}%</Text>
              <Text style={styles.scoreSubtext}>
                {scorePercentage >= 70
                  ? 'Excellent!'
                  : scorePercentage >= 40
                  ? 'Good Job!'
                  : 'Keep Practicing!'}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {result.correctAnswers}/{result.totalQuestions}
              </Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{result.timeTaken}</Text>
              <Text style={styles.statLabel}>Time Taken</Text>
            </View>
          </View>

          {/* AI Mentor Feedback */}
          <Text style={styles.sectionTitle}>AI Mentor Feedback</Text>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackText}>
              {result.feedback.mentorAnalysis}
            </Text>
          </View>

          {/* Question by Question Review */}
          <Text style={styles.sectionTitle}>Question Review</Text>
          {result.feedback.questionByQuestionReview.map((item, index) => (
            <View key={item.questionId} style={styles.reviewCard}>
              <Text style={styles.question}>
                {index + 1}. {item.question}
              </Text>

              <View style={styles.answerRow}>
                <Text style={styles.answerLabel}>Correct Answer:</Text>
                <Text style={styles.answerText}>{item.correctAnswer}</Text>
                <View style={styles.correctIcon}>
                  <Icon name="check" size={18} color="#4CAF50" />
                </View>
              </View>

              <View style={styles.answerRow}>
                <Text style={styles.answerLabel}>Your Answer:</Text>
                <Text style={styles.answerText}>{item.yourAnswer}</Text>
                <View style={styles.correctIcon}>
                  {item.isCorrect ? (
                    <Icon name="check" size={18} color="#4CAF50" />
                  ) : (
                    <Icon name="close" size={18} color="#F44336" />
                  )}
                </View>
              </View>

              {!item.isCorrect && (
                <Text style={styles.explanation}>
                  <Text style={{ fontWeight: 'bold' }}>Explanation: </Text>
                  {item.explanation}
                </Text>
              )}
            </View>
          ))}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Quiz')}
            >
              <Text style={styles.buttonText}>Try Another Quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.buttonTextSecondary}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default QuizResultScreen;
