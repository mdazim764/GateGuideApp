import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import CustomHeader from '../components/CustomHeader';
import api from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const YouTubeVideoListScreen = ({ navigation, route }) => {
  const { playlist } = route.params;
  const { theme } = useContext(ThemeContext);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, [playlist.playlistId]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('Fetching videos for playlist:', playlist.playlistId);

      const response = await api.youtube.getPlaylistVideos(playlist.playlistId);
      console.log('API response:', response);

      // FIXED: Extract videos array from the response
      if (response.data && response.data.videos && Array.isArray(response.data.videos)) {
        console.log('Found videos:', response.data.videos.length);
        setVideos(response.data.videos);
      } else {
        console.warn('Invalid response format or no videos found:', response);
        setVideos([]);
        setError('No videos found in this playlist.');
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return 'Unknown';

    // Convert ISO duration or seconds to readable format
    if (typeof duration === 'string' && duration.includes('PT')) {
      // Parse ISO 8601 duration format
      const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!matches) return duration;

      const hours = matches[1] ? parseInt(matches[1]) : 0;
      const minutes = matches[2] ? parseInt(matches[2]) : 0;
      const seconds = matches[3] ? parseInt(matches[3]) : 0;

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`;
      } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    } else if (typeof duration === 'number') {
      // Convert seconds to format
      const mins = Math.floor(duration / 60);
      const secs = Math.floor(duration % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    return duration;
  };

  // Update renderVideoItem to handle missing properties gracefully
  const renderVideoItem = ({ item }) => {
    // Fix 2: Add validation and debug logging for each item
    console.log("Rendering video item:", item);
    
    if (!item || !item.title) {
      console.warn("Invalid video item:", item);
      return null; // Skip rendering invalid items
    }
    
    return (
      <TouchableOpacity
        style={[styles.videoItem, { backgroundColor: theme.card }]}
        onPress={() =>
          navigation.navigate('YouTubePlayer', { video: item, playlist: playlist })
        }
      >
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ 
              uri: item.thumbnailUrl || 'https://via.placeholder.com/320x180?text=No+Thumbnail' 
            }}
            style={styles.thumbnail}
            resizeMode="cover"
            // Fix 3: Add onError handler for image loading failures
            onError={(e) => console.warn("Image failed to load:", e.nativeEvent.error)}
          />
          {item.duration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {formatDuration(item.duration)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.videoInfo}>
          <Text style={[styles.videoTitle, { color: theme.text }]} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.videoDetails}>
            <Text style={[styles.channelName, { color: theme.textSecondary }]}>
              {item.channelTitle || playlist.channelName || "Unknown channel"}
            </Text>

            {item.viewCount && (
              <View style={styles.viewsContainer}>
                <Icon name="eye-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.viewCount, { color: theme.textSecondary }]}>
                  {Number(item.viewCount).toLocaleString()} views
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomHeader
        title={playlist.title}
        subtitle={playlist.channelName}
        navigation={navigation}
        route={route}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchVideos}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id || String(Math.random())} // Fix 4: Add fallback for missing IDs
          renderItem={renderVideoItem}
          contentContainerStyle={styles.listContent}
          // Fix 5: Add these additional props for better debugging
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="playlist-remove" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                No videos found in this playlist
              </Text>
            </View>
          )}
          onRefresh={fetchVideos}
          refreshing={loading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  videoItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: '#333',
  },
  durationBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  videoDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelName: {
    fontSize: 14,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default YouTubeVideoListScreen;
