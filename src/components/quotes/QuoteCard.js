//src/components/qoutes/QouteCard
import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../../theme/ThemeContext';

const QuoteCard = ({ quote }) => {
  const { theme } = useContext(ThemeContext);

  // Add a default empty quote to prevent undefined errors
  const defaultQuote = {
    text: 'The best preparation for tomorrow is doing your best today.',
    author: 'H. Jackson Brown Jr.',
  };

  // Use the provided quote or fallback to default
  const safeQuote = quote || defaultQuote;

  return (
    <View style={[styles.quoteCard, { backgroundColor: theme.card }]}>
      <Text style={[styles.quoteText, { color: theme.text }]}>
        "{safeQuote.text}"
      </Text>
      <Text style={[styles.quoteAuthor, { color: theme.textSecondary }]}>
        — {safeQuote.author}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  quoteCard: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
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
});

export default QuoteCard;
