import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { lightTheme, darkTheme } from '../../theme/colors';

const SubjectCard = ({ subject, onPress, progress }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          {subject.name}
        </Text>
        {progress && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progress.percentage}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>
        )}
        <Text style={[styles.topics, { color: theme.text }]}>
          {subject.topics.length} topics
          {progress && ` • ${progress.completed}/${progress.total} completed`}
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color={theme.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  topics: {
    fontSize: 14,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});

export default SubjectCard;
