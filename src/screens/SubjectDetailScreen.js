import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const SubjectDetailScreen = ({ route }) => {
  // Eventually you'll get subject from route.params
  const subject = {
    id: 1,
    title: 'Operating Systems',
    progress: 67,
    description: 'Learn about process management, scheduling algorithms, memory management, and more.',
    topics: [
      { id: 1, title: 'Process Scheduling', progress: 100, completed: true },
      { id: 2, title: 'Memory Management', progress: 75, completed: false },
      { id: 3, title: 'File Systems', progress: 50, completed: false },
      { id: 4, title: 'I/O Systems', progress: 30, completed: false },
      { id: 5, title: 'Virtualization', progress: 0, completed: false },
    ],
    resources: [
      { id: 1, title: 'Process Scheduling Notes', type: 'pdf' },
      { id: 2, title: 'Memory Management Video', type: 'video' },
      { id: 3, title: 'File Systems Practice Questions', type: 'quiz' },
    ]
  };

  const { theme } = useContext(ThemeContext);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'right', 'left']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>{subject.title}</Text>
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: theme.primary }]}>{subject.progress}% Complete</Text>
            <View style={[styles.progressBar, { backgroundColor: `${theme.primary}20` }]}>
              <View 
                style={[styles.progressFill, { 
                  backgroundColor: theme.primary,
                  width: `${subject.progress}%` 
                }]} 
              />
            </View>
          </View>
          <Text style={[styles.description, { color: theme.text }]}>{subject.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Topics</Text>
          <View style={styles.topicsList}>
            {subject.topics.map(topic => (
              <TouchableOpacity 
                key={topic.id} 
                style={[styles.topicItem, { backgroundColor: theme.card }]}
              >
                <View style={styles.topicHeader}>
                  <Text style={[styles.topicTitle, { color: theme.text }]}>{topic.title}</Text>
                  {topic.completed ? (
                    <Icon name="check-circle" size={24} color={theme.primary} />
                  ) : (
                    <Text style={[styles.topicProgress, { color: theme.primary }]}>{topic.progress}%</Text>
                  )}
                </View>
                <View style={[styles.topicProgressBar, { backgroundColor: `${theme.primary}20` }]}>
                  <View 
                    style={[styles.topicProgressFill, { 
                      backgroundColor: theme.primary,
                      width: `${topic.progress}%` 
                    }]} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Study Resources</Text>
          <View style={styles.resourcesList}>
            {subject.resources.map(resource => (
              <TouchableOpacity 
                key={resource.id} 
                style={[styles.resourceItem, { backgroundColor: theme.card }]}
              >
                <Icon 
                  name={resource.type === 'pdf' ? 'file-pdf-box' : 
                       resource.type === 'video' ? 'video' : 'help-box'} 
                  size={24} 
                  color={theme.primary} 
                />
                <Text style={[styles.resourceTitle, { color: theme.text }]}>
                  {resource.title}
                </Text>
                <Icon name="chevron-right" size={20} color={theme.text} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.startButton, { backgroundColor: theme.primary }]}
          >
            <Icon name="play" size={20} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Continue Learning</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quizButton, { backgroundColor: `${theme.primary}20` }]}
          >
            <Icon name="file-document-outline" size={20} color={theme.primary} />
            <Text style={[styles.quizButtonText, { color: theme.primary }]}>Take Practice Quiz</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  topicsList: {
    marginBottom: 8,
  },
  topicItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  topicProgress: {
    fontSize: 16,
    fontWeight: 'bold',
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
  resourcesList: {
    marginBottom: 16,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resourceTitle: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  actionButtons: {
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  quizButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default SubjectDetailScreen;