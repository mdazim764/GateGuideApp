import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
import { quotes } from '../data/quotes';
import { useApp } from '../context/AppContext';

const QuotesScreen = () => {
  const { theme } = useContext(ThemeContext);
  const { currentQuote, setRandomQuoteOfDay } = useApp();
  const [fadeAnim] = useState(new Animated.Value(1));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      margin: 16,
    },
    todayContainer: {
      margin: 16,
    },
    todayTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    currentQuoteCard: {
      padding: 20,
      borderRadius: 8,
      elevation: 4,
      marginBottom: 16,
    },
    currentQuoteText: {
      fontSize: 18,
      fontStyle: 'italic',
      marginBottom: 12,
      lineHeight: 26,
    },
    currentQuoteAuthor: {
      fontSize: 16,
      textAlign: 'right',
      fontWeight: 'bold',
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    refreshText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      marginLeft: 8,
    },
    allQuotesContainer: {
      flex: 1,
    },
    allQuotesTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 16,
      marginBottom: 8,
    },
    list: {
      padding: 16,
      paddingTop: 0,
    },
    quoteCard: {
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      elevation: 2,
    },
    quoteText: {
      fontSize: 16,
      fontStyle: 'italic',
      marginBottom: 8,
      lineHeight: 24,
    },
    quoteAuthor: {
      fontSize: 14,
      textAlign: 'right',
    },
  });

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setRandomQuoteOfDay();
      fadeIn();
    });
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleRefreshQuote = () => {
    fadeOut();
  };

  const renderQuoteItem = ({ item }) => (
    <View style={[styles.quoteCard, { backgroundColor: theme.card }]}>
      <Text style={[styles.quoteText, { color: theme.text }]}>
        "{item.text}"
      </Text>
      <Text style={[styles.quoteAuthor, { color: theme.primary }]}>
        - {item.author}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>Motivation</Text>

      <View style={styles.todayContainer}>
        <Text style={[styles.todayTitle, { color: theme.text }]}>
          Quote of the Day
        </Text>

        {currentQuote && (
          <Animated.View
            style={[
              styles.currentQuoteCard,
              {
                backgroundColor: theme.card,
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={[styles.currentQuoteText, { color: theme.text }]}>
              "{currentQuote.text}"
            </Text>
            <Text style={[styles.currentQuoteAuthor, { color: theme.primary }]}>
              - {currentQuote.author}
            </Text>
          </Animated.View>
        )}

        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: theme.primary }]}
          onPress={handleRefreshQuote}
        >
          <Icon name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.refreshText}>New Quote</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.allQuotesContainer}>
        <Text style={[styles.allQuotesTitle, { color: theme.text }]}>
          All Quotes
        </Text>
        <FlatList
          data={quotes}
          keyExtractor={item => item.id.toString()}
          renderItem={renderQuoteItem}
          contentContainerStyle={styles.list}
        />
      </View>
    </SafeAreaView>
  );
};

export default QuotesScreen;
