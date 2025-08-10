import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
import CustomHeader from '../components/CustomHeader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // Full width minus padding

const YouTubePlaylistScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const { subjectId, topicId } = route.params || {};

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    // Mock API call to fetch YouTube playlists
    const fetchPlaylists = async () => {
      try {
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data
        const mockPlaylists = [
          {
            id: 'PL1',
            title: 'Operating Systems - Complete Course',
            channelName: 'GATE Lectures by Ravindrababu Ravula',
            thumbnail: 'https://i.ytimg.com/vi/vBURTt97EkA/maxresdefault.jpg',
            videoCount: 45,
            views: '1.2M',
            updatedAt: '2023-05-15',
          },
          {
            id: 'PL2',
            title: 'Process Scheduling Algorithms',
            channelName: "Jenny's Lectures",
            thumbnail: 'https://i.ytimg.com/vi/2h3eWaPx8SA/maxresdefault.jpg',
            videoCount: 8,
            views: '567K',
            updatedAt: '2023-08-22',
          },
          {
            id: 'PL3',
            title: 'Memory Management in OS',
            channelName: 'Gate Smashers',
            thumbnail: 'https://i.ytimg.com/vi/qdkxXygc3rE/maxresdefault.jpg',
            videoCount: 12,
            views: '890K',
            updatedAt: '2023-09-10',
          },
          {
            id: 'PL4',
            title: 'File Systems and I/O Management',
            channelName: 'Education 4u',
            thumbnail: 'https://i.ytimg.com/vi/KN8YgJnShPM/maxresdefault.jpg',
            videoCount: 15,
            views: '345K',
            updatedAt: '2023-07-05',
          },
          {
            id: 'PL5',
            title: 'OS Crash Course for GATE',
            channelName: 'GATE CSE with Roshan',
            thumbnail: 'https://i.ytimg.com/vi/aF9upelUh5o/maxresdefault.jpg',
            videoCount: 28,
            views: '1.5M',
            updatedAt: '2023-11-20',
          },
        ];

        setPlaylists(mockPlaylists);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching playlists:', err);
        setError('Failed to load playlists. Please try again.');
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [subjectId, topicId]);

  const navigateToVideoList = playlist => {
    navigation.navigate('YouTubeVideoList', { playlist });
  };

  // New animation for card press
  const animatePress = index => {
    const scaleAnim = new Animated.Value(1);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => navigateToVideoList(playlists[index]));
  };

  const renderPlaylistItem = ({ item, index }) => {
    const inputRange = [-1, 0, index * 200, (index + 1) * 200];

    // Animated values for scroll effects
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.95],
      extrapolate: 'clamp',
    });

    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.playlistCard, { backgroundColor: theme.card }]}
          activeOpacity={0.8}
          onPress={() => animatePress(index)}
        >
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.thumbnailImg}
            resizeMode="cover"
          />
          <View style={styles.overlayGradient}>
            <View style={styles.playlistBadge}>
              <Icon name="youtube" size={14} color="#FFFFFF" />
              <Text style={styles.playlistBadgeText}>
                {item.videoCount} videos
              </Text>
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.playlistTitle, { color: theme.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Icon name="playlist-play" size={24} color={theme.primary} />
            </View>

            <Text
              style={[styles.channelName, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {item.channelName}
            </Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Icon
                  name="eye-outline"
                  size={16}
                  color={theme.textSecondary}
                />
                <Text style={[styles.statText, { color: theme.textSecondary }]}>
                  {item.views}
                </Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.statItem}>
                <Icon
                  name="clock-outline"
                  size={16}
                  color={theme.textSecondary}
                />
                <Text style={[styles.statText, { color: theme.textSecondary }]}>
                  {new Date(item.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <CustomHeader
        title="YouTube Playlists"
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading playlists...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Icon
            name="alert-circle-outline"
            size={48}
            color={theme.error || '#E53935'}
          />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setLoading(true);
              setError(null);
              // Refetch data
              setTimeout(() => {
                setLoading(false);
              }, 1000);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Educational Playlists
              </Text>
              <Text
                style={[styles.headerSubtitle, { color: theme.textSecondary }]}
              >
                {playlists.length} playlists available
              </Text>
            </View>
            <View
              style={[
                styles.headerIconContainer,
                { backgroundColor: `${theme.primary}20` },
              ]}
            >
              <Icon name="youtube" size={28} color="#FF0000" />
            </View>
          </View>

          <Animated.FlatList
            data={playlists}
            renderItem={renderPlaylistItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Icon
                  name="playlist-remove"
                  size={48}
                  color={theme.textSecondary}
                />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  No playlists available
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  playlistCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
  },
  thumbnailImg: {
    width: '100%',
    height: 180,
  },
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 12,
  },
  playlistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  playlistBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  contentContainer: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  playlistTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  channelName: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 13,
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
    marginHorizontal: 12,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default YouTubePlaylistScreen;
