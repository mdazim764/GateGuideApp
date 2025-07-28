import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { ThemeContext } from '../theme/ThemeContext';

const HomeScreen = () => {
  const { currentQuote, progress, isLoading } = useApp();
  const { theme } = useContext(ThemeContext);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      color: theme.text,
      fontSize: 18,
      marginBottom: 30,
    },
    scrollContent: {
      padding: 16,
    },
    quoteCard: {
      padding: 16,
      borderRadius: 8,
      marginBottom: 16,
      elevation: 2,
    },
    quoteText: {
      fontSize: 16,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    quoteAuthor: {
      fontSize: 14,
      textAlign: 'right',
    },
    section: {
      padding: 16,
      borderRadius: 8,
      marginBottom: 16,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    text: {
      fontSize: 16,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.text, { color: theme.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>GATE CSE 2026</Text>

        {/* Quote of the day */}
        {currentQuote && (
          <View style={[styles.quoteCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.quoteText, { color: theme.text }]}>
              "{currentQuote.text}"
            </Text>
            <Text style={[styles.quoteAuthor, { color: theme.primary }]}>
              - {currentQuote.author}
            </Text>
          </View>
        )}

        {/* Progress summary */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Your Progress
          </Text>
          <Text style={[styles.text, { color: theme.text }]}>
            Coming soon...
          </Text>
        </View>

        {/* Today's tasks */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Today's Tasks
          </Text>
          <Text style={[styles.text, { color: theme.text }]}>
            Coming soon...
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
