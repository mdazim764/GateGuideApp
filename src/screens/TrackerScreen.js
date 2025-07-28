import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
import subjects from '../data/subjects';
import { useApp } from '../context/AppContext';

const TrackerScreen = () => {
  const { theme } = useContext(ThemeContext);
  const { progress, updateProgress } = useApp();
  const [selectedSubject, setSelectedSubject] = useState(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      margin: 16,
    },
    overallCard: {
      margin: 16,
      padding: 16,
      borderRadius: 8,
      elevation: 2,
    },
    overallTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    overallText: {
      fontSize: 16,
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
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 16,
      marginTop: 8,
    },
    list: {
      padding: 16,
    },
    subjectCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      elevation: 2,
    },
    subjectInfo: {
      flex: 1,
      marginRight: 8,
    },
    subjectTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    progressText: {
      fontSize: 14,
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
      fontSize: 20,
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
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    weightageText: {
      fontSize: 14,
    },
  });

  // Calculate overall progress
  const calculateProgress = () => {
    let totalTopics = 0;
    let completedTopics = 0;

    subjects.forEach(subject => {
      subject.topics.forEach(topic => {
        totalTopics++;
        if (progress[subject.id] && progress[subject.id][topic.id] === 'completed') {
          completedTopics++;
        }
      });
    });

    return {
      percentage: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      completed: completedTopics,
      total: totalTopics
    };
  };

  // Calculate subject progress
  const calculateSubjectProgress = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return 0;

    let completedTopics = 0;
    subject.topics.forEach(topic => {
      if (progress[subjectId] && progress[subjectId][topic.id] === 'completed') {
        completedTopics++;
      }
    });

    return {
      percentage: Math.round((completedTopics / subject.topics.length) * 100),
      completed: completedTopics,
      total: subject.topics.length
    };
  };

  // Toggle topic completion status
  const toggleTopicStatus = (subjectId, topicId) => {
    const currentStatus = progress[subjectId]?.[topicId];
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    updateProgress(subjectId, topicId, newStatus);
  };

  const handleSubjectPress = (subject) => {
    setSelectedSubject(subject);
  };

  const handleBackPress = () => {
    setSelectedSubject(null);
  };

  const renderSubjectItem = ({ item }) => {
    const subjectProgress = calculateSubjectProgress(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.subjectCard, { backgroundColor: theme.card }]}
        onPress={() => handleSubjectPress(item)}>
        <View style={styles.subjectInfo}>
          <Text style={[styles.subjectTitle, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.progressText, { color: theme.text }]}>
            {subjectProgress.completed}/{subjectProgress.total} topics completed
          </Text>
        </View>
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar,
              { width: `${subjectProgress.percentage}%`, backgroundColor: theme.primary }
            ]} 
          />
        </View>
        <Icon name="chevron-right" size={24} color={theme.primary} />
      </TouchableOpacity>
    );
  };

  if (selectedSubject) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{selectedSubject.name}</Text>
        </View>

        <FlatList
          data={selectedSubject.topics}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isCompleted = progress[selectedSubject.id]?.[item.id] === 'completed';
            
            return (
              <TouchableOpacity
                style={[
                  styles.topicItem, 
                  { 
                    backgroundColor: theme.card,
                    borderLeftWidth: 4,
                    borderLeftColor: isCompleted ? theme.primary : 'transparent',
                  }
                ]}
                onPress={() => toggleTopicStatus(selectedSubject.id, item.id)}>
                <View style={styles.topicContent}>
                  <Text style={[styles.topicName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.weightageText, { color: theme.text }]}>
                    Weightage: {item.weightage}
                  </Text>
                </View>
                <Icon 
                  name={isCompleted ? "check-circle" : "circle-outline"} 
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

  const overallProgress = calculateProgress();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>PYQ Tracker</Text>
        
        <View style={[styles.overallCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.overallTitle, { color: theme.text }]}>Overall Progress</Text>
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar,
                { width: `${overallProgress.percentage}%`, backgroundColor: theme.primary }
              ]} 
            />
          </View>
          <Text style={[styles.overallText, { color: theme.text }]}>
            {overallProgress.percentage}% - {overallProgress.completed}/{overallProgress.total} topics completed
          </Text>
        </View>
        
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Subjects</Text>
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          renderItem={renderSubjectItem}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default TrackerScreen;
