import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../../theme/colors';

const QuoteCard = ({ quote, style }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <View style={[styles.card, { backgroundColor: theme.card }, style]}>
      <Text style={[styles.text, { color: theme.text }]}>"{quote.text}"</Text>
      <Text style={[styles.author, { color: theme.primary }]}>
        - {quote.author}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 24,
  },
  author: {
    fontSize: 14,
    textAlign: 'right',
    fontWeight: 'bold',
  },
});

export default QuoteCard;
