//src/components/qoutes/QouteCard
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../../theme/ThemeContext';

const QuoteCard = ({ quote, onShare, showActions = true }) => {
  const { theme } = useContext(ThemeContext);

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    try {
      await Share.share({
        message: `"${quote.text}" - ${quote.author}\n\nShared from GateGuideApp`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Helper function to determine tag color based on quote type
  const getTypeColor = type => {
    if (!type) return theme.textSecondary + '80';

    switch (type.toLowerCase()) {
      case 'daily':
        return theme.success + 'CC';
      case 'personalized':
        return theme.primary + 'CC';
      case 'random':
        return theme.accent + 'CC';
      default:
        return theme.textSecondary + '80';
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={styles.quoteSymbol}>
        <Icon name="format-quote-open" size={24} color={`${theme.primary}50`} />
      </View>

      <Text style={[styles.quoteText, { color: theme.text }]}>
        "{quote.text}"
      </Text>

      <Text style={[styles.author, { color: theme.primary }]}>
        - {quote.author}
      </Text>

      {showActions && (
        <View style={styles.footer}>
          {quote.type && (
            <View style={styles.typeContainer}>
              <Text
                style={[
                  styles.typeTag,
                  { backgroundColor: getTypeColor(quote.type) },
                ]}
              >
                {quote.type.toUpperCase()}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.shareButton,
              { backgroundColor: `${theme.primary}20` },
            ]}
            onPress={handleShare}
          >
            <Icon name="share-variant" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quoteSymbol: {
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 12,
  },
  author: {
    fontSize: 14,
    textAlign: 'right',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  typeContainer: {
    flexDirection: 'row',
  },
  typeTag: {
    fontSize: 10,
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  shareButton: {
    padding: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default QuoteCard;
