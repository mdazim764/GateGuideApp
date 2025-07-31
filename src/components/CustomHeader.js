import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../theme/ThemeContext';

const CustomHeader = ({ title, onBack, rightIcon, onRightPress }) => {
  const { theme } = useContext(ThemeContext);
  return (
    <View style={[styles.header, { backgroundColor: theme.card }]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.iconBox}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBox} />
      )}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
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
    // justifyContent: 'space-between',
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
