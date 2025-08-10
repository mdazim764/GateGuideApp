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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
import CustomHeader from '../components/CustomHeader';

const { width } = Dimensions.get('window');

const YouTubeVideoListScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const { playlist } = route.params || {};

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load video data for this playlist - replace with actual API call later
    const fetchVideos = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const dummyVideos = [
          {
            id: '1',
            title:
              'Introduction to Operating Systems: Processes, Memory and File Systems',
            videoId: 'dQw4w9WgXcQ',
            thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            duration: '10:15',
            views: '120K',
            publishedAt: '2 weeks ago',
            description:
              'This video covers the basics of operating systems including processes, scheduling algorithms, memory management, and file systems.',
          },
          {
            id: '2',
            title:
              'Process Scheduling Algorithms: FCFS, SJF, Round Robin and Priority Scheduling',
            videoId: 'xvFZjo5PgG0',
            thumbnail: 'https://i.ytimg.com/vi/xvFZjo5PgG0/maxresdefault.jpg',
            duration: '15:32',
            views: '85K',
            publishedAt: '1 month ago',
            description:
              'Learn about different CPU scheduling algorithms used in operating systems.',
          },
          {
            id: '3',
            title: 'Memory Management: Paging, Segmentation and Virtual Memory',
            videoId: 'oHg5SJYRHA0',
            thumbnail: 'https://i.ytimg.com/vi/oHg5SJYRHA0/maxresdefault.jpg',
            duration: '12:47',
            views: '200K',
            publishedAt: '3 weeks ago',
            description:
              'Understand how operating systems manage memory through paging and segmentation.',
          },
          {
            id: '4',
            title: 'File Systems: Organization, Access Methods and Allocation',
            videoId: 'V_OVxxIEbDQ',
            thumbnail: 'https://i.ytimg.com/vi/V_OVxxIEbDQ/maxresdefault.jpg',
            duration: '18:10',
            views: '75K',
            publishedAt: '1 month ago',
            description:
              'Explore file system concepts including allocation methods, directory structure, and access mechanisms.',
          },
          {
            id: '5',
            title: 'Deadlocks: Detection, Prevention and Recovery',
            videoId: 'IQ7CrXjjYbQ',
            thumbnail: 'https://i.ytimg.com/vi/IQ7CrXjjYbQ/maxresdefault.jpg',
            duration: '14:23',
            views: '95K',
            publishedAt: '2 months ago',
            description:
              'Learn about deadlock conditions, detection algorithms, and recovery strategies.',
          },
          {
            id: '6',
            title: 'I/O Systems: Hardware, Software and Performance',
            videoId: 'fUB8YvJRMZA',
            thumbnail: 'https://i.ytimg.com/vi/fUB8YvJRMZA/maxresdefault.jpg',
            duration: '16:55',
            views: '62K',
            publishedAt: '3 months ago',
            description:
              'Understanding input/output systems in operating systems and related performance considerations.',
          },
        ];

        setVideos(dummyVideos);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to load videos. Please try again.');
        setLoading(false);
      }
    };

    fetchVideos();
  }, [playlist]);

  const renderVideoItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.videoCard, { backgroundColor: theme.card }]}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate('YouTubePlayer', { video: item, playlist })
      }
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: item.thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{item.duration}</Text>
        </View>
        <View style={styles.playIconContainer}>
          <Icon name="play-circle" size={36} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.videoDetails}>
        <Text
          style={[styles.videoTitle, { color: theme.text }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <View style={styles.videoMeta}>
          <View style={styles.metaItem}>
            <Icon name="eye-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {item.views}
            </Text>
          </View>

          <View style={styles.metaSeparator} />

          <View style={styles.metaItem}>
            <Icon name="clock-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {item.publishedAt}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <CustomHeader title={playlist?.title || 'Videos'} />

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            Loading videos...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Icon name="alert-circle-outline" size={48} color="#E53935" />
          <Text style={[styles.statusText, { color: theme.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setLoading(true);
              setError(null);
              setTimeout(() => setLoading(false), 1000);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View
            style={[styles.playlistInfoCard, { backgroundColor: theme.card }]}
          >
            <View style={styles.playlistHeader}>
              {playlist?.thumbnail ? (
                <Image
                  source={{ uri: playlist.thumbnail }}
                  style={styles.playlistThumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.playlistThumbnailFallback,
                    { backgroundColor: `${theme.primary}20` },
                  ]}
                >
                  <Icon name="playlist-play" size={32} color={theme.primary} />
                </View>
              )}

              <View style={styles.playlistInfo}>
                <Text style={[styles.playlistTitle, { color: theme.text }]}>
                  {playlist?.title || 'Playlist'}
                </Text>
                <Text
                  style={[styles.channelName, { color: theme.textSecondary }]}
                >
                  {playlist?.channelName || 'Channel name'}
                </Text>
                <Text
                  style={[styles.playlistStats, { color: theme.textSecondary }]}
                >
                  {playlist?.videoCount || videos.length} videos •{' '}
                  {playlist?.views || '100K'} views
                </Text>
              </View>
            </View>

            <View style={styles.playlistActions}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => {
                  if (videos.length > 0) {
                    navigation.navigate('YouTubePlayer', {
                      video: videos[0],
                      playlist,
                    });
                  }
                }}
              >
                <Icon name="play" size={16} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Play All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.primary }]}
              >
                <Icon name="shuffle" size={16} color={theme.primary} />
                <Text
                  style={[styles.secondaryButtonText, { color: theme.primary }]}
                >
                  Shuffle
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={videos}
            renderItem={renderVideoItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.videoList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.centerContent}>
                <Icon
                  name="playlist-remove"
                  size={48}
                  color={theme.textSecondary}
                />
                <Text style={[styles.statusText, { color: theme.text }]}>
                  No videos in this playlist
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  playlistInfoCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  playlistHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  playlistThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  playlistThumbnailFallback: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  playlistTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  channelName: {
    fontSize: 14,
    marginBottom: 4,
  },
  playlistStats: {
    fontSize: 12,
  },
  playlistActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '600',
    marginLeft: 8,
  },
  videoList: {
    padding: 16,
    paddingTop: 8,
  },
  videoCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  playIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoDetails: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    marginLeft: 4,
  },
  metaSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 8,
  },
});

export default YouTubeVideoListScreen;
