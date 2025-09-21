import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/CustomHeader';

const AiGuideScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your GATE preparation AI guide. How can I help you today?",
      sender: 'ai',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  const sendMessage = () => {
    if (inputMessage.trim() === '') return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response after a delay (will be replaced with API call later)
    setTimeout(() => {
      const aiResponses = [
        'Based on GATE CSE syllabus, you should focus on data structures, algorithms, and operating systems first as they have the highest weightage.',
        'For OS, I recommend starting with process management and scheduling algorithms. Would you like some practice questions on this topic?',
        'Your study plan looks good! I suggest adding 1 hour daily for solving previous year questions to improve your speed and accuracy.',
        'When studying computer networks, first master the OSI and TCP/IP models. This will give you a framework for understanding more complex topics.',
        "Don't worry about feeling overwhelmed. GATE preparation takes time. Focus on understanding concepts rather than memorizing.",
      ];

      // Random response for now
      const aiResponse = {
        id: messages.length + 2,
        text: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        sender: 'ai',
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  useEffect(() => {
    // Scroll to bottom when messages update
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <CustomHeader
        title="AI Guide"
        navigation={navigation}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
        >
          {messages.map(message => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.sender === 'user'
                  ? [styles.userBubble, { backgroundColor: theme.primary }]
                  : [styles.aiBubble, { backgroundColor: theme.card }],
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  { color: message.sender === 'user' ? '#fff' : theme.text },
                ]}
              >
                {message.text}
              </Text>
            </View>
          ))}

          {isLoading && (
            <View
              style={[
                styles.messageBubble,
                styles.aiBubble,
                { backgroundColor: theme.card },
              ]}
            >
              <View style={styles.loadingContainer}>
                <View
                  style={[
                    styles.loadingDot,
                    { backgroundColor: theme.primary },
                  ]}
                />
                <View
                  style={[
                    styles.loadingDot,
                    { backgroundColor: theme.primary },
                  ]}
                />
                <View
                  style={[
                    styles.loadingDot,
                    { backgroundColor: theme.primary },
                  ]}
                />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
          <TextInput
            style={[
              styles.input,
              { color: theme.text, backgroundColor: `${theme.text}10` },
            ]}
            placeholder="Ask me anything about GATE..."
            placeholderTextColor={`${theme.text}50`}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  inputMessage.trim() === ''
                    ? `${theme.primary}50`
                    : theme.primary,
              },
            ]}
            onPress={sendMessage}
            disabled={inputMessage.trim() === '' || isLoading}
          >
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    height: 24,
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    marginRight: 8,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AiGuideScreen;
