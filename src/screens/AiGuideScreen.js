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
  Modal,
  FlatList,
  Alert,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  StatusBar,
  Image,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/CustomHeader';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const AiGuideScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [showConversationsList, setShowConversationsList] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Refs for animations
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const loadingDots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      },
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Animation for typing dots
  useEffect(() => {
    if (isLoading) {
      const animations = loadingDots.map((dot, i) => {
        return Animated.sequence([
          Animated.delay(i * 250),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]);
      });

      const loopAnimation = Animated.loop(Animated.parallel(animations));

      loopAnimation.start();

      return () => {
        loopAnimation.stop();
        loadingDots.forEach(dot => {
          dot.setValue(0);
        });
      };
    }
  }, [isLoading, loadingDots]);

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations();

    // Animation for fade in screen
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Effect to load initial welcome message if no conversation is selected
  useEffect(() => {
    if (!currentConversation && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          content:
            "Hello! I'm your GATE preparation AI guide. How can I help you today?",
          role: 'assistant',
          createdAt: new Date().toISOString(),
          isNew: true,
        },
      ]);
    }
  }, [currentConversation, messages.length]);

  // Effect to update messages when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      fetchConversationMessages(currentConversation.id);
    }
  }, [currentConversation?.id]);

  // Scroll to bottom when messages update or when keyboard appears
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, keyboardVisible]);

  const fetchConversations = async (reset = false) => {
    try {
      if (reset) {
        setPage(1);
        setLoadingConversations(true);
      }

      const currentPage = reset ? 1 : page;
      const query = searchQuery.trim()
        ? `&search=${encodeURIComponent(searchQuery)}`
        : '';

      const response = await api.ai.getConversations(currentPage, 10, query);

      if (response.data && response.data.conversations) {
        if (reset || currentPage === 1) {
          setConversations(response.data.conversations);
        } else {
          setConversations(prev => [...prev, ...response.data.conversations]);
        }

        // Check if there are more pages
        if (response.data.pagination) {
          setHasMoreConversations(
            response.data.pagination.page < response.data.pagination.pages,
          );

          if (!reset && currentPage < response.data.pagination.pages) {
            setPage(currentPage + 1);
          }
        } else {
          setHasMoreConversations(false);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      Alert.alert('Error', 'Failed to load conversations. Please try again.');
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleLoadMoreConversations = () => {
    if (hasMoreConversations && !loadingConversations) {
      fetchConversations(false);
    }
  };

  const fetchConversationMessages = async conversationId => {
    try {
      setIsLoading(true);
      const response = await api.ai.getConversation(conversationId);
      if (response.data && response.data.messages) {
        // Sort messages by createdAt and avoid duplicates
        const sortedMessages = [...response.data.messages]
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .filter(
            (message, index, self) =>
              index === self.findIndex(m => m.id === message.id),
          );

        // Mark messages as new for animation
        const messagesWithAnimation = sortedMessages.map(msg => ({
          ...msg,
          isNew: true,
        }));

        setMessages(messagesWithAnimation);
      }
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      Alert.alert('Error', 'Failed to load conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async (title = 'New Conversation') => {
    try {
      const response = await api.ai.createConversation(title);
      if (response.data) {
        setCurrentConversation(response.data);
        setMessages([]);
        // Refresh conversation list
        fetchConversations(true);
        return response.data.id;
      }
    } catch (error) {
      console.error('Error creating new conversation:', error);
      Alert.alert(
        'Error',
        'Failed to create new conversation. Please try again.',
      );
    }
  };

  const deleteConversation = async conversationId => {
    try {
      await api.ai.deleteConversation(conversationId);
      // Remove from state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      // If the deleted conversation was the current one, reset
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([
          {
            id: 'welcome',
            content:
              "Hello! I'm your GATE preparation AI guide. How can I help you today?",
            role: 'assistant',
            createdAt: new Date().toISOString(),
            isNew: true,
          },
        ]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      Alert.alert('Error', 'Failed to delete conversation. Please try again.');
    }
  };

  const renameConversation = async (conversationId, newTitle) => {
    try {
      const response = await api.ai.updateConversationTitle(conversationId, {
        title: newTitle,
      });
      if (response.data) {
        // Update in state
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId ? { ...conv, title: newTitle } : conv,
          ),
        );
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(prev => ({ ...prev, title: newTitle }));
        }
      }
    } catch (error) {
      console.error('Error renaming conversation:', error);
      Alert.alert('Error', 'Failed to rename conversation. Please try again.');
    }
  };

  const sendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const userMessageContent = inputMessage;
    setInputMessage('');
    Keyboard.dismiss();

    // Add user message to UI immediately for better UX
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      content: userMessageContent,
      role: 'user',
      createdAt: new Date().toISOString(),
      isNew: true,
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      let conversationId = currentConversation?.id;

      // If no conversation exists, create one with the first few words as title
      if (!conversationId) {
        const autoTitle =
          userMessageContent.split(' ').slice(0, 4).join(' ') + '...';
        conversationId = await createNewConversation(autoTitle);
      }

      if (conversationId) {
        // Send message to specific conversation
        const response = await api.ai.sendMessage(conversationId, {
          message: userMessageContent,
        });

        if (response.data) {
          // Replace temporary user message with actual one and add AI response
          setMessages(prev => [
            ...prev.filter(msg => msg.id !== tempUserMsg.id),
            { ...response.data.userMessage, isNew: true },
            { ...response.data.aiMessage, isNew: true },
          ]);
        }
      } else {
        // Fallback if no conversation ID (use the generic chat endpoint)
        const response = await api.ai.chat({ message: userMessageContent });

        if (response.data && response.data.conversation) {
          // Set the newly created conversation as current
          setCurrentConversation(response.data.conversation);
          // Add the messages
          setMessages([
            { ...response.data.userMessage, isNew: true },
            { ...response.data.aiMessage, isNew: true },
          ]);
          // Refresh conversation list
          fetchConversations(true);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');

      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentConversation(null);
    setMessages([
      {
        id: 'welcome',
        content:
          "Hello! I'm your GATE preparation AI guide. How can I help you today?",
        role: 'assistant',
        createdAt: new Date().toISOString(),
        isNew: true,
      },
    ]);
    setShowConversationsList(false);
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSearch = () => {
    setIsSearching(true);
    fetchConversations(true);
  };

  // Function to format message text with markdown-like syntax
  const formatMessageText = text => {
    if (!text) return [];

    // Split text by lines for processing headings and code blocks
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeContent = [];
    const formattedContent = [];

    lines.forEach((line, lineIndex) => {
      // Handle code blocks (```code```)
      if (line.startsWith('```') || line.endsWith('```')) {
        if (!inCodeBlock) {
          // Starting code block
          inCodeBlock = true;
          codeContent = [];
        } else {
          // Ending code block, render it
          formattedContent.push(
            <View
              key={`code-block-${lineIndex}`}
              style={[
                styles.codeBlock,
                { backgroundColor: theme.isDark ? '#1e1e1e' : '#f5f5f5' },
              ]}
            >
              <Text
                style={[
                  styles.codeText,
                  { color: theme.isDark ? '#e6e6e6' : '#333' },
                ]}
              >
                {codeContent.join('\n')}
              </Text>
            </View>,
          );
          inCodeBlock = false;
        }
        return;
      }

      if (inCodeBlock) {
        // Add line to code block content
        codeContent.push(line);
        return;
      }

      // Handle headings (lines starting with *)
      if (line.startsWith('* ')) {
        formattedContent.push(
          <Text
            key={`heading-${lineIndex}`}
            style={[styles.messageHeading, { color: theme.text }]}
          >
            {line.substring(2)}
          </Text>,
        );
        return;
      }

      // Handle bullet points (lines starting with - )
      if (line.trim().startsWith('- ')) {
        formattedContent.push(
          <View key={`bullet-${lineIndex}`} style={styles.bulletItem}>
            <Text style={[styles.bulletPoint, { color: theme.primary }]}>
              •
            </Text>
            <Text style={[styles.bulletText, { color: theme.text }]}>
              {line.trim().substring(2)}
            </Text>
          </View>,
        );
        return;
      }

      // Process the rest of the line for bold text and other formatting
      let parts = [];
      let lastIndex = 0;
      let boldRegex = /\*\*(.*?)\*\*/g;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        // Add text before the bold part
        if (match.index > lastIndex) {
          parts.push(
            <Text
              key={`text-${lineIndex}-${lastIndex}`}
              style={{ color: theme.text }}
            >
              {line.substring(lastIndex, match.index)}
            </Text>,
          );
        }

        // Add the bold text
        parts.push(
          <Text
            key={`bold-${lineIndex}-${match.index}`}
            style={{ fontWeight: 'bold', color: theme.text }}
          >
            {match[1]}
          </Text>,
        );

        lastIndex = match.index + match[0].length;
      }

      // Add any remaining text after the last match
      if (lastIndex < line.length) {
        parts.push(
          <Text
            key={`text-${lineIndex}-${lastIndex}`}
            style={{ color: theme.text }}
          >
            {line.substring(lastIndex)}
          </Text>,
        );
      }

      // If no formatting was found, just return the line
      if (parts.length === 0) {
        parts.push(
          <Text key={`plain-${lineIndex}`} style={{ color: theme.text }}>
            {line}
          </Text>,
        );
      }

      // For each line, wrap parts and add a line break except for the last line
      formattedContent.push(
        <Text key={`line-${lineIndex}`} style={{ lineHeight: 22 }}>
          {parts}
          {lineIndex < lines.length - 1 ? '\n' : ''}
        </Text>,
      );
    });

    return formattedContent;
  };

  const renderMessageBubble = (message, index) => {
    const isUser = message.role === 'user';
    const uniqueKey = `${message.id || 'msg'}-${index}`;

    return (
      <Animated.View
        key={uniqueKey}
        style={[
          styles.messageBubble,
          isUser ? [styles.userBubble] : [styles.aiBubble],
          { opacity: message.isNew ? fadeAnim : 1 },
          {
            transform: [
              {
                translateY: message.isNew
                  ? fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  : 0,
              },
            ],
          },
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatarContainer}>
            <View style={[styles.aiAvatar, { backgroundColor: theme.primary }]}>
              <Icon name="robot" size={16} color="#FFFFFF" />
            </View>
          </View>
        )}
        <View
          style={[
            styles.messageBubbleContent,
            isUser
              ? [styles.userBubbleContent, { backgroundColor: theme.primary }]
              : [styles.aiBubbleContent, { backgroundColor: theme.card }],
            isUser ? { marginLeft: 40 } : { marginRight: 12 },
          ]}
        >
          {isUser ? (
            <Text style={[styles.messageText, { color: '#fff' }]}>
              {message.content}
            </Text>
          ) : (
            <View>{formatMessageText(message.content)}</View>
          )}
          <Text
            style={[
              styles.messageTimestamp,
              {
                color: isUser ? '#ffffff80' : theme.textSecondary,
              },
            ]}
          >
            {formatDate(message.createdAt)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  // Custom header buttons for the AI Guide Screen
  const renderHeaderButtons = () => (
    <View style={styles.headerButtons}>
      <TouchableOpacity
        style={[styles.headerButton, { backgroundColor: `${theme.primary}20` }]}
        onPress={handleNewChat}
      >
        <Icon name="plus" size={18} color={theme.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.headerButton, { backgroundColor: `${theme.primary}20` }]}
        onPress={() => setShowConversationsList(true)}
      >
        <Icon name="history" size={18} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.rootContainer, { backgroundColor: theme.background }]}>
      {/* <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} /> */}

      <CustomHeader
        title={currentConversation?.title || 'AI Guide'}
        navigation={navigation}
        onBack={() => navigation.goBack()}
      />
      {/* {renderHeaderButtons()} */}

      <View style={styles.headerContainer}>
        {/* <CustomHeader
          title={currentConversation?.title || 'AI Guide'}
          navigation={navigation}
          onBack={() => navigation.goBack()}
        /> */}
        {renderHeaderButtons()}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.contentContainer}>
          {messages.length === 0 && !isLoading ? (
            <View style={styles.emptyStateContainer}>
              <View
                style={[
                  styles.emptyStateIconContainer,
                  { backgroundColor: `${theme.primary}10` },
                ]}
              >
                <Icon
                  name="robot"
                  size={60}
                  color={theme.primary}
                  style={styles.emptyStateIcon}
                />
              </View>
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                Start a New Conversation
              </Text>
              <Text
                style={[
                  styles.emptyStateSubtitle,
                  { color: theme.textSecondary },
                ]}
              >
                Ask me anything about GATE preparation
              </Text>

              <View style={styles.suggestionsContainer}>
                {[
                  "Explain Dijkstra's algorithm",
                  'How to prepare for GATE CSE',
                  'What is the complexity of quicksort?',
                  'Difference between process and thread',
                ].map((suggestion, index) => (
                  <Pressable
                    key={`suggestion-${index}`}
                    style={[
                      styles.suggestionButton,
                      { borderColor: theme.primary },
                    ]}
                    onPress={() => {
                      setInputMessage(suggestion);
                    }}
                  >
                    <Text
                      style={[styles.suggestionText, { color: theme.primary }]}
                    >
                      {suggestion}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatContainer}
              contentContainerStyle={[
                styles.chatContent,
                // Properly adjust content padding when keyboard is visible
                {
                  paddingBottom:
                    100 + (keyboardVisible ? keyboardHeight * 0.5 : 0),
                },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((message, index) =>
                renderMessageBubble(message, index),
              )}

              {isLoading && (
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  <View style={styles.aiAvatarContainer}>
                    <View
                      style={[
                        styles.aiAvatar,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      <Icon name="robot" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                  <View
                    style={[
                      styles.messageBubbleContent,
                      styles.aiBubbleContent,
                      { backgroundColor: theme.card, marginRight: 12 },
                    ]}
                  >
                    <View style={styles.loadingContainer}>
                      {loadingDots.map((dot, i) => (
                        <Animated.View
                          key={`dot-${i}`}
                          style={[
                            styles.loadingDot,
                            {
                              backgroundColor: theme.primary,
                              opacity: dot,
                              transform: [
                                {
                                  scale: dot.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.7, 1],
                                  }),
                                },
                              ],
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Input area - fixed at bottom */}
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.card,
                paddingBottom:
                  Platform.OS === 'ios'
                    ? Math.max(keyboardVisible ? 5 : insets.bottom, 8)
                    : 8,
              },
            ]}
          >
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
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    inputMessage.trim() === '' || isLoading
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
        </View>
      </KeyboardAvoidingView>

      {/* Conversations List Modal */}
      <Modal
        visible={showConversationsList}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConversationsList(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: '#00000080' }]}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.background,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Conversations
              </Text>
              <TouchableOpacity
                onPress={() => setShowConversationsList(false)}
                style={[
                  styles.closeButton,
                  { backgroundColor: `${theme.text}10` },
                ]}
              >
                <Icon name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View
              style={[
                styles.searchContainer,
                { backgroundColor: `${theme.text}10` },
              ]}
            >
              <Icon name="magnify" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search conversations..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    if (isSearching) {
                      fetchConversations(true);
                    }
                  }}
                >
                  <Icon
                    name="close-circle"
                    size={16}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.newChatButton, { backgroundColor: theme.primary }]}
              onPress={handleNewChat}
            >
              <Icon name="plus" size={18} color="#FFF" />
              <Text style={styles.newChatText}>New Chat</Text>
            </TouchableOpacity>

            {loadingConversations && page === 1 ? (
              <ActivityIndicator
                color={theme.primary}
                style={styles.conversationsLoading}
                size="large"
              />
            ) : (
              <FlatList
                data={conversations}
                keyExtractor={(item, index) =>
                  `conversation-${item.id}-${index}`
                }
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[
                      styles.conversationItem,
                      currentConversation?.id === item.id && {
                        backgroundColor: `${theme.primary}20`,
                      },
                    ]}
                    onPress={() => {
                      setCurrentConversation(item);
                      setShowConversationsList(false);
                    }}
                  >
                    <Icon
                      name="chat-outline"
                      size={22}
                      color={theme.primary}
                      style={styles.conversationIcon}
                    />
                    <View style={styles.conversationContent}>
                      <Text
                        style={[
                          styles.conversationTitle,
                          { color: theme.text },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.conversationDate,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {new Date(item.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={styles.conversationActions}>
                      <TouchableOpacity
                        style={[
                          styles.conversationAction,
                          { backgroundColor: `${theme.text}10` },
                        ]}
                        onPress={() => {
                          // Prompt for new title
                          Alert.prompt(
                            'Rename',
                            'Enter a new title for this conversation:',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'OK',
                                onPress: title => {
                                  if (title?.trim()) {
                                    renameConversation(item.id, title.trim());
                                  }
                                },
                              },
                            ],
                            'plain-text',
                            item.title,
                          );
                        }}
                      >
                        <Icon
                          name="pencil"
                          size={16}
                          color={theme.textSecondary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.conversationAction,
                          { backgroundColor: `${theme.error || '#F44336'}10` },
                        ]}
                        onPress={() => {
                          Alert.alert(
                            'Delete Conversation',
                            'Are you sure you want to delete this conversation?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                onPress: () => deleteConversation(item.id),
                                style: 'destructive',
                              },
                            ],
                          );
                        }}
                      >
                        <Icon
                          name="delete"
                          size={16}
                          color={theme.error || '#F44336'}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyConversationContainer}>
                    <Icon
                      name="chat-outline"
                      size={50}
                      color={`${theme.text}30`}
                    />
                    <Text
                      style={[styles.emptyList, { color: theme.textSecondary }]}
                    >
                      {searchQuery.trim()
                        ? 'No conversations match your search'
                        : 'No conversations yet'}
                    </Text>
                  </View>
                }
                onEndReached={handleLoadMoreConversations}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  loadingConversations && page > 1 ? (
                    <ActivityIndicator
                      color={theme.primary}
                      style={styles.footerLoading}
                    />
                  ) : null
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
    width: '100%',
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 80, // Make room for input box
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '100%',
  },
  messageBubbleContent: {
    padding: 14,
    borderRadius: 18,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  userBubble: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  userBubbleContent: {
    borderBottomRightRadius: 4,
  },
  aiBubbleContent: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 4,
  },
  messageTimestamp: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
  aiAvatarContainer: {
    alignSelf: 'flex-start',
    marginRight: 8,
    marginTop: 2,
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  loadingDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 10,
    alignItems: 'flex-end',
    width: '100%',
    zIndex: 10, // Ensure it stays on top
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    marginRight: 10,
    maxHeight: 120,
    fontSize: 16,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 22,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  newChatButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  newChatText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  conversationIcon: {
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  conversationDate: {
    fontSize: 12,
  },
  conversationActions: {
    flexDirection: 'row',
  },
  conversationAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyList: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 12,
  },
  conversationsLoading: {
    marginVertical: 40,
  },
  footerLoading: {
    marginVertical: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateIcon: {},
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyConversationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  codeBlock: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  bulletItem: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: 18,
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  suggestionButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
  },
  suggestionText: {
    fontSize: 14,
  },
});

export default AiGuideScreen;
