import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/CustomHeader';
import api from '../services/api';

const QuizHistoryScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAttempts = async () => {
    try {
      const response = await api.quizzes.getAttempts();
      // Add safety check to ensure data is an array
      if (response.data && Array.isArray(response.data)) {
        setAttempts(response.data);
      } else {
        console.error('Unexpected response format:', response);
        setAttempts([]);
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      setError('Failed to load quiz history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttempts();
  };

  // Function to handle re-taking a quiz
  const handleRetakeQuiz = async quizId => {
    try {
      setLoading(true);
      const response = await api.quizzes.getQuiz(quizId);

      // Navigate to the quiz screen with the quiz data
      navigation.navigate('Quiz', {
        quizId: response.data.id,
        // Pass any other necessary parameters
      });
    } catch (error) {
      console.error('Error retaking quiz:', error);
      Alert.alert('Error', 'Failed to start the quiz. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Function to format date
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <CustomHeader title="Quiz History" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading quiz history...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomHeader title="Quiz History" navigation={navigation} />

      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchAttempts}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={attempts}
          keyExtractor={item => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name="clipboard-text-outline"
                size={64}
                color={`${theme.text}30`}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No quiz attempts yet
              </Text>
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('Quiz')}
              >
                <Text style={styles.startButtonText}>Take Your First Quiz</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.attemptCard, { backgroundColor: theme.card }]}
              onPress={() =>
                navigation.navigate('QuizResult', { attemptId: item.id })
              }
            >
              <View style={styles.attemptHeader}>
                <View style={styles.attemptInfo}>
                  <Text
                    style={[styles.quizTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {item.quiz.topicName || 'Quiz'}
                  </Text>
                  <Text
                    style={[styles.quizDate, { color: theme.textSecondary }]}
                  >
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.scoreContainer,
                    {
                      backgroundColor:
                        item.score >= 70
                          ? `${theme.success}20`
                          : item.score >= 40
                          ? `${theme.warning}20`
                          : `${theme.error}20`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scoreText,
                      {
                        color:
                          item.score >= 70
                            ? theme.success
                            : item.score >= 40
                            ? theme.warning
                            : theme.error,
                      },
                    ]}
                  >
                    {item.score}%
                  </Text>
                </View>
              </View>

              <View style={styles.attemptStats}>
                <View style={styles.statItem}>
                  <Icon name="check-circle" size={16} color={theme.primary} />
                  <Text
                    style={[styles.statText, { color: theme.textSecondary }]}
                  >
                    {item.correctCount}/{item.totalQuestions} correct
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="clock-outline" size={16} color={theme.primary} />
                  <Text
                    style={[styles.statText, { color: theme.textSecondary }]}
                  >
                    {Math.floor(item.timeTaken / 60)}:
                    {(item.timeTaken % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: `${theme.primary}20` },
                  ]}
                  onPress={() => handleRetakeQuiz(item.quiz.id)}
                >
                  <Icon name="reload" size={16} color={theme.primary} />
                  <Text
                    style={[styles.actionButtonText, { color: theme.primary }]}
                  >
                    Retake Quiz
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: `${theme.text}10` },
                  ]}
                  onPress={() =>
                    navigation.navigate('QuizResult', { attemptId: item.id })
                  }
                >
                  <Icon name="eye-outline" size={16} color={theme.text} />
                  <Text
                    style={[styles.actionButtonText, { color: theme.text }]}
                  >
                    View Results
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  attemptCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attemptInfo: {
    flex: 1,
    marginRight: 12,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quizDate: {
    fontSize: 12,
  },
  scoreContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    fontWeight: '700',
    fontSize: 16,
  },
  attemptStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  startButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default QuizHistoryScreen;
