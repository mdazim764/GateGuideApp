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

const YouTubeVideoListScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const { playlist } = route.params || {};
  
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load video data for this playlist - replace with actual API call later
    const dummyVideos = [
      {
        id: '1',
        title: 'Introduction to the Subject',
        videoId: 'dQw4w9WgXcQ', // Example YouTube video ID
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        duration: '10:15',
        views: '120K',
        publishedAt: '2 weeks ago',
      },
      {
        id: '2',
        title: 'Key Concepts Explained',
        videoId: 'xvFZjo5PgG0', // Example YouTube video ID
        thumbnail: 'https://i.ytimg.com/vi/xvFZjo5PgG0/maxresdefault.jpg',
        duration: '8:32',
        views: '85K',
        publishedAt: '1 month ago',
      },
      {
        id: '3',
        title: 'Advanced Topics and Applications',
        videoId: 'oHg5SJYRHA0', // Example YouTube video ID
        thumbnail: 'https://i.ytimg.com/vi/oHg5SJYRHA0/maxresdefault.jpg',
        duration: '12:47',
        views: '200K',
        publishedAt: '3 weeks ago',
      },
    ];

    setVideos(dummyVideos);
    setLoading(false);
  }, []);

  const renderVideoItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.videoItem, { backgroundColor: theme.card }]}
      onPress={() => navigation.navigate('YouTubePlayer', { video: item, playlist })}
    >
      <View style={styles.thumbnailContainer}>
        <Image 
          source={{ uri: item.thumbnail || 'https://via.placeholder.com/480x360' }} 
          style={styles.thumbnail}
        />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{item.duration}</Text>
        </View>
      </View>
      
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: theme.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        
        <Text style={[styles.videoMeta, { color: theme.textSecondary }]}>
          {item.views} views • {item.publishedAt}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomHeader title={playlist?.title || "Videos"} />
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  videoItem: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
    width: 160,
    height: 90,
  },
  thumbnail: {
    width: 160,
    height: 90,
    resizeMode: 'cover',
  },
  durationBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  videoInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  videoMeta: {
    fontSize: 13,
  },
});

export default YouTubeVideoListScreen;