import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
import { useApp } from '../context/AppContext';

const QuotesScreen = () => {
  const { theme } = useContext(ThemeContext);
  const {
    currentQuote,
    quotes,
    loadingQuotes,
    quoteError,
    refreshCurrentQuote,
    fetchAllQuotes,
  } = useApp();

  const [fadeAnim] = useState(new Animated.Value(1));
  const [refreshing, setRefreshing] = useState(false);
  // Add state for category filtering
  const [activeCategory, setActiveCategory] = useState('all');

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      refreshCurrentQuote();
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllQuotes();
    setRefreshing(false);
  };

  // Add a function to share quote
  const shareQuote = async quote => {
    try {
      await Share.share({
        message: `"${quote.text}" - ${quote.author}\n\nShared from GateGuideApp`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Function to filter quotes by category
  const getFilteredQuotes = () => {
    if (activeCategory === 'all') return quotes;
    return quotes.filter(quote => quote.type === activeCategory);
  };

  const renderQuoteItem = ({ item }) => (
    <View style={[styles.quoteCard, { backgroundColor: theme.card }]}>
      <Text style={[styles.quoteText, { color: theme.text }]}>
        "{item.text}"
      </Text>
      <Text style={[styles.quoteAuthor, { color: theme.primary }]}>
        - {item.author}
      </Text>

      <View style={styles.quoteFooter}>
        {item.type ? (
          <Text
            style={[
              styles.quoteTypeTag,
              { backgroundColor: getTypeColor(item.type, theme) },
            ]}
          >
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={() => shareQuote(item)}
          style={styles.shareButton}
        >
          <Icon name="share-variant" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Motivation</Text>
        <Image
          source={require('../assets/images/subjects/all.jpg')}
          style={styles.decorationImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.todayContainer}>
        <Text style={[styles.todayTitle, { color: theme.text }]}>
          Quote of the Day
        </Text>

        {loadingQuotes && !currentQuote ? (
          <View
            style={[
              styles.currentQuoteCard,
              {
                backgroundColor: theme.card,
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : quoteError ? (
          <View
            style={[styles.currentQuoteCard, { backgroundColor: theme.card }]}
          >
            <Text style={[styles.errorText, { color: theme.error }]}>
              {quoteError}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={refreshCurrentQuote}
            >
              <Text style={{ color: theme.primary }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : currentQuote ? (
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
            <View style={styles.quoteSymbolContainer}>
              <Icon
                name="format-quote-open"
                size={24}
                color={`${theme.primary}80`}
              />
            </View>

            <Text style={[styles.currentQuoteText, { color: theme.text }]}>
              "{currentQuote.text}"
            </Text>
            <Text style={[styles.currentQuoteAuthor, { color: theme.primary }]}>
              - {currentQuote.author}
            </Text>

            <View style={styles.quoteActions}>
              {currentQuote.type && (
                <View style={styles.typeContainer}>
                  <Text
                    style={[
                      styles.quoteTypeDaily,
                      {
                        backgroundColor: getTypeColor(currentQuote.type, theme),
                      },
                    ]}
                  >
                    {currentQuote.type.toUpperCase()}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => shareQuote(currentQuote)}
                style={[
                  styles.iconButton,
                  { backgroundColor: `${theme.primary}20` },
                ]}
              >
                <Icon name="share-variant" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : null}

        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: theme.primary }]}
          onPress={handleRefreshQuote}
          disabled={loadingQuotes}
        >
          {loadingQuotes ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.refreshText}>New Quote</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Category filter tabs */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryTab,
              activeCategory === 'all'
                ? { backgroundColor: theme.primary }
                : { backgroundColor: theme.card },
            ]}
            onPress={() => setActiveCategory('all')}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === 'all'
                  ? { color: '#FFFFFF' }
                  : { color: theme.text },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryTab,
              activeCategory === 'daily'
                ? {
                    backgroundColor: getTypeColor('daily', theme),
                  }
                : { backgroundColor: theme.card },
            ]}
            onPress={() => setActiveCategory('daily')}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === 'daily'
                  ? { color: '#FFFFFF' }
                  : { color: theme.text },
              ]}
            >
              Daily
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryTab,
              activeCategory === 'personalized'
                ? {
                    backgroundColor: getTypeColor('personalized', theme),
                  }
                : { backgroundColor: theme.card },
            ]}
            onPress={() => setActiveCategory('personalized')}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === 'personalized'
                  ? { color: '#FFFFFF' }
                  : { color: theme.text },
              ]}
            >
              Personalized
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryTab,
              activeCategory === 'random'
                ? {
                    backgroundColor: getTypeColor('random', theme),
                  }
                : { backgroundColor: theme.card },
            ]}
            onPress={() => setActiveCategory('random')}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === 'random'
                  ? { color: '#FFFFFF' }
                  : { color: theme.text },
              ]}
            >
              Random
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.allQuotesContainer}>
        <View style={styles.allQuotesTitleContainer}>
          <Text style={[styles.allQuotesTitle, { color: theme.text }]}>
            All Quotes
          </Text>
          <Text style={[styles.quoteCount, { color: theme.textSecondary }]}>
            {getFilteredQuotes().length} quotes
          </Text>
        </View>

        <FlatList
          data={getFilteredQuotes()}
          keyExtractor={item => item.id}
          renderItem={renderQuoteItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            loadingQuotes ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text
                  style={[styles.loadingText, { color: theme.textSecondary }]}
                >
                  Loading quotes...
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon
                  name="format-quote-close"
                  size={64}
                  color={`${theme.text}20`}
                />
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  {activeCategory === 'all'
                    ? 'No quotes available. Pull down to refresh.'
                    : `No ${activeCategory} quotes found.`}
                </Text>
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
};

// Helper function to determine tag color based on quote type
const getTypeColor = (type, theme) => {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  decorationImage: {
    width: 40,
    height: 40,
    opacity: 0.6,
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
    borderRadius: 12,
    elevation: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quoteSymbolContainer: {
    alignItems: 'flex-start',
    marginBottom: 8,
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
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesScrollContent: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  categoryText: {
    fontWeight: '500',
  },
  allQuotesContainer: {
    flex: 1,
  },
  allQuotesTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  allQuotesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quoteCount: {
    fontSize: 14,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  quoteCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    fontWeight: '500',
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  quoteTypeTag: {
    fontSize: 12,
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  shareButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    padding: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  quoteType: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.7,
    textAlign: 'right',
  },
  quoteTypeDaily: {
    fontSize: 12,
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quoteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
});

export default QuotesScreen;
