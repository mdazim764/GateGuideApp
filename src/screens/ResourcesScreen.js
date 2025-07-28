import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
import subjects from '../data/subjects';

const ResourcesScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      margin: 16,
    },
    list: {
      padding: 16,
    },
    subjectCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      elevation: 2,
    },
    subjectTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      flex: 1,
    },
    subjectTopics: {
      fontSize: 14,
      marginRight: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    sectionContainer: {
      marginVertical: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      margin: 16,
    },
    topicItem: {
      padding: 12,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 1,
    },
    topicName: {
      fontSize: 16,
      flex: 1,
    },
    weightageContainer: {
      padding: 4,
      borderRadius: 4,
    },
    weightageText: {
      fontSize: 14,
    },
    resourceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 8,
      elevation: 1,
    },
    resourceText: {
      fontSize: 16,
      marginLeft: 12,
      flex: 1,
    },
  });

  const handleSubjectPress = subject => {
    setSelectedSubject(subject);
  };

  const handleBackPress = () => {
    setSelectedSubject(null);
  };

  const openVideo = async url => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const openPdf = pdfName => {
    // In a real app, this would open the PDF viewer
    console.log(`Opening PDF: ${pdfName}`);
  };

  const renderSubjectItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.subjectCard, { backgroundColor: theme.card }]}
      onPress={() => handleSubjectPress(item)}
    >
      <Text style={[styles.subjectTitle, { color: theme.text }]}>
        {item.name}
      </Text>
      <Text style={[styles.subjectTopics, { color: theme.text }]}>
        {item.topics.length} topics
      </Text>
      <Icon name="chevron-right" size={24} color={theme.primary} />
    </TouchableOpacity>
  );

  const renderVideoItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.resourceItem, { backgroundColor: theme.card }]}
      onPress={() => openVideo(item.url)}
    >
      <Icon name="youtube" size={24} color="#FF0000" />
      <Text style={[styles.resourceText, { color: theme.text }]}>
        {item.title}
      </Text>
      <Icon name="open-in-new" size={20} color={theme.primary} />
    </TouchableOpacity>
  );

  const renderPdfItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.resourceItem, { backgroundColor: theme.card }]}
      onPress={() => openPdf(item)}
    >
      <Icon name="file-pdf-box" size={24} color="#E94057" />
      <Text style={[styles.resourceText, { color: theme.text }]}>{item}</Text>
      <Icon name="file-eye" size={20} color={theme.primary} />
    </TouchableOpacity>
  );

  if (selectedSubject) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {selectedSubject.name}
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Topics
          </Text>
          <FlatList
            data={selectedSubject.topics}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[styles.topicItem, { backgroundColor: theme.card }]}>
                <Text style={[styles.topicName, { color: theme.text }]}>
                  {item.name}
                </Text>
                <View
                  style={[
                    styles.weightageContainer,
                    { backgroundColor: `${theme.primary}20` },
                  ]}
                >
                  <Text style={[styles.weightageText, { color: theme.primary }]}>
                    Weightage: {item.weightage}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Video Playlists
          </Text>
          <FlatList
            data={selectedSubject.resources.videos}
            keyExtractor={(item, index) => `video-${index}`}
            renderItem={renderVideoItem}
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            PDF Notes
          </Text>
          <FlatList
            data={selectedSubject.resources.notes}
            keyExtractor={item => item}
            renderItem={renderPdfItem}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>Study Resources</Text>
      <FlatList
        data={subjects}
        keyExtractor={item => item.id}
        renderItem={renderSubjectItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

export default ResourcesScreen;
