import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { useNotification } from '../../context/NotificationContext';

const CustomTouchable = ({ onPress, children, style, ...props }) => {
  const { unreadCount, fetchNotifications } = useNotification();

  const handlePress = () => {
    // If we have unread notifications, refresh them when navigating
    if (unreadCount > 0) {
      fetchNotifications();
    }

    // Call the original onPress handler
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={style} {...props}>
      {children}
    </TouchableOpacity>
  );
};

export default CustomTouchable;
