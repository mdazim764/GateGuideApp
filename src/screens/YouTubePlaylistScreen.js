import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import CustomHeader from '../components/CustomHeader';
import api from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 32;

const YouTubePlaylistScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const response = await api.youtube.getPlaylists();
      setPlaylists(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching playlists:', err);
      setError('Failed to load playlists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPlaylistItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.playlistCard, { backgroundColor: theme.card }]}
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate('YouTubeVideoList', { playlist: item })
      }
    >
      <ImageBackground
        source={{
          uri:
            item.thumbnailUrl ||
            'https://via.placeholder.com/480x270?text=No+Thumbnail',
        }}
        style={styles.thumbnailBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.videoCountBadge}>
            <Icon name="play-circle" size={14} color="#fff" />
            <Text style={styles.videoCountText}>
              {item._count?.videos || 0} videos
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Icon
            name="youtube"
            size={22}
            color="#FF0000"
            style={styles.youtubeIcon}
          />
          <Text
            style={[styles.playlistTitle, { color: theme.text }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
        </View>

        <View style={styles.channelRow}>
          <Icon
            name="account-circle"
            size={18}
            color={theme.textSecondary}
            style={styles.channelIcon}
          />
          <Text
            style={[styles.channelName, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.channelName}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.watchNowButton, { backgroundColor: theme.primary }]}
          onPress={() =>
            navigation.navigate('YouTubeVideoList', { playlist: item })
          }
        >
          <Text style={styles.watchButtonText}>Watch Now</Text>
          <Icon name="arrow-right" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomHeader
        title="YouTube Playlists"
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
            onPress={fetchPlaylists}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={item => item.id}
          renderItem={renderPlaylistItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  listContent: {
    padding: 16,
  },

  // Enhanced playlist card styles
  playlistCard: {
    width: ITEM_WIDTH,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnailBackground: {
    width: '100%',
    height: 180,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    justifyContent: 'flex-end',
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  videoCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-end',
  },
  videoCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoContainer: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  youtubeIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  playlistTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  channelIcon: {
    marginRight: 6,
  },
  channelName: {
    fontSize: 14,
  },
  watchNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 6,
  },
  watchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
});

export default YouTubePlaylistScreen;
