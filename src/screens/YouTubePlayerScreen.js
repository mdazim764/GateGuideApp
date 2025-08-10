import React, { useState, useContext, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Dimensions, ActivityIndicator, Image, Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
import YoutubeIframe from 'react-native-youtube-iframe';
import CustomHeader from '../components/CustomHeader';

const { width } = Dimensions.get('window');

const YouTubePlayerScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  const { video, playlist } = route.params || {};
  
  const [playing, setPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(video);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const scrollViewRef = React.useRef(null);
  
  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setPlaying(false);
    }
    if (state === 'playing') {
      setLoading(false);
    }
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomHeader title={currentVideo?.title || "Video Player"} />
      
      <View style={styles.playerContainer}>
        {loading && (
          <View style={[styles.loadingOverlay, { backgroundColor: theme.background }]}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}
        
        <YoutubeIframe
          height={width * 0.5625}
          width={width}
          play={playing}
          videoId={currentVideo?.videoId}
          onChangeState={onStateChange}
        />
      </View>
      
      <View style={styles.videoControls}>
        <TouchableOpacity onPress={() => setPlaying(!playing)}>
          <Icon 
            name={playing ? "pause-circle" : "play-circle"} 
            size={40} 
            color={theme.primary} 
          />
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
              <Icon name="eye-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.viewsText, { color: theme.textSecondary }]}>
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
                <Icon name="share-outline" size={24} color={theme.primary} />
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
                  style={[styles.viewPlaylistText, { color: theme.primary }]}
                >
                  View Playlist
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.channelName, { color: theme.textSecondary }]}>
              {playlist.channelName}
            </Text>
          </View>
        )}

        <View style={styles.relatedSection}>
          <Text style={[styles.relatedTitle, { color: theme.text }]}>
            Related Videos
          </Text>

          {relatedVideos.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.relatedVideoItem, { backgroundColor: theme.card }]}
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
                  <Text style={styles.relatedDurationText}>{item.duration}</Text>
                </View>
              </View>

              <View style={styles.relatedVideoInfo}>
                <Text
                  style={[styles.relatedVideoTitle, { color: theme.text }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                <Text style={[styles.relatedStatsText, { color: theme.textSecondary }]}>
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
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Add Notes
            </Text>
            <TextInput
              style={[styles.notesInput, { color: theme.text, backgroundColor: `${theme.background}50` }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Write your notes here..."
              placeholderTextColor={`${theme.text}50`}
            />
            <View style={styles.notesActions}>
              <TouchableOpacity
                style={[styles.notesCancelButton, { borderColor: theme.textSecondary }]}
                onPress={() => setNotesModalVisible(false)}
              >
                <Text style={{ color: theme.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.notesSaveButton, { backgroundColor: theme.primary }]}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playerContainer: {
    width: width,
    height: width * 0.5625, // 16:9 aspect ratio
    backgroundColor: 'black',
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
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
  relatedSection: {
    padding: 16,
    paddingTop: 0,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
    backgroundColor: '#FFFFFF',
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
});

export default YouTubePlayerScreen;
