import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
import CustomHeader from '../components/CustomHeader';

const YouTubePlaylistScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const { subjectId, topicId } = route.params || {};

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const renderPlaylistItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.playlistItem, { backgroundColor: theme.card }]}
      onPress={() => navigateToVideoList(item)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.playlistInfo}>
        <Text
          style={[styles.playlistTitle, { color: theme.text }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text style={[styles.channelName, { color: theme.textSecondary }]}>
          {item.channelName}
        </Text>
        <View style={styles.statsRow}>
          <Text style={[styles.statsText, { color: theme.textSecondary }]}>
            {item.videoCount} videos
          </Text>
          <Text style={[styles.statsText, { color: theme.textSecondary }]}>
            {item.views} views
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={24} color={theme.textSecondary} />
    </TouchableOpacity>
  );

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
          <View style={styles.infoContainer}>
            <Text style={[styles.infoText, { color: theme.text }]}>
              Select a playlist to browse videos
            </Text>
          </View>

          <FlatList
            data={playlists}
            renderItem={renderPlaylistItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  infoText: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  playlistItem: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  thumbnail: {
    width: 120,
    height: 80,
    resizeMode: 'cover',
  },
  playlistInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  playlistTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  channelName: {
    fontSize: 14,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 12,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default YouTubePlaylistScreen;
