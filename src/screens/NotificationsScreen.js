import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/CustomHeader';
import MaterialDesignIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const NotificationsScreen = ({ navigation }) => {
  const { theme } = React.useContext(ThemeContext);
  const {
    notifications,
    loading,
    fcmToken,
    tokenRegistered,
    fetchNotifications,
    markNotificationsRead,
    markAllNotificationsRead,
    deleteNotifications,
    clearAllNotifications,
    sendTestNotification,
    refreshFcmToken,
  } = useNotification();

  const [refreshing, setRefreshing] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, unread, read
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply type filter
    if (filterType === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filterType === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        n =>
          n.title?.toLowerCase().includes(query) ||
          n.body?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [notifications, filterType, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchNotifications]);

  const handleNotificationPress = useCallback(
    notification => {
      if (isSelectionMode) {
        toggleSelection(notification.id);
      } else {
        if (!notification.read) {
          markNotificationsRead([notification.id]);
        }
        // Navigation is handled by the context based on notification type
      }
    },
    [isSelectionMode, markNotificationsRead],
  );

  const handleNotificationLongPress = useCallback(
    notification => {
      if (!isSelectionMode) {
        setIsSelectionMode(true);
        setSelectedNotifications(new Set([notification.id]));
      }
    },
    [isSelectionMode],
  );

  const toggleSelection = notificationId => {
    setSelectedNotifications(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(notificationId)) {
        newSelection.delete(notificationId);
      } else {
        newSelection.add(notificationId);
      }
      return newSelection;
    });
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedNotifications(new Set());
  };

  const handleBulkMarkRead = () => {
    const selectedIds = Array.from(selectedNotifications);
    markNotificationsRead(selectedIds);
    exitSelectionMode();
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Delete Notifications',
      `Are you sure you want to delete ${selectedNotifications.size} notification(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const selectedIds = Array.from(selectedNotifications);
            deleteNotifications(selectedIds);
            exitSelectionMode();
          },
        },
      ],
    );
  };

  const handleSendTest = useCallback(async () => {
    setTestLoading(true);
    try {
      const success = await sendTestNotification();
      if (success) {
        setTimeout(() => {
          fetchNotifications();
        }, 2000);
      }
    } catch (error) {
      console.error('Error in handleSendTest:', error);
    } finally {
      setTestLoading(false);
    }
  }, [sendTestNotification, fetchNotifications]);

  const handleRefreshToken = useCallback(async () => {
    Alert.alert(
      'Refresh FCM Token',
      'This will refresh your notification token. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refresh',
          onPress: async () => {
            try {
              const newToken = await refreshFcmToken();
              if (newToken) {
                Alert.alert('Success', 'FCM token refreshed successfully!');
              } else {
                Alert.alert('Error', 'Failed to refresh FCM token');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to refresh FCM token');
            }
          },
        },
      ],
    );
  }, [refreshFcmToken]);

  const getNotificationIcon = (type, read) => {
    const iconMap = {
      quote: 'format-quote',
      morning_quote: 'format-quote-open-outline',
      reminder: 'clock-alert-outline',
      study_reminder: 'book-clock-outline',
      task_summary: 'clipboard-clock-outline',
      streak: 'fire',
      progress: 'chart-line',
      achievement: 'trophy-outline',
      quiz_result: 'check-circle-outline',
      quiz_reminder: 'help-circle-outline',
      weekly_summary: 'chart-line',
      resource_added: 'folder-plus-outline',
      subject_progress: 'book-open-page-variant',
      test: 'bell-outline',
      default: 'bell-outline',
    };

    return iconMap[type] || iconMap.default;
  };

  const getNotificationColor = type => {
    const colorMap = {
      quote: '#2196F3',
      morning_quote: '#2196F3',
      reminder: '#FF9800',
      study_reminder: '#FF9800',
      task_summary: '#FF5722',
      streak: '#E91E63',
      progress: '#4CAF50',
      achievement: '#9C27B0',
      quiz_result: '#00BCD4',
      quiz_reminder: '#3F51B5',
      weekly_summary: '#795548',
      resource_added: '#607D8B',
      subject_progress: '#009688',
      test: theme.primary,
      default: theme.primary,
    };

    return colorMap[type] || colorMap.default;
  };

  const formatNotificationTime = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderNotification = useCallback(
    ({ item, index }) => {
      const isSelected = selectedNotifications.has(item.id);
      const notificationType = item.data?.type || item.type || 'default';
      const iconName = getNotificationIcon(notificationType, item.read);
      const iconColor = getNotificationColor(notificationType);

      return (
        <TouchableOpacity
          style={[
            styles.notificationItem,
            { backgroundColor: theme.card },
            !item.read && { backgroundColor: `${theme.primary}08` },
            !item.read && styles.unreadNotification,
            isSelected && { backgroundColor: `${theme.primary}20` },
          ]}
          onPress={() => handleNotificationPress(item)}
          onLongPress={() => handleNotificationLongPress(item)}
          activeOpacity={0.7}
        >
          {isSelectionMode && (
            <View style={styles.selectionIndicator}>
              <Icon
                name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={20}
                color={isSelected ? theme.primary : theme.textSecondary}
              />
            </View>
          )}

          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${iconColor}15` },
            ]}
          >
            <MaterialDesignIcon name={iconName} size={20} color={iconColor} />
          </View>

          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text
                style={[
                  styles.title,
                  { color: theme.text },
                  !item.read && { fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={[styles.time, { color: theme.textSecondary }]}>
                {formatNotificationTime(item.createdAt)}
              </Text>
            </View>

            <Text
              style={[styles.body, { color: theme.textSecondary }]}
              numberOfLines={2}
            >
              {item.body}
            </Text>

            {/* Show notification type as a tag */}
            {notificationType !== 'default' && (
              <View
                style={[styles.typeTag, { backgroundColor: `${iconColor}20` }]}
              >
                <Text style={[styles.typeTagText, { color: iconColor }]}>
                  {notificationType.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {!item.read && !isSelectionMode && (
            <View
              style={[styles.unreadDot, { backgroundColor: theme.primary }]}
            />
          )}
        </TouchableOpacity>
      );
    },
    [
      theme,
      selectedNotifications,
      isSelectionMode,
      handleNotificationPress,
      handleNotificationLongPress,
    ],
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search notifications..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterButtons}>
        {['all', 'unread', 'read'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              { borderColor: theme.border },
              filterType === filter && { backgroundColor: theme.primary },
            ]}
            onPress={() => setFilterType(filter)}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: filterType === filter ? '#FFFFFF' : theme.text },
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* FCM Token Status */}
      <View style={[styles.statusCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.statusTitle, { color: theme.text }]}>
          Notification Status
        </Text>

        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
            FCM Token:
          </Text>
          <Text
            style={[
              styles.statusValue,
              { color: fcmToken ? theme.success : theme.error },
            ]}
          >
            {fcmToken ? 'Available' : 'Not Available'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
            Registration:
          </Text>
          <Text
            style={[
              styles.statusValue,
              { color: tokenRegistered ? theme.success : theme.error },
            ]}
          >
            {tokenRegistered ? 'Registered' : 'Not Registered'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={handleSendTest}
          disabled={testLoading}
        >
          {testLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="bell-ring" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Send Test</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.secondary || theme.primary },
          ]}
          onPress={handleRefreshToken}
        >
          <Icon name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Refresh Token</Text>
        </TouchableOpacity>
      </View>

      {/* Bulk Actions */}
      <View style={styles.bulkActionsContainer}>
        <TouchableOpacity
          style={[styles.bulkActionButton, { borderColor: theme.border }]}
          onPress={markAllNotificationsRead}
        >
          <Icon name="eye-check" size={16} color={theme.primary} />
          <Text style={[styles.bulkActionText, { color: theme.primary }]}>
            Mark All Read
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bulkActionButton, { borderColor: theme.border }]}
          onPress={clearAllNotifications}
        >
          <Icon name="trash-can-outline" size={16} color={theme.error} />
          <Text style={[styles.bulkActionText, { color: theme.error }]}>
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {renderFilters()}
    </View>
  );

  const renderSelectionHeader = () => (
    <View style={[styles.selectionHeader, { backgroundColor: theme.primary }]}>
      <TouchableOpacity
        onPress={exitSelectionMode}
        style={styles.selectionAction}
      >
        <Icon name="close" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Text style={styles.selectionTitle}>
        {selectedNotifications.size} Selected
      </Text>

      <View style={styles.selectionActions}>
        <TouchableOpacity
          onPress={handleBulkMarkRead}
          style={styles.selectionAction}
        >
          <Icon name="eye-check" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleBulkDelete}
          style={styles.selectionAction}
        >
          <Icon name="delete" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isSelectionMode ? (
        renderSelectionHeader()
      ) : (
        <CustomHeader
          title="Notifications"
          navigation={navigation}
          onBack={() => navigation.goBack()}
          rightIcon={'settings'}
          onRightPress={() => navigation.navigate('NotificationSettings')}
          // rightComponent={
          //   <TouchableOpacity
          //     onPress={() => navigation.navigate('NotificationSettings')}
          //     style={styles.settingsButton}
          //   >
          //     <Icon name="cog" size={22} color={theme.text} />
          //   </TouchableOpacity>
          // }
        />
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading notifications...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          ListHeaderComponent={!isSelectionMode ? renderHeader : null}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name="bell-off-outline"
                size={64}
                color={`${theme.text}30`}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {searchQuery
                  ? 'No notifications found'
                  : 'No notifications yet'}
              </Text>
              <Text
                style={[styles.emptySubtext, { color: theme.textSecondary }]}
              >
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Test the notification system using the button above'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsButton: {
    padding: 8,
  },
  headerContainer: {
    padding: 16,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  bulkActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  bulkActionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectionAction: {
    padding: 8,
  },
  selectionTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectionActions: {
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    borderColor: 'green',
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF5722',
  },
  selectionIndicator: {
    marginRight: 12,
    marginTop: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  typeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    marginLeft: 8,
  },
});

export default NotificationsScreen;
