import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const Button = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = 'filled', // 'filled', 'outlined', 'text'
  color,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#CCCCCC';
    if (variant === 'outlined' || variant === 'text') return 'transparent';
    return color || '#6200ee';
  };

  const getBorderColor = () => {
    if (disabled) return '#CCCCCC';
    return color || '#6200ee';
  };

  const getTextColor = () => {
    if (disabled) return '#888888';
    if (variant === 'filled') return '#FFFFFF';
    return color || '#6200ee';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outlined' ? 1 : 0,
          borderColor:
            variant === 'outlined' ? getBorderColor() : 'transparent',
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'filled' ? '#FFFFFF' : color || '#6200ee'}
        />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Button;
