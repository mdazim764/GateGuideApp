import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const MoreScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  const menuItems = [
    { name: 'Planner', screen: 'Planner', icon: 'calendar-outline' },
    { name: 'Quotes', screen: 'Quotes', icon: 'quote-outline' },
    { name: 'Tracker', screen: 'Tracker', icon: 'stats-chart-outline' },
    { name: 'AI Guide', screen: 'AiGuide', icon: 'chatbubble-ellipses-outline' },
    { name: 'Syllabus', screen: 'Syllabus', icon: 'list-outline' },
    { name: 'Timer', screen: 'Timer', icon: 'time-outline' },
    { name: 'Subject Detail', screen: 'SubjectDetail', icon: 'book-outline' },
    { name: 'Quiz', screen: 'Quiz', icon: 'help-circle-outline' },
    { name: 'Settings', screen: 'Settings', icon: 'settings-outline' },
    { name: 'Analytics', screen: 'Analytics', icon: 'bar-chart-outline' },
    { name: 'Resources', screen: 'Resources', icon: 'play-circle-outline' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      {menuItems.map((item, idx) => (
        <TouchableOpacity
          key={item.screen}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 18,
            borderBottomWidth: 1,
            borderBottomColor: theme.card,
            backgroundColor: theme.card,
          }}
          onPress={() => navigation.navigate(item.screen)}
        >
          <Icon name={item.icon} size={24} color={theme.primary} />
          <Text style={{ marginLeft: 16, fontSize: 18, color: theme.text }}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default MoreScreen;