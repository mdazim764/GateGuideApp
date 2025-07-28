import React, { useContext } from 'react';
import { View, Text, StyleSheet, Button, TextInput } from 'react-native';
import { ThemeContext } from '../theme/ThemeContext';

const AiGuideScreen = () => {
  const { theme } = useContext(ThemeContext);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 16,
    },
    chatArea: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chatText: {
      color: theme.text,
      fontSize: 16,
      textAlign: 'center',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 10,
    },
    input: {
      flex: 1,
      borderColor: theme.text,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 10,
      color: theme.text,
      marginRight: 10,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.chatArea}>
        <Text style={styles.chatText}>
          Your personal AI Guide will be here. Ask me anything about your GATE
          prep!
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.text}
          placeholder="Type your question..."
        />
        <Button title="Send" color={theme.primary} />
      </View>
    </View>
  );
};
export default AiGuideScreen;
