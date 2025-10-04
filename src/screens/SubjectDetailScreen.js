import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/CustomHeader';
import api from '../services/api';
import { useData } from '../context/DataContext';

const SubjectDetailScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const { subject } = route.params;
  const { refreshSyllabusProgress } = useData(); // Add this import

  // State to track expanded topics
  const [expandedTopics, setExpandedTopics] = useState({});
  const [loadingSubtopics, setLoadingSubtopics] = useState({});

  // State to track subtopic progress
  const [completedSubtopics, setCompletedSubtopics] = useState(() => {
    // Create a set of all completed subtopic IDs by scanning through the data
    const completedSet = new Set();

    // Check each unit, topic, and subtopic to find completed ones
    if (subject && subject.units) {
      subject.units.forEach(unit => {
        if (unit.topics) {
          unit.topics.forEach(topic => {
            if (topic.subtopics) {
              topic.subtopics.forEach(subtopic => {
                // If the subtopic has status 'completed' or a progress of 100, add to set
                if (
                  subtopic.status === 'completed' ||
                  subtopic.progress === 100
                ) {
                  completedSet.add(subtopic.id);
                }
              });
            }
          });
        }
      });
    }

    return completedSet;
  });

  // Toggle topic expansion
  const toggleExpand = topicId => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  // Update the toggleSubtopic function
  const toggleSubtopic = async subtopicId => {
    setLoadingSubtopics(prev => ({
      ...prev,
      [subtopicId]: true,
    }));

    try {
      // Check if the subtopic is currently completed
      const isCurrentlyCompleted = completedSubtopics.has(subtopicId);
      const newStatus = isCurrentlyCompleted ? 'not_started' : 'completed';

      console.log(`Toggling subtopic ${subtopicId} to ${newStatus}`);

      // Call API to update progress
      await api.progress.markSubtopicCompleted(subtopicId, newStatus);

      // Update local state immediately for better UX
      setCompletedSubtopics(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyCompleted) {
          newSet.delete(subtopicId);
        } else {
          newSet.add(subtopicId);
        }
        return newSet;
      });

      // Refresh syllabus data in DataContext after a short delay 
      // to ensure server has processed the update
      setTimeout(async () => {
        try {
          // Refresh global syllabus data
          await refreshSyllabusProgress();
          
          // Also refresh local subject data
          refreshSubjectData();
          
          // Notify parent screens if callback provided
          if (route.params && route.params.onSubjectUpdate) {
            const response = await api.academic.getSubjectDetail(subject.id);
            if (response.data) {
              route.params.onSubjectUpdate(response.data);
            }
          }
        } catch (err) {
          console.error('Error refreshing data after subtopic update:', err);
        }
      }, 300);
    } catch (error) {
      console.error('Error updating subtopic progress:', error);
      Alert.alert('Error', 'Failed to update progress. Please try again.');
    } finally {
      setLoadingSubtopics(prev => ({
        ...prev,
        [subtopicId]: false,
      }));
    }
  };

  // Refresh subject data from the server
  const refreshSubjectData = async () => {
    try {
      // Get the latest subject data with progress information
      const response = await api.academic.getSubjectDetail(subject.id);
      if (response.data) {
        // Update local set of completed subtopics
        const completedSet = new Set();

        // Process all units, topics, and subtopics
        if (response.data.units) {
          response.data.units.forEach(unit => {
            if (unit.topics) {
              unit.topics.forEach(topic => {
                if (topic.subtopics) {
                  topic.subtopics.forEach(subtopic => {
                    // Add to set if completed - checking all possible ways it might be marked
                    if (
                      subtopic.status === 'completed' ||
                      subtopic.progress === 'completed' ||
                      subtopic.progress === 100
                    ) {
                      completedSet.add(subtopic.id);
                    }
                  });
                }
              });
            }
          });
        }

        // Update the state with fresh data
        setCompletedSubtopics(completedSet);
      }
    } catch (error) {
      console.error('Error refreshing subject data:', error);
    }
  };

  // Generate section data from the subject's units and topics
  const sectionData = subject.units.map(unit => ({
    title: unit.name,
    id: unit.id,
    progress: unit.progress || 0,
    data: unit.topics || [],
  }));

  const renderSectionHeader = ({ section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
      <View style={[styles.unitCard, { backgroundColor: theme.card }]}>
        <View style={styles.unitTitleContainer}>
          <Icon name="cube-outline" size={24} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {section.title}
          </Text>
        </View>

        <View
          style={[styles.unitStatsContainer, { borderTopColor: theme.border }]}
        >
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: theme.primary,
                  width: `${section.progress}%`,
                },
              ]}
            />
          </View>

          <View style={styles.unitStatsRow}>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {section.progress}% Complete
            </Text>

            <Text style={[styles.topicCountText, { color: theme.primary }]}>
              {section.data.length} Topics
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    const isExpanded = !!expandedTopics[item.id];

    return (
      <View style={styles.topicContainer}>
        <TouchableOpacity
          style={[styles.topicItem, { backgroundColor: theme.card }]}
          activeOpacity={0.7}
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.topicContent}>
            <Text style={[styles.topicTitle, { color: theme.text }]}>
              {item.name}
            </Text>

            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: theme.primary,
                    width: `${item.progress || 0}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.topicDetailRow}>
              <Text
                style={[styles.progressText, { color: theme.textSecondary }]}
              >
                {item.progress || 0}% Complete
              </Text>

              <Text style={[styles.subtopicCount, { color: theme.primary }]}>
                {item.subtopics?.length || 0} subtopics
              </Text>
            </View>
          </View>

          <Icon
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={22}
            color={theme.primary}
            style={styles.chevron}
          />
        </TouchableOpacity>

        {/* Subtopics section (expanded) */}
        {isExpanded && item.subtopics && item.subtopics.length > 0 && (
          <View style={styles.subtopicsContainer}>
            {item.subtopics.map(subtopic => {
              const isCompleted =
                completedSubtopics.has(subtopic.id) ||
                subtopic.status === 'completed' ||
                subtopic.progress === 'completed' ||
                subtopic.progress === 100;
              const isLoading = loadingSubtopics[subtopic.id];

              return (
                <TouchableOpacity
                  key={subtopic.id}
                  style={[
                    styles.subtopicItem,
                    {
                      backgroundColor: theme.background,
                      borderLeftColor: isCompleted
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                  onPress={() => toggleSubtopic(subtopic.id)}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.subtopicText,
                      {
                        color: theme.text,
                        textDecorationLine: isCompleted
                          ? 'line-through'
                          : 'none',
                        opacity: isCompleted ? 0.7 : 1,
                      },
                    ]}
                  >
                    {subtopic.name}
                  </Text>

                  {isLoading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <MaterialIcon
                      name={
                        isCompleted
                          ? 'checkbox-marked-circle'
                          : 'checkbox-blank-circle-outline'
                      }
                      size={22}
                      color={isCompleted ? theme.primary : theme.textSecondary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Generate an overall progress summary for the subject
  const topicCount = sectionData.reduce(
    (count, unit) => count + unit.data.length,
    0,
  );
  const averageProgress =
    sectionData.reduce((sum, unit) => sum + unit.progress, 0) /
    (sectionData.length || 1);

  React.useEffect(() => {
    // Initial data load
    refreshSubjectData();

    // Set up a listener for when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('SubjectDetailScreen focused, refreshing data...');
      refreshSubjectData();
    });

    // Clean up the listener when component unmounts
    return unsubscribe;
  }, [navigation, subject.id]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomHeader
        title={subject.name}
        navigation={navigation}
        route={route}
      />

      {/* Overall progress card */}
      <View style={[styles.overallCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.overallTitle, { color: theme.text }]}>
          Overall Progress
        </Text>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: theme.primary,
                width: `${Math.round(averageProgress)}%`,
              },
            ]}
          />
        </View>
        <View style={styles.overallStats}>
          <Text style={[styles.overallText, { color: theme.textSecondary }]}>
            {Math.round(averageProgress)}% Complete
          </Text>
          <Text style={[styles.overallText, { color: theme.textSecondary }]}>
            {sectionData.length} Units • {topicCount} Topics
          </Text>
        </View>
      </View>

      <SectionList
        sections={sectionData}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overallCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  overallTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  overallStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  overallText: {
    fontSize: 13,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  unitCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unitTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  unitStatsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  unitStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  topicCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  topicContainer: {
    marginBottom: 8,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    elevation: 1,
  },
  topicContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  topicDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtopicCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
  },
  chevron: {
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  subtopicsContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: -4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  subtopicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 1,
    borderLeftWidth: 3,
  },
  subtopicText: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
});

export default SubjectDetailScreen;
