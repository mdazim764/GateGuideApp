import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../components/CustomHeader';

const NotificationsScreen = ({ navigation }) => {
  const { theme } = React.useContext(ThemeContext);
  const {
    notifications,
    loading,
    fcmToken,
    tokenRegistered,
    fetchNotifications,
    markNotificationsRead,
    sendTestNotification,
    refreshFcmToken,
  } = useNotification();

  const [refreshing, setRefreshing] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

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
      if (!notification.read) {
        markNotificationsRead([notification.id]);
      }
    },
    [markNotificationsRead],
  );

  const handleSendTest = useCallback(async () => {
    setTestLoading(true);
    try {
      const success = await sendTestNotification();
      if (success) {
        // Refresh notifications after a short delay to show the new notification
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

  const renderNotification = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { backgroundColor: theme.card },
          !item.read && { backgroundColor: `${theme.primary}10` },
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationContent}>
          <Text
            style={[
              styles.title,
              { color: theme.text },
              !item.read && { fontWeight: 'bold' },
            ]}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.body, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {item.body}
          </Text>
          <Text style={[styles.time, { color: theme.textSecondary }]}>
            {new Date(item.createdAt).toLocaleDateString()}{' '}
            {new Date(item.createdAt).toLocaleTimeString()}
          </Text>
        </View>
        {!item.read && (
          <View
            style={[styles.unreadDot, { backgroundColor: theme.primary }]}
          />
        )}
      </TouchableOpacity>
    ),
    [theme, handleNotificationPress],
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

        {fcmToken && (
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
              Token:
            </Text>
            <Text style={[styles.tokenText, { color: theme.textSecondary }]}>
              {fcmToken.substring(0, 30)}...
            </Text>
          </View>
        )}
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
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <CustomHeader
        title="Notifications"
        navigation={navigation}
        rightComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate('NotificationSettings')}
            style={styles.settingsButton}
          >
            <Icon name="cog" size={22} color={theme.text} />
          </TouchableOpacity>
        }
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading notifications...
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
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
                No notifications yet
              </Text>
              <Text
                style={[styles.emptySubtext, { color: theme.textSecondary }]}
              >
                Test the notification system using the button above
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
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
  tokenText: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
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
  },
  notificationContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
});

export default NotificationsScreen;
