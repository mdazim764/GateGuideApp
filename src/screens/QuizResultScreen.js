//GateGuideApp\src\screens\QuizResultScreen.js
import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/CustomHeader';
import api from '../services/api';

const QuizResultScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const { attemptId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [subjects, setSubjects] = useState([]); // Add subjects state

  // Add function to fetch subjects
  const fetchSubjects = async () => {
    try {
      const response = await api.academic.getSyllabusTree();
      return response.data.map(subject => ({
        id: subject.id,
        name: subject.name,
      }));
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchQuizResult = async () => {
      if (!attemptId) {
        setError('No attempt ID provided');
        setLoading(false);
        return;
      }

      try {
        // First, fetch subjects to get subject names
        const subjectsData = await fetchSubjects();
        setSubjects(subjectsData);

        // Then fetch quiz result
        const response = await api.quizzes.getAttemptDetail(attemptId);

        // Get subject name from fetched subjects or use default
        const subjectName = response.data.quiz.subjectId
          ? subjectsData.find(s => s.id === response.data.quiz.subjectId)
              ?.name || 'General'
          : 'Multiple Subjects';

        setResult({
          quizId: response.data.quiz.id,
          title: response.data.quiz.topicName || 'Quiz',
          score: response.data.score,
          correctAnswers: response.data.correctCount,
          totalQuestions: response.data.quiz.questions.length,
          timeTaken: response.data.timeTaken,
          feedback: response.data.feedback,
          subject: subjectName,
          createdAt: response.data.createdAt,
          answers: response.data.answers,
          questions: response.data.quiz.questions,
        });
      } catch (error) {
        console.error('Error fetching quiz result:', error);
        setError('Failed to load quiz result. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResult();
  }, [attemptId]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <CustomHeader title="Quiz Result" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading quiz result...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <CustomHeader title="Quiz Result" navigation={navigation} />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>
            {error || 'Failed to load quiz result'}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('HomeTab', { screen: 'home' })}
          >
            <Text style={styles.buttonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  const correctCount =
    Math.floor((result.score / 100) * result.totalQuestions) || 0;
  const incorrectCount =
    result.feedback?.incorrectCount || result.totalQuestions - correctCount;
  // Format time (e.g., 125 seconds -> "2:05")
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomHeader
        title="Quiz Result"
        navigation={navigation}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView}>
        <View style={[styles.resultCard, { backgroundColor: theme.card }]}>
          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <View
              style={[
                styles.scoreCircle,
                {
                  borderColor:
                    result.score >= 70
                      ? '#4CAF50'
                      : result.score >= 40
                      ? '#FF9800'
                      : '#F44336',
                },
              ]}
            >
              <Text
                style={[
                  styles.scoreText,
                  {
                    color:
                      result.score >= 70
                        ? '#4CAF50'
                        : result.score >= 40
                        ? '#FF9800'
                        : '#F44336',
                  },
                ]}
              >
                {result.score}%
              </Text>
            </View>
            <View style={styles.scoreDetails}>
              <Text style={[styles.quizTitle, { color: theme.text }]}>
                {result.title}
              </Text>
              <Text
                style={[styles.quizSubtitle, { color: theme.textSecondary }]}
              >
                {result.subject}
              </Text>
              <Text style={[styles.quizMeta, { color: theme.textSecondary }]}>
                {new Date(result.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Score Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Icon name="check" size={20} color={theme.primary} />
              <Text style={[styles.statText, { color: theme.text }]}>
                {correctCount} / {result.totalQuestions} correct
              </Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="clock-outline" size={20} color={theme.primary} />
              <Text style={[styles.statText, { color: theme.text }]}>
                Time: {formatTime(result.timeTaken)}
              </Text>
            </View>
          </View>

          {/* AI Mentor Analysis */}
          <View style={styles.analysisContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              AI Mentor Analysis
            </Text>
            <Text style={[styles.analysisText, { color: theme.text }]}>
              {result.feedback?.mentorAnalysis || 'No analysis available.'}
            </Text>
          </View>

          {/* Question Review */}
          <Text
            style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}
          >
            Question Review
          </Text>

          {result.feedback?.questionByQuestionReview?.map((review, index) => (
            <View
              key={index}
              style={[
                styles.reviewItem,
                {
                  backgroundColor: review.isCorrect
                    ? `${theme.success}10`
                    : `${theme.error}10`,
                },
              ]}
            >
              <View style={styles.reviewHeader}>
                <Text style={[styles.reviewTitle, { color: theme.text }]}>
                  Question {index + 1}
                </Text>
                <Icon
                  name={review.isCorrect ? 'check-circle' : 'close-circle'}
                  size={24}
                  color={review.isCorrect ? theme.success : theme.error}
                />
              </View>

              <Text style={[styles.reviewQuestion, { color: theme.text }]}>
                {result.questions[index]?.text || 'Question text not available'}
              </Text>

              <View style={styles.answerContainer}>
                <View style={styles.answerRow}>
                  <Text
                    style={[styles.answerLabel, { color: theme.textSecondary }]}
                  >
                    Your answer:
                  </Text>
                  <Text
                    style={[
                      styles.answerText,
                      {
                        color: review.isCorrect ? theme.success : theme.error,
                        fontWeight: '500',
                      },
                    ]}
                  >
                    {review.yourAnswer}
                  </Text>
                </View>

                {!review.isCorrect && (
                  <View style={styles.answerRow}>
                    <Text
                      style={[
                        styles.answerLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Correct answer:
                    </Text>
                    <Text
                      style={[
                        styles.answerText,
                        { color: theme.success, fontWeight: '500' },
                      ]}
                    >
                      {review.correctAnswer}
                    </Text>
                  </View>
                )}
              </View>

              {review.explanation && (
                <View style={styles.explanationContainer}>
                  <Text
                    style={[styles.explanationTitle, { color: theme.text }]}
                  >
                    Explanation:
                  </Text>
                  <Text style={[styles.explanationText, { color: theme.text }]}>
                    {review.explanation}
                  </Text>
                </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  resultCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scoreDetails: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quizSubtitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  quizMeta: {
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  analysisContainer: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 15,
    lineHeight: 22,
  },
  reviewItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewQuestion: {
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 21,
  },
  answerContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  answerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  answerLabel: {
    fontSize: 14,
    marginRight: 8,
    width: 100,
  },
  answerText: {
    fontSize: 14,
    flex: 1,
  },
  explanationContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 12,
    borderRadius: 8,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuizResultScreen;
