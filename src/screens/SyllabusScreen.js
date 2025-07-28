import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { SYLLABUS_DATA } from '../data/subjects';

const SyllabusScreen = () => {
  const { theme } = useContext(ThemeContext);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    itemContainer: {
      backgroundColor: theme.card,
      padding: 20,
      marginVertical: 8,
      marginHorizontal: 16,
      borderRadius: 10,
    },
    itemText: {
      fontSize: 16,
      color: theme.text,
    },
  });

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={SYLLABUS_DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
};
export default SyllabusScreen;
