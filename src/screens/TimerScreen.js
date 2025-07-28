import React, { useContext } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';

const TimerScreen = () => {
  const { theme } = useContext(ThemeContext);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    timerText: {
      fontSize: 72,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 40,
    },
    buttonContainer: {
      width: '60%',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>25:00</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Start Focus Session"
          color={theme.primary}
          onPress={() => {}}
        />
      </View>
    </View>
  );
};
export default TimerScreen;
