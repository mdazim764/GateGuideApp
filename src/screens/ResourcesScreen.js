import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../theme/ThemeContext';
import CustomHeader from '../components/CustomHeader'; // Import your custom header

const { width } = Dimensions.get('window');

const ResourcesScreen = ({ navigation, route }) => {
  const { theme } = useContext(ThemeContext);
  // Get params if they exist
  const initialSubject = route.params?.initialSubject || 'All';
  const initialType = route.params?.initialType || 'All';
  const initialSearchQuery = route.params?.searchQuery || '';

  // Set initial state with params
  const [activeSubject, setActiveSubject] = useState(initialSubject);
  const [activeResourceType, setActiveResourceType] = useState(initialType);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);

  // Define subjects and resource types
  const subjects = [
    { id: 'All', name: 'All', abbr: 'All' },
    { id: 'Operating Systems', name: 'Operating Systems', abbr: 'OS' },
    { id: 'Data Structures', name: 'Data Structures', abbr: 'DS' },
    { id: 'Computer Networks', name: 'Computer Networks', abbr: 'CN' },
    { id: 'Algorithms', name: 'Algorithms', abbr: 'Algo' },
    { id: 'Database Systems', name: 'Database Systems', abbr: 'DBMS' },
    { id: 'Theory of Computation', name: 'Theory of Computation', abbr: 'TOC' },
    { id: 'Digital Logic', name: 'Digital Logic', abbr: 'DL' },
    { id: 'Mathematics', name: 'Mathematics', abbr: 'Math' },
  ];

  const resourceTypes = [
    { id: 'All', icon: 'view-grid', label: 'All' },
    { id: 'pdf', icon: 'file-pdf-box', label: 'PDFs' },
    { id: 'video', icon: 'video', label: 'Videos' },
    { id: 'quiz', icon: 'help-box', label: 'Quizzes' },
    { id: 'notes', icon: 'notebook', label: 'Notes' },
  ];

  // Initialize with sample data
  useEffect(() => {
    const mockResources = [
      {
        id: '1',
        title: 'Process Scheduling Algorithms',
        subject: 'Operating Systems',
        type: 'pdf',
        author: 'Dr. P. Govindarajulu',
        size: '3.2 MB',
        duration: null,
        description:
          'Comprehensive guide covering FCFS, SJF, Priority, and Round Robin scheduling algorithms with examples.',
        tags: ['process scheduling', 'CPU scheduling', 'algorithms'],
        downloads: 345,
        rating: 4.7,
        dateAdded: '2023-10-15',
      },
      {
        id: '2',
        title: 'Memory Management Techniques',
        subject: 'Operating Systems',
        type: 'video',
        author: 'Prof. Ajit Singh',
        size: null,
        duration: '28:45',
        description:
          'Visual explanation of paging, segmentation, and virtual memory concepts.',
        tags: ['memory management', 'paging', 'segmentation', 'virtual memory'],
        views: 1203,
        rating: 4.5,
        dateAdded: '2023-09-22',
      },
      {
        id: '3',
        title: 'Graph Algorithms Practice Quiz',
        subject: 'Algorithms',
        type: 'quiz',
        author: 'GATE Prep Team',
        size: null,
        duration: '45 min',
        description:
          '25 questions covering BFS, DFS, shortest path, and minimum spanning trees.',
        tags: ['graphs', 'algorithms', 'BFS', 'DFS', 'Dijkstra'],
        attempts: 856,
        rating: 4.8,
        dateAdded: '2023-11-05',
      },
      {
        id: '4',
        title: 'TCP/IP Protocol Suite',
        subject: 'Computer Networks',
        type: 'pdf',
        author: 'Prof. Neha Sharma',
        size: '5.7 MB',
        duration: null,
        description:
          'Detailed explanation of the TCP/IP protocol suite with diagrams and examples.',
        tags: ['TCP/IP', 'networking', 'protocols'],
        downloads: 512,
        rating: 4.6,
        dateAdded: '2023-08-30',
      },
      {
        id: '5',
        title: 'Database Normalization',
        subject: 'Database Systems',
        type: 'video',
        author: 'Dr. Ramesh Kumar',
        size: null,
        duration: '42:18',
        description:
          'Step-by-step tutorial on normalization forms (1NF through BCNF) with examples.',
        tags: ['database', 'normalization', 'SQL'],
        views: 978,
        rating: 4.9,
        dateAdded: '2023-10-02',
      },
      {
        id: '6',
        title: 'Binary Trees Implementation',
        subject: 'Data Structures',
        type: 'notes',
        author: 'Prof. Sunil Gupta',
        size: '1.8 MB',
        duration: null,
        description:
          'Hand-written notes covering binary tree operations, traversals, and implementations.',
        tags: ['binary trees', 'data structures', 'traversals'],
        downloads: 723,
        rating: 4.5,
        dateAdded: '2023-09-18',
      },
      {
        id: '7',
        title: 'Automata Theory Fundamentals',
        subject: 'Theory of Computation',
        type: 'pdf',
        author: 'Dr. Kavitha Raman',
        size: '4.1 MB',
        duration: null,
        description:
          'Complete study material covering finite automata, regular expressions, and formal languages.',
        tags: ['automata', 'formal languages', 'DFA', 'NFA'],
        downloads: 631,
        rating: 4.8,
        dateAdded: '2023-11-12',
      },
      {
        id: '8',
        title: 'Digital Logic Design Quiz',
        subject: 'Digital Logic',
        type: 'quiz',
        author: 'GATE Prep Team',
        size: null,
        duration: '30 min',
        description:
          '20 questions on boolean algebra, combinational and sequential circuits.',
        tags: ['digital logic', 'boolean algebra', 'circuits'],
        attempts: 542,
        rating: 4.6,
        dateAdded: '2023-10-25',
      },
      {
        id: '9',
        title: 'Probability and Statistics for CS',
        subject: 'Mathematics',
        type: 'video',
        author: 'Prof. Anand Verma',
        size: null,
        duration: '53:20',
        description:
          'Key concepts of probability, random variables, and statistical inference for computer science.',
        tags: ['probability', 'statistics', 'mathematics'],
        views: 845,
        rating: 4.7,
        dateAdded: '2023-09-08',
      },
    ];

    setResources(mockResources);
    setFilteredResources(mockResources);
  }, []);

  // Filter resources based on selected subject, type, and search query
  useEffect(() => {
    let filtered = [...resources];

    // Filter by subject
    if (activeSubject !== 'All') {
      filtered = filtered.filter(item => item.subject === activeSubject);
    }

    // Filter by resource type
    if (activeResourceType !== 'All') {
      filtered = filtered.filter(item => item.type === activeResourceType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags.some(tag => tag.toLowerCase().includes(query)),
      );
    }

    setFilteredResources(filtered);
  }, [activeSubject, activeResourceType, searchQuery, resources]);

  const getResourceTypeIcon = type => {
    const resourceType = resourceTypes.find(item => item.id === type);
    return resourceType ? resourceType.icon : 'file-document-outline';
  };

  const getResourceTypeColor = type => {
    switch (type) {
      case 'pdf':
        return '#E74C3C';
      case 'video':
        return '#3498DB';
      case 'quiz':
        return '#9B59B6';
      case 'notes':
        return '#2ECC71';
      default:
        return theme.primary;
    }
  };

  const getResourceMetadata = resource => {
    if (resource.type === 'pdf' || resource.type === 'notes') {
      return `${resource.size} • ${resource.downloads} downloads`;
    } else if (resource.type === 'video') {
      return `${resource.duration} • ${resource.views} views`;
    } else if (resource.type === 'quiz') {
      return `${resource.duration} • ${resource.attempts} attempts`;
    }
    return '';
  };

  const renderResourceItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.resourceItem, { backgroundColor: theme.card }]}
        onPress={() => {
          // Navigate to resource detail screen (to be implemented)
          console.log(`Open resource: ${item.id}`);
        }}
      >
        <View style={styles.resourceIconContainer}>
          <Icon
            name={getResourceTypeIcon(item.type)}
            size={30}
            color={getResourceTypeColor(item.type)}
          />
        </View>

        <View style={styles.resourceContent}>
          <Text
            style={[styles.resourceTitle, { color: theme.text }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <Text style={[styles.resourceSubject, { color: theme.primary }]}>
            {item.subject}
          </Text>

          <Text
            style={[styles.resourceDescription, { color: `${theme.text}90` }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>

          <View style={styles.resourceFooter}>
            <Text style={[styles.resourceMeta, { color: `${theme.text}70` }]}>
              {getResourceMetadata(item)}
            </Text>

            <View style={styles.resourceRating}>
              <Icon name="star" size={16} color="#F1C40F" />
              <Text style={[styles.ratingText, { color: theme.text }]}>
                {item.rating}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Add this function to get background images for subjects
  const getSubjectBackgroundImage = subjectId => {
    switch (subjectId) {
      case 'Operating Systems':
        return require('../assets/images/subjects/os.jpg');
      case 'Data Structures':
        return require('../assets/images/subjects/dsa.jpg');
      case 'Computer Networks':
        return require('../assets/images/subjects/cn.jpg');
      case 'Algorithms':
        return require('../assets/images/subjects/dsa.jpg');
      case 'Database Systems':
        return require('../assets/images/subjects/dbms.jpg');
      case 'Theory of Computation':
        return require('../assets/images/subjects/toc.jpg');
      case 'Digital Logic':
        return require('../assets/images/subjects/dl.jpg');
      case 'Mathematics':
        return require('../assets/images/subjects/em.jpg');
      default:
        return require('../assets/images/subjects/all.jpg');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <CustomHeader title="Resources" />
      
      {/* Add a section for YouTube content */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>
          Video Tutorials
        </Text>
        <TouchableOpacity 
          style={[styles.resourceCard, {backgroundColor: theme.card}]}
          onPress={() => navigation.navigate('YouTubePlaylist')}
        >
          <Icon name="youtube" size={24} color="red" />
          <Text style={[styles.resourceText, {color: theme.text}]}>
            Educational Playlists
          </Text>
          <Icon name="chevron-right" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>
      
      <View
        style={[styles.searchContainer, { backgroundColor: `${theme.text}10` }]}
      >
        <Icon name="magnify" size={20} color={`${theme.text}70`} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search resources..."
          placeholderTextColor={`${theme.text}50`}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={16} color={`${theme.text}70`} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.subjectFilters}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subjectFilters}
          snapToAlignment="start"
          decelerationRate="fast"
          //   backgroundColor={'#151010ff'}
        >
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles.subjectItem,
                activeSubject === subject.id && [
                  styles.activeSubjectItem,
                  { borderColor: theme.primary },
                ],
              ]}
              onPress={() => setActiveSubject(subject.id)}
            >
              <ImageBackground
                source={getSubjectBackgroundImage(subject.id)}
                style={[
                  styles.subjectBackground,
                  { backgroundColor: theme.card },
                ]}
                imageStyle={{ opacity: 0.35 }}
                resizeMode="cover"
              >
                <View
                  style={[
                    styles.subjectBadge,
                    {
                      backgroundColor:
                        activeSubject === subject.id
                          ? theme.primary
                          : `${theme.primary}50`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.subjectBadgeText,
                      {
                        color:
                          activeSubject === subject.id
                            ? '#454242ff'
                            : theme.primary,
                      },
                    ]}
                  >
                    {subject.abbr}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.subjectText,
                    {
                      color:
                        activeSubject === subject.id
                          ? theme.primary
                          : theme.text,
                      marginTop: 4, // Add a little spacing
                    },
                  ]}
                  numberOfLines={1}
                >
                  {subject.name}
                </Text>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.typeFilters}>
        {resourceTypes.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeItem,
              activeResourceType === type.id && [
                styles.activeTypeItem,
                { borderColor: theme.primary },
              ],
            ]}
            onPress={() => setActiveResourceType(type.id)}
          >
            <Icon
              name={type.icon}
              size={22}
              color={
                activeResourceType === type.id
                  ? theme.primary
                  : `${theme.text}70`
              }
            />
            <Text
              style={[
                styles.typeText,
                {
                  color:
                    activeResourceType === type.id
                      ? theme.primary
                      : `${theme.text}70`,
                },
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.resultsContainer}>
        <Text style={[styles.resultCount, { color: `${theme.text}80` }]}>
          {filteredResources.length} resource
          {filteredResources.length !== 1 ? 's' : ''} found
        </Text>

        <FlatList
          data={filteredResources}
          keyExtractor={item => item.id}
          renderItem={renderResourceItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resourcesList}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Icon name="file-search" size={64} color={`${theme.text}30`} />
              <Text
                style={[styles.emptyStateText, { color: `${theme.text}70` }]}
              >
                No resources match your search criteria
              </Text>
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  setActiveSubject('All');
                  setActiveResourceType('All');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.resetButtonText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
      <TouchableOpacity
        style={[styles.fabButton, { backgroundColor: theme.primary }]}
        onPress={() => console.log('Request new resource')}
      >
        <Icon name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: 8,
  },

  subjectFilters: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    height: 150,
    alignItems: 'center',
  },
  subjectItem: {
    // paddingHorizontal: 8,
    // paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    width: width * 0.3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    overflow: 'hidden',
    height: 130,
  },
  activeSubjectItem: {
    borderWidth: 1,
  },
  subjectBadge: {
    width: 70,
    height: 40,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  subjectBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  typeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  typeItem: {
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderColor: 'transparent',
    flex: 1,
  },
  activeTypeItem: {
    borderBottomWidth: 2,
  },
  typeText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultCount: {
    fontSize: 14,
    marginBottom: 8,
  },
  resourcesList: {
    paddingBottom: 24,
  },
  resourceItem: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resourceIconContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  resourceContent: {
    flex: 1,
    padding: 12,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  resourceSubject: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  resourceDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceMeta: {
    fontSize: 12,
  },
  resourceRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  subjectBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#302f2fff',
    // padding: 4,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#151010ff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 16,
  },
  resourceText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ResourcesScreen;
