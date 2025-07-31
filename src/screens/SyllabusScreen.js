import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { SYLLABUS_DATA } from '../data/subjects';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomHeader from '../components/CustomHeader';

const SyllabusScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: theme.card,
      elevation: 2,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.primary,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
    },
    itemContainer: {
      backgroundColor: theme.card,
      padding: 20,
      marginVertical: 8,
      marginHorizontal: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 2,
    },
    itemText: {
      fontSize: 16,
      color: theme.text,
      flex: 1,
      fontWeight: '500',
    },
    chevron: {
      marginLeft: 8,
    },
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      activeOpacity={0.8}
      onPress={() =>
        navigation?.navigate('SubjectDetail', { subjectId: item.id })
      }
    >
      <Text style={styles.itemText}>{item.name}</Text>
      <Icon
        name="chevron-forward"
        size={22}
        color={theme.primary}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CustomHeader title="Syllabus" onBack={() => navigation.goBack()} />
      <Text style={styles.sectionTitle}>Subjects</Text>
      <FlatList
        data={SYLLABUS_DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default SyllabusScreen;
