import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNotification } from '../context/NotificationContext';
import { ThemeContext } from '../theme/ThemeContext';

const NotificationBadge = ({ containerStyle, textStyle, size = 'medium' }) => {
  const { unreadCount } = useNotification();
  const { theme } = useContext(ThemeContext);

  if (unreadCount === 0) return null;

  const badgeSize = {
    small: { width: 16, height: 16, fontSize: 10, minWidth: 16 },
    medium: { width: 20, height: 20, fontSize: 12, minWidth: 20 },
    large: { width: 24, height: 24, fontSize: 14, minWidth: 24 },
  }[size];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: theme.error || '#F44336' },
        {
          width: badgeSize.width,
          height: badgeSize.height,
          minWidth: badgeSize.minWidth,
        },
        containerStyle,
      ]}
    >
      <Text
        style={[styles.badgeText, { fontSize: badgeSize.fontSize }, textStyle]}
      >
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default NotificationBadge;
