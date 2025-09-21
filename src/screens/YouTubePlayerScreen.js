import React, {
  useState,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  StatusBar,
  BackHandler,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
import YoutubeIframe from 'react-native-youtube-iframe';
import CustomHeader from '../components/CustomHeader';
import Orientation from 'react-native-orientation-locker';
import api from '../services/api';

const { width } = Dimensions.get('window');

const YouTubePlayerScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const { video, playlist } = route.params || {};

  const [playing, setPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(video);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orientation, setOrientation] = useState('PORTRAIT');
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [playlistLoading, setPlaylistLoading] = useState(false);

  const scrollViewRef = useRef(null);
  const playerRef = useRef(null);

  // Handle orientation changes
  useEffect(() => {
    // Set up orientation change listener
    const dimensionsListener = Dimensions.addEventListener(
      'change',
      ({ window }) => {
        setDimensions(window);
        const { width, height } = window;
        setOrientation(width > height ? 'LANDSCAPE' : 'PORTRAIT');
      },
    );

    // Set up mock related videos data
    const mockRelatedVideos = [
      {
        id: '1',
        title: 'Introduction to Process Scheduling Algorithms',
        videoId: 'dQw4w9WgXcQ',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        duration: '8:45',
        views: '156K',
        publishedAt: '1 month ago',
      },
      {
        id: '2',
        title: 'Memory Management in Operating Systems - Complete Tutorial',
        videoId: 'xvFZjo5PgG0',
        thumbnail: 'https://i.ytimg.com/vi/xvFZjo5PgG0/maxresdefault.jpg',
        duration: '12:20',
        views: '89K',
        publishedAt: '3 weeks ago',
      },
      {
        id: '3',
        title: 'File Systems and Organization - OS Concepts',
        videoId: 'oHg5SJYRHA0',
        thumbnail: 'https://i.ytimg.com/vi/oHg5SJYRHA0/maxresdefault.jpg',
        duration: '15:32',
        views: '210K',
        publishedAt: '2 months ago',
      },
    ];

    setRelatedVideos(mockRelatedVideos);

    // Override back button behavior in fullscreen mode
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isFullscreen) {
          toggleFullscreen();
          return true;
        }
        return false;
      },
    );

    // Load playlist videos if we have a playlist
    if (playlist && playlist.playlistId) {
      loadPlaylistVideos(playlist.playlistId);
    }

    return () => {
      // Clean up listeners when component unmounts
      dimensionsListener.remove();
      backHandler.remove();

      // Reset orientation when leaving
      if (orientation === 'LANDSCAPE') {
        Orientation.lockToPortrait();
      }
    };
  }, [isFullscreen, orientation]);

  // Load playlist videos
  const loadPlaylistVideos = async playlistId => {
    try {
      setPlaylistLoading(true);
      const response = await api.youtube.getPlaylistVideos(playlistId);

      if (
        response.data &&
        response.data.videos &&
        Array.isArray(response.data.videos)
      ) {
        setPlaylistVideos(response.data.videos);

        // Find the index of the current video in the playlist
        const index = response.data.videos.findIndex(
          v => v.id === currentVideo.id || v.videoId === currentVideo.videoId,
        );
        if (index !== -1) {
          setCurrentVideoIndex(index);
        }
      }
    } catch (error) {
      console.error('Error loading playlist videos:', error);
    } finally {
      setPlaylistLoading(false);
    }
  };

  // Navigate to next video in playlist
  const playNextVideo = () => {
    if (
      playlistVideos.length > 0 &&
      currentVideoIndex < playlistVideos.length - 1
    ) {
      const nextVideo = playlistVideos[currentVideoIndex + 1];
      setCurrentVideo(nextVideo);
      setCurrentVideoIndex(currentVideoIndex + 1);
      setPlaying(true);
      setLoading(true);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // Navigate to previous video in playlist
  const playPreviousVideo = () => {
    if (playlistVideos.length > 0 && currentVideoIndex > 0) {
      const prevVideo = playlistVideos[currentVideoIndex - 1];
      setCurrentVideo(prevVideo);
      setCurrentVideoIndex(currentVideoIndex - 1);
      setPlaying(true);
      setLoading(true);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // Handle YouTube player state changes
  const onStateChange = useCallback(
    state => {
      if (state === 'ended') {
        setPlaying(false);
        // Auto-play next video when current one ends
        if (playlist && currentVideoIndex < playlistVideos.length - 1) {
          playNextVideo();
        }
      }
      if (state === 'playing') {
        setLoading(false);
      }
    },
    [currentVideoIndex, playlistVideos.length, playlist],
  );

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      Orientation.lockToPortrait();
      setIsFullscreen(false);
      StatusBar.setHidden(false);
      // Force player to rerender
      setLoading(true);
      setTimeout(() => setLoading(false), 300);
    } else {
      Orientation.lockToLandscape();
      setIsFullscreen(true);
      StatusBar.setHidden(true);
      // Force player to rerender
      setLoading(true);
      setTimeout(() => setLoading(false), 300);
    }
  }, [isFullscreen]);

  // Calculate player dimensions based on orientation
  const getPlayerDimensions = () => {
    const { width, height } = dimensions;

    if (orientation === 'LANDSCAPE' || isFullscreen) {
      return {
        width: width,
        height: height,
      };
    } else {
      return {
        width: width,
        height: width * 0.5625, // 16:9 aspect ratio
      };
    }
  };

  const playerDimensions = getPlayerDimensions();

  // Format duration for display (converts ISO duration or seconds to readable format)
  const formatDuration = duration => {
    if (!duration) return '';

    if (typeof duration === 'string') {
      // Handle ISO duration like "01:27:11"
      return duration.replace(/^0+:/, '');
    }

    // Handle seconds number
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render next videos in playlist
  const renderPlaylistItem = ({ item, index }) => {
    const isCurrentVideo = currentVideoIndex === index;

    return (
      <TouchableOpacity
        style={[
          styles.playlistItem,
          {
            backgroundColor: isCurrentVideo ? `${theme.primary}15` : theme.card,
            borderLeftColor: isCurrentVideo ? theme.primary : 'transparent',
            borderLeftWidth: isCurrentVideo ? 3 : 0,
          },
        ]}
        onPress={() => {
          setCurrentVideo(item);
          setCurrentVideoIndex(index);
          setPlaying(true);
          setLoading(true);
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }}
      >
        <View style={styles.playlistItemThumbnail}>
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.playlistItemImage}
          />
          <View style={styles.playlistItemDuration}>
            <Text style={styles.durationText}>
              {formatDuration(item.duration)}
            </Text>
          </View>
          {isCurrentVideo && (
            <View style={styles.nowPlayingIndicator}>
              <Icon name="play-circle" size={24} color={theme.primary} />
            </View>
          )}
        </View>

        <View style={styles.playlistItemDetails}>
          <Text
            style={[
              styles.playlistItemTitle,
              { color: theme.text, fontWeight: isCurrentVideo ? '700' : '500' },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <View style={styles.playlistItemMeta}>
            <Text
              style={[styles.playlistItemIndex, { color: theme.textSecondary }]}
            >
              {index + 1}/{playlistVideos.length}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={['top', 'left', 'right']}
      >
        {!isFullscreen && (
          <CustomHeader
            title={currentVideo?.title || 'Video Player'}
            subtitle={playlist?.title}
            navigation={navigation}
            onBack={() => navigation.goBack()}
          />
        )}

        <View
          style={[
            styles.playerContainer,
            {
              width: playerDimensions.width,
              height: playerDimensions.height,
            },
          ]}
        >
          {loading && (
            <View
              style={[
                styles.loadingOverlay,
                { backgroundColor: theme.background },
              ]}
            >
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}

          <YoutubeIframe
            ref={playerRef}
            height={playerDimensions.height}
            width={playerDimensions.width}
            play={playing}
            videoId={currentVideo?.videoId}
            onChangeState={onStateChange}
            webViewProps={{
              androidLayerType: 'hardware',
              renderToHardwareTextureAndroid: true,
              javaScriptEnabled: true,
              domStorageEnabled: true,
              allowsFullscreenVideo: true,
              mediaPlaybackRequiresUserAction: false,
              allowsInlineMediaPlayback: true,
            }}
            initialPlayerParams={{
              preventFullScreen: false,
              controls: true,
              showClosedCaptions: true,
              modestbranding: true,
              hl: 'hi',
              rel: false,
              iv_load_policy: 3, // Hide annotations
              fs: 1,
              playsinline: 0,
              autoplay: 1,
              enablejsapi: 1,
              origin: 'https://www.youtube.com',
            }}
          />

          {!isFullscreen && (
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={toggleFullscreen}
            >
              <Icon name="fullscreen" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {!isFullscreen && (
          <>
            <View
              style={[styles.videoControls, { backgroundColor: theme.card }]}
            >
              <View style={styles.playbackControls}>
                <TouchableOpacity
                  onPress={playPreviousVideo}
                  disabled={currentVideoIndex === 0}
                  style={[
                    styles.navigationButton,
                    currentVideoIndex === 0 ? { opacity: 0.5 } : {},
                  ]}
                >
                  <Icon name="skip-previous" size={28} color={theme.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playPauseButton}
                  onPress={() => setPlaying(!playing)}
                >
                  <Icon
                    name={playing ? 'pause-circle' : 'play-circle'}
                    size={48}
                    color={theme.primary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={playNextVideo}
                  disabled={currentVideoIndex === playlistVideos.length - 1}
                  style={[
                    styles.navigationButton,
                    currentVideoIndex === playlistVideos.length - 1
                      ? { opacity: 0.5 }
                      : {},
                  ]}
                >
                  <Icon name="skip-next" size={28} color={theme.primary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.fullscreenTextButton}
                onPress={toggleFullscreen}
              >
                <Icon name="fullscreen" size={24} color={theme.primary} />
                <Text style={[styles.fullscreenText, { color: theme.text }]}>
                  Fullscreen
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.contentScroll}
              showsVerticalScrollIndicator={false}
              ref={scrollViewRef}
            >
              <View style={styles.videoDetails}>
                <Text style={[styles.videoTitle, { color: theme.text }]}>
                  {currentVideo?.title}
                </Text>

                <View style={styles.controlsRow}>
                  <View style={styles.viewsInfo}>
                    <Icon
                      name="eye-outline"
                      size={16}
                      color={theme.textSecondary}
                    />
                    <Text
                      style={[styles.viewsText, { color: theme.textSecondary }]}
                    >
                      {currentVideo?.views || '100K'} views
                    </Text>
                  </View>

                  <View style={styles.controls}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => setPlaying(!playing)}
                    >
                      <Icon
                        name={playing ? 'pause' : 'play'}
                        size={24}
                        color={theme.primary}
                      />
                      <Text style={[styles.controlText, { color: theme.text }]}>
                        {playing ? 'Pause' : 'Play'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => setNotesModalVisible(true)}
                    >
                      <Icon
                        name="note-text-outline"
                        size={24}
                        color={theme.primary}
                      />
                      <Text style={[styles.controlText, { color: theme.text }]}>
                        Notes
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlButton}>
                      <Icon
                        name="content-save-outline"
                        size={24}
                        color={theme.primary}
                      />
                      <Text style={[styles.controlText, { color: theme.text }]}>
                        Save
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlButton}>
                      <Icon
                        name="share-outline"
                        size={24}
                        color={theme.primary}
                      />
                      <Text style={[styles.controlText, { color: theme.text }]}>
                        Share
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {playlist && (
                <View
                  style={[
                    styles.playlistInfo,
                    { backgroundColor: `${theme.primary}15` },
                  ]}
                >
                  <View style={styles.playlistHeader}>
                    <Text style={[styles.playlistTitle, { color: theme.text }]}>
                      From: {playlist.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.goBack()}
                      style={styles.viewPlaylistButton}
                    >
                      <Text
                        style={[
                          styles.viewPlaylistText,
                          { color: theme.primary },
                        ]}
                      >
                        View All
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={[styles.channelName, { color: theme.textSecondary }]}
                  >
                    {playlist.channelName}
                  </Text>
                </View>
              )}

              {/* New section: Next videos in playlist */}
              {playlist && playlistVideos.length > 0 && (
                <View style={styles.nextVideosSection}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Next in Playlist ({currentVideoIndex + 1}/
                    {playlistVideos.length})
                  </Text>

                  {playlistLoading ? (
                    <ActivityIndicator
                      color={theme.primary}
                      style={styles.playlistLoader}
                    />
                  ) : (
                    <FlatList
                      data={playlistVideos}
                      renderItem={renderPlaylistItem}
                      keyExtractor={item => item.id}
                      horizontal={false}
                      scrollEnabled={false}
                      initialNumToRender={5}
                      maxToRenderPerBatch={10}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.playlistItemsContainer}
                      ListEmptyComponent={
                        <Text
                          style={[
                            styles.emptyText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          No videos found in this playlist
                        </Text>
                      }
                    />
                  )}
                </View>
              )}

              <View style={styles.relatedSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Related Videos
                </Text>

                {relatedVideos.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.relatedVideoItem,
                      { backgroundColor: theme.card },
                    ]}
                    onPress={() => {
                      setCurrentVideo({
                        ...item,
                        title: item.title,
                        videoId: item.videoId,
                      });
                      setPlaying(true);
                      setLoading(true);
                      // Scroll to top
                      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                    }}
                  >
                    <View style={styles.relatedThumbnailContainer}>
                      <Image
                        source={{ uri: item.thumbnail }}
                        style={styles.relatedThumbnail}
                      />
                      <View style={styles.relatedDurationBadge}>
                        <Text style={styles.relatedDurationText}>
                          {item.duration}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.relatedVideoInfo}>
                      <Text
                        style={[
                          styles.relatedVideoTitle,
                          { color: theme.text },
                        ]}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>

                      <Text
                        style={[
                          styles.relatedStatsText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {item.views} views • {item.publishedAt}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Modal
              visible={notesModalVisible}
              animationType="fade"
              transparent={true}
              onRequestClose={() => setNotesModalVisible(false)}
            >
              <View
                style={[
                  styles.modalContainer,
                  { backgroundColor: 'rgba(0,0,0,0.5)' },
                ]}
              >
                <View
                  style={[styles.modalContent, { backgroundColor: theme.card }]}
                >
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    Add Notes
                  </Text>
                  <TextInput
                    style={[
                      styles.notesInput,
                      {
                        color: theme.text,
                        backgroundColor: `${theme.background}50`,
                      },
                    ]}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    placeholder="Write your notes here..."
                    placeholderTextColor={`${theme.text}50`}
                  />
                  <View style={styles.notesActions}>
                    <TouchableOpacity
                      style={[
                        styles.notesCancelButton,
                        { borderColor: theme.textSecondary },
                      ]}
                      onPress={() => setNotesModalVisible(false)}
                    >
                      <Text style={{ color: theme.textSecondary }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.notesSaveButton,
                        { backgroundColor: theme.primary },
                      ]}
                      onPress={() => {
                        // Save notes logic here
                        setNotesModalVisible(false);
                      }}
                    >
                      <Text style={{ color: '#FFFFFF' }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}
      </SafeAreaView>

      {isFullscreen && (
        <Modal
          visible={true}
          transparent={false}
          animationType="fade"
          onRequestClose={toggleFullscreen}
          supportedOrientations={['landscape']}
          statusBarTranslucent={true}
        >
          <View style={styles.fullscreenWrapper}>
            <StatusBar hidden={true} />
            <YoutubeIframe
              ref={playerRef}
              height={dimensions.height}
              width={dimensions.width}
              play={playing}
              videoId={currentVideo?.videoId}
              onChangeState={onStateChange}
              webViewProps={{
                androidLayerType: 'hardware',
                renderToHardwareTextureAndroid: true,
                javaScriptEnabled: true,
                domStorageEnabled: true,
                allowsFullscreenVideo: true,
                mediaPlaybackRequiresUserAction: false,
                allowsInlineMediaPlayback: true,
              }}
              initialPlayerParams={{
                preventFullScreen: false,
                controls: true,
                showClosedCaptions: true,
                modestbranding: true,
                hl: 'hi',
                rel: false,
                iv_load_policy: 3,
                fs: 1,
                playsinline: 0,
                autoplay: 1,
                enablejsapi: 1,
                origin: 'https://www.youtube.com',
              }}
            />
            <TouchableOpacity
              style={styles.exitFullscreenButton}
              onPress={toggleFullscreen}
            >
              <Icon name="fullscreen-exit" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.fullscreenControls}>
              <TouchableOpacity onPress={() => setPlaying(!playing)}>
                <Icon
                  name={playing ? 'pause-circle' : 'play-circle'}
                  size={50}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullscreenContainer: {
    backgroundColor: '#000',
  },
  playerContainer: {
    backgroundColor: 'black',
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  fullscreenButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 6,
  },
  fullscreenTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullscreenText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationButton: {
    padding: 8,
  },
  playPauseButton: {
    marginHorizontal: 12,
  },
  contentScroll: {
    flex: 1,
  },
  videoDetails: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  controlsRow: {
    marginTop: 8,
  },
  viewsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewsText: {
    marginLeft: 6,
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 8,
  },
  controlButton: {
    alignItems: 'center',
    padding: 8,
  },
  controlText: {
    fontSize: 12,
    marginTop: 4,
  },
  playlistInfo: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  playlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  playlistTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  viewPlaylistButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewPlaylistText: {
    fontWeight: '500',
  },
  channelName: {
    fontSize: 14,
  },
  // Next Videos in Playlist section
  nextVideosSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  playlistLoader: {
    marginVertical: 20,
  },
  playlistItemsContainer: {
    paddingBottom: 8,
  },
  playlistItem: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  playlistItemThumbnail: {
    position: 'relative',
    width: 120,
    height: 68,
  },
  playlistItemImage: {
    width: 120,
    height: 68,
    resizeMode: 'cover',
  },
  playlistItemDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  nowPlayingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistItemDetails: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  playlistItemTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  playlistItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistItemIndex: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
  },
  relatedSection: {
    padding: 16,
    paddingTop: 8,
  },
  relatedVideoItem: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  relatedThumbnailContainer: {
    position: 'relative',
    width: 120,
  },
  relatedThumbnail: {
    width: 120,
    height: 68,
    resizeMode: 'cover',
  },
  relatedDurationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  relatedDurationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  relatedVideoInfo: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  relatedVideoTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  relatedStatsText: {
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  notesInput: {
    borderRadius: 8,
    padding: 12,
    height: 200,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  notesCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  notesSaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  fullscreenWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 9999,
    elevation: 9999,
    flex: 1,
  },
  exitFullscreenButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    padding: 8,
    zIndex: 1001,
  },
  fullscreenControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default YouTubePlayerScreen;
