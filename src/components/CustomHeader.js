import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../theme/ThemeContext';

const CustomHeader = ({ title, onBack, rightIcon, onRightPress, navigation, route }) => {
  const { theme } = useContext(ThemeContext);

  // Add defensive programming to prevent errors
  const getTitle = () => {
    // Only try to access route.name if route exists
    if (!route) return title || 'GateGuide';

    switch (route.name) {
      case 'YouTubePlaylist':
        return 'YouTube Playlists';
      case 'YouTubeVideoList':
        return route.params?.playlist?.title || 'Videos';
      case 'YouTubePlayer':
        return route.params?.video?.title || 'Video Player';
      // ...existing cases
      default:
        return title || route.name;
    }
  };

  const handleBackPress = () => {
    if (!navigation) return;

    if (route?.name === 'YouTubePlayer') {
      navigation.navigate('YouTubeVideoList', route.params);
    } else if (route?.name === 'YouTubeVideoList') {
      navigation.navigate('YouTubePlaylist');
    } else if (route?.name === 'YouTubePlaylist') {
      navigation.navigate('Resources');
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: theme.card }]}>
      {onBack ? (
        <TouchableOpacity onPress={handleBackPress} style={styles.iconBox}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBox} />
      )}
      <Text style={[styles.title, { color: theme.text }]}>{getTitle()}</Text>
      {rightIcon ? (
        <TouchableOpacity onPress={onRightPress} style={styles.iconBox}>
          <Icon name={rightIcon} size={24} color={theme.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBox} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconBox: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
});

export default CustomHeader;
