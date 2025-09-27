import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomHeader from '../components/CustomHeader';
import { useData } from '../context/DataContext';

const SyllabusScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const { syllabusWithProgress, loading, errors, fetchSyllabusWithProgress } =
    useData();

  useEffect(() => {
    // Data is automatically loaded by DataProvider
    // Only refetch if we don't have data and not currently loading
    if (!syllabusWithProgress && !loading.syllabusWithProgress) {
      fetchSyllabusWithProgress();
    }
  }, [
    syllabusWithProgress,
    loading.syllabusWithProgress,
    fetchSyllabusWithProgress,
  ]);

  const handleRefresh = () => {
    fetchSyllabusWithProgress(true); // Force refresh
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { backgroundColor: theme.card }]}
      activeOpacity={0.8}
      onPress={() =>
        navigation?.navigate('SubjectDetail', {
          subject: item,
        })
      }
    >
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, { color: theme.text }]}>
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
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {item.progress || 0}% Complete
        </Text>
      </View>
      <Icon
        name="chevron-forward"
        size={22}
        color={theme.primary}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomHeader
        title="GATE Syllabus"
        navigation={navigation}
        route={route}
      />

      <Text style={[styles.sectionTitle, { color: theme.primary }]}>
        Subjects
      </Text>

      {loading.syllabusWithProgress ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading syllabus...
          </Text>
        </View>
      ) : errors.syllabusWithProgress ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            {errors.syllabusWithProgress}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={handleRefresh}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={syllabusWithProgress || []}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={loading.syllabusWithProgress}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  itemContainer: {
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 16,
  },
});

export default SyllabusScreen;
